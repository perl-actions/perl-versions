const { perl_versions, decode_version, latest_stable_version, resolve_single_out, available_targets } = require ('./perl-versions');

describe ('decode_version', () => {
    test ('parses numeric version string', () => {
        const v = decode_version ('5.20');
        expect (v).not.toBeNull ();
        expect (v.major).toBe (5);
        expect (v.minor).toBe (20);
    });

    test ('parses v-prefixed version string', () => {
        const v = decode_version ('v5.30');
        expect (v).not.toBeNull ();
        expect (v.major).toBe (5);
        expect (v.minor).toBe (30);
    });

    test ('returns null for empty string', () => {
        expect (decode_version ('')).toBeNull ();
    });

    test ('returns null for null input', () => {
        expect (decode_version (null)).toBeNull ();
    });

    test ('normalizes patch version to major.minor', () => {
        const v = decode_version ('5.8.1');
        expect (v).not.toBeNull ();
        expect (v.major).toBe (5);
        expect (v.minor).toBe (8);
        expect (v.patch).toBe (0);
    });

    test ('normalizes three-part version to major.minor', () => {
        const v = decode_version ('5.36.3');
        expect (v).not.toBeNull ();
        expect (v.major).toBe (5);
        expect (v.minor).toBe (36);
        expect (v.patch).toBe (0);
    });

    test ('resolves latest to the highest stable version', () => {
        const v = decode_version ('latest');
        expect (v).not.toBeNull ();
        expect (v.major).toBe (5);
        expect (v.minor).toBe (decode_version (latest_stable_version ()).minor);
    });
});

describe ('latest_stable_version', () => {
    test ('returns the highest non-devel version', () => {
        const latest = latest_stable_version ();
        expect (latest).not.toBe ('devel');
        expect (latest).toMatch (/^\d+\.\d+$/);
    });

    test ('returns a version present in the available list', () => {
        const latest = latest_stable_version ();
        const result = perl_versions ({ since_perl: decode_version (latest) });
        expect (result).toContain (latest);
    });
});

