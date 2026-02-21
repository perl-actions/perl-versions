const { perl_versions, decode_version } = require ('./perl-versions');

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
});

describe ('perl_versions ()', () => {
    const act = (options) => perl_versions ({
        since_perl: options.since_perl ? decode_version (options.since_perl) : undefined,
        until_perl: options.until_perl ? decode_version (options.until_perl) : undefined,
        with_devel: options.with_devel,
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
});