describe ('perl_versions ()', () => {
    const act = (options) => perl_versions ({
        since_perl: options.since_perl ? decode_version (options.since_perl) : undefined,
        until_perl: options.until_perl ? decode_version (options.until_perl) : undefined,
        with_devel: options.with_devel,
        target: options.target,
    });

    describe ('with since_perl=5.20', () => {
        const result = act ({ since_perl: '5.20' });

        test ('it should include version 5.20 itself', () => {
            expect (result).toContain ('5.20');
        });

        test ('it should include versions newer than 5.20', () => {
            expect (result).toContain ('5.30');
            expect (result).toContain ('5.42');
        });

        test ('it should not include versions older than 5.20', () => {
            expect (result).not.toContain ('5.8');
            expect (result).not.toContain ('5.18');
        });

        test ('it should not include devel by default', () => {
            expect (result).not.toContain ('devel');
        });
    });

    describe ('with since_perl=5.36 and with_devel', () => {
        const result = act ({ since_perl: '5.36', with_devel: true });

        test ('it should include devel', () => {
            expect (result).toContain ('devel');
        });

        test ('it should include since version', () => {
            expect (result).toContain ('5.36');
        });

        test ('it should not include versions older than 5.36', () => {
            expect (result).not.toContain ('5.34');
        });

        test ('each non-devel version should be >= 5.36', () => {
            for (const v of result) {
                if (v === 'devel') continue;
                expect (decode_version (v).compare (decode_version ('5.36'))).toBeGreaterThanOrEqual (0);
            }
        });
    });

    describe ('with since_perl=5.24 and until_perl=5.32', () => {
        const result = act ({ since_perl: '5.24', until_perl: '5.32' });
        const expected = ['5.24', '5.26', '5.28', '5.30', '5.32'];

        test ('it should contain all versions in the range', () => {
            for (const v of expected) {
                expect (result).toContain (v);
            }
        });

        test ('it should contain exactly the expected number of versions', () => {
            expect (result).toHaveLength (expected.length);
        });
    });

    describe ('with devel and until_perl', () => {
        const result = act ({ since_perl: '5.36', until_perl: '5.40', with_devel: true });

        test ('it should include devel even with until_perl set', () => {
            expect (result).toContain ('devel');
        });

        test ('it should include boundary versions', () => {
            expect (result).toContain ('5.36');
            expect (result).toContain ('5.40');
        });
    });

    describe ('with exact version (since === until)', () => {
        const result = act ({ since_perl: '5.32', until_perl: '5.32' });

        test ('it should return exactly that version', () => {
            expect (result).toContain ('5.32');
            expect (result).toHaveLength (1);
        });
    });

    describe ('with since_perl below available range', () => {
        const result = act ({ since_perl: '5.6', until_perl: '5.14' });

        test ('it should include the lowest available version', () => {
            expect (result).toContain ('5.8');
        });

        test ('it should include the upper bound', () => {
            expect (result).toContain ('5.14');
        });

        test ('it should not include 5.6 (not in available list)', () => {
            expect (result).not.toContain ('5.6');
        });

        test ('it should not include versions above the range', () => {
            expect (result).not.toContain ('5.16');
        });
    });

    describe ('with since_perl above all available versions', () => {
        const result = act ({ since_perl: '5.100' });

        test ('it should return an empty list', () => {
            expect (result).toHaveLength (0);
        });
    });

    describe ('with v-prefixed input', () => {
        const result = act ({ since_perl: 'v5.30', until_perl: 'v5.34' });

        test ('it should handle v-prefix via decode_version', () => {
            expect (result).toContain ('5.30');
            expect (result).toContain ('5.34');
            expect (result).not.toContain ('5.28');
            expect (result).not.toContain ('5.36');
        });
    });

    describe ('devel with exact version', () => {
        const result = act ({ since_perl: '5.40', until_perl: '5.40', with_devel: true });

        test ('it should include devel alongside the exact version', () => {
            expect (result).toContain ('5.40');
            expect (result).toContain ('devel');
        });
    });

    describe ('with since_perl=latest', () => {
        const result = act ({ since_perl: 'latest' });

        test ('it should return only the latest stable version', () => {
            expect (result).toContain (latest_stable_version ());
            expect (result).toHaveLength (1);
        });

        test ('it should not include devel', () => {
            expect (result).not.toContain ('devel');
        });
    });

    describe ('with since_perl=latest and with_devel', () => {
        const result = act ({ since_perl: 'latest', with_devel: true });

        test ('it should include the latest stable version', () => {
            expect (result).toContain (latest_stable_version ());
        });

        test ('it should include devel', () => {
            expect (result).toContain ('devel');
        });

        test ('it should return exactly 2 entries', () => {
            expect (result).toHaveLength (2);
        });
    });

    describe ('with until_perl=latest', () => {
        const result = act ({ since_perl: '5.38', until_perl: 'latest' });

        test ('it should include versions up to latest', () => {
            expect (result).toContain ('5.38');
            expect (result).toContain (latest_stable_version ());
        });

        test ('it should not include devel', () => {
            expect (result).not.toContain ('devel');
        });
    });

    describe ('with since_perl=latest and until_perl=latest', () => {
        const result = act ({ since_perl: 'latest', until_perl: 'latest' });

        test ('it should return exactly one version', () => {
            expect (result).toHaveLength (1);
            expect (result).toContain (latest_stable_version ());
        });
    });

    describe ('with patch version in since_perl (issue #8)', () => {
        const result = act ({ since_perl: '5.8.1', until_perl: '5.14' });

        test ('it should include 5.8 despite patch version input', () => {
            expect (result).toContain ('5.8');
        });

        test ('it should include versions up to the upper bound', () => {
            expect (result).toContain ('5.10');
            expect (result).toContain ('5.14');
        });
    });

    describe ('with patch version in until_perl', () => {
        const result = act ({ since_perl: '5.30', until_perl: '5.36.3' });

        test ('it should include the upper bound series', () => {
            expect (result).toContain ('5.36');
        });

        test ('it should not include versions beyond the series', () => {
            expect (result).not.toContain ('5.38');
        });
    });

    describe ('with target parameter', () => {
        test ('defaults to perl-tester when no target specified', () => {
            const result = act ({ since_perl: '5.20' });
            const explicit = act ({ since_perl: '5.20', target: 'perl-tester' });
            expect (result).toEqual (explicit);
        });

        test ('perl target includes 5.42', () => {
            const result = act ({ since_perl: '5.40', target: 'perl' });
            expect (result).toContain ('5.40');
            expect (result).toContain ('5.42');
        });

        test ('perl-tester target includes 5.42', () => {
            const result = act ({ since_perl: '5.40', target: 'perl-tester' });
            expect (result).toContain ('5.40');
            expect (result).toContain ('5.42');
        });

        test ('windows-strawberry target does not include 5.8', () => {
            const result = act ({ since_perl: '5.8', target: 'windows-strawberry' });
            expect (result).not.toContain ('5.8');
        });

        test ('windows-strawberry target includes 5.14', () => {
            const result = act ({ since_perl: '5.14', target: 'windows-strawberry' });
            expect (result).toContain ('5.14');
        });

        test ('windows-strawberry target does not include devel', () => {
            const result = act ({ since_perl: '5.38', with_devel: true, target: 'windows-strawberry' });
            expect (result).not.toContain ('devel');
        });

        test ('macos target includes 5.8 through 5.42', () => {
            const result = act ({ since_perl: '5.8', target: 'macos' });
            expect (result).toContain ('5.8');
            expect (result).toContain ('5.42');
        });

        test ('throws on unknown target', () => {
            expect (() => act ({ since_perl: '5.20', target: 'unknown' }))
                .toThrow ('Unknown target');
        });
    });
});

describe ('available_targets ()', () => {
    test ('returns all supported targets', () => {
        const targets = available_targets ();
        expect (targets).toContain ('perl');
        expect (targets).toContain ('perl-tester');
        expect (targets).toContain ('macos');
        expect (targets).toContain ('windows-strawberry');
    });

    test ('returns an array', () => {
        expect (Array.isArray (available_targets ())).toBe (true);
    });
});

describe ('resolve_single_out ()', () => {
    const versions = ['5.30', '5.32', '5.34', '5.36', '5.38', '5.40', '5.42'];

    describe ('single-out=oldest', () => {
        const result = resolve_single_out ([...versions, 'devel'], 'oldest');

        test ('it should single out the oldest version', () => {
            expect (result.single_out).toBe ('5.30');
            expect (result.versions).not.toContain ('5.30');
            expect (result.versions).toContain ('5.32');
            expect (result.versions).toContain ('5.42');
            expect (result.versions).toContain ('devel');
        });
    });

    describe ('single-out=newest; with-devel=true', () => {
        const result = resolve_single_out ([...versions, 'devel'], 'newest');

        test ('it should single out the newest non-devel version', () => {
            expect (result.single_out).toBe ('5.42');
            expect (result.versions).not.toContain ('5.42');
            expect (result.versions).toContain ('devel');
        });
    });

    describe ('single-out=newest; with-devel=false', () => {
        const result = resolve_single_out (versions, 'newest');

        test ('it should single out the last version', () => {
            expect (result.single_out).toBe ('5.42');
        });
    });

    describe ('single-out=latest', () => {
        const result = resolve_single_out (versions, 'latest');

        test ('it should single out the newest version (alias for newest)', () => {
            expect (result.single_out).toBe ('5.42');
        });
    });

    describe ('single-out=devel; with-devel=true', () => {
        const result = resolve_single_out ([...versions, 'devel'], 'devel');

        test ('it should single out devel', () => {
            expect (result.single_out).toBe ('devel');
            expect (result.versions).not.toContain ('devel');
            expect (result.versions).toHaveLength (7);
        });
    });

    describe ('single-out=devel; with-devel=false', () => {
        const result = resolve_single_out (versions, 'devel');

        test ('it should return null and not modify the versions list', () => {
            expect (result.single_out).toBeNull ();
            expect (result.versions).toEqual (versions);
        });
    });

    describe ('single-out=5.36', () => {
        const result = resolve_single_out ([...versions, 'devel'], '5.36');

        test ('it should single out the specified version', () => {
            expect (result.single_out).toBe ('5.36');
            expect (result.versions).not.toContain ('5.36');
        });
    });

    describe ('single-out=5.20 (not in list)', () => {
        const result = resolve_single_out ([...versions, 'devel'], '5.20');

        test ('it should return the version even if not in the list', () => {
            expect (result.single_out).toBe ('5.20');
            expect (result.versions).toEqual ([...versions, 'devel']);
        });
    });

    describe ('single-out=v5.36', () => {
        const result = resolve_single_out ([...versions, 'devel'], 'v5.36');

        test ('it should resolve the version via decode_version', () => {
            expect (result.single_out).toBe ('5.36');
        });
    });

    describe ('single-out=""', () => {
        const result = resolve_single_out ([...versions, 'devel'], '');

        test ('it should return null and not modify the versions list', () => {
            expect (result.single_out).toBeNull ();
            expect (result.versions).toEqual ([...versions, 'devel']);
        });
    });

    describe ('single-out=null', () => {
        const result = resolve_single_out ([...versions, 'devel'], null);

        test ('it should return null', () => {
            expect (result.single_out).toBeNull ();
        });
    });

    describe ('single-out=oldest; single-element list', () => {
        const result = resolve_single_out (['5.32'], 'oldest');

        test ('it should single out the only version', () => {
            expect (result.single_out).toBe ('5.32');
            expect (result.versions).toHaveLength (0);
        });
    });
});
