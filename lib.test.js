const { perl_versions, decode_version } = require('./lib');

function sorted(arr) {
    return [...arr].sort((a, b) => {
        if (a === 'devel') return 1;
        if (b === 'devel') return -1;
        const va = decode_version(a);
        const vb = decode_version(b);
        return va.compare(vb);
    });
}

describe('perl_versions', () => {
    // CI matrix parity tests
    test('since 5.20 includes 5.20', () => {
        const result = perl_versions({ since_perl: decode_version('5.20'), until_perl: null, with_devel: false });
        expect(result).toContain('5.20');
    });

    test('since 5.20 includes versions greater than 5.20', () => {
        const result = perl_versions({ since_perl: decode_version('5.20'), until_perl: null, with_devel: false });
        expect(result).toContain('5.30');
        expect(result).toContain('5.42');
    });

    test('since 5.20 without devel excludes devel', () => {
        const result = perl_versions({ since_perl: decode_version('5.20'), until_perl: null, with_devel: false });
        expect(result).not.toContain('devel');
    });

    test('since 5.20 excludes versions older than 5.20', () => {
        const result = perl_versions({ since_perl: decode_version('5.20'), until_perl: null, with_devel: false });
        expect(result).not.toContain('5.8');
        expect(result).not.toContain('5.18');
    });

    test('since 5.36 with devel includes devel', () => {
        const result = perl_versions({ since_perl: decode_version('5.36'), until_perl: null, with_devel: true });
        expect(result).toContain('devel');
        expect(result).toContain('5.36');
        expect(result).toContain('5.42');
        expect(result).not.toContain('5.34');
    });

    test('since 5.36 with devel: each non-devel version >= 5.36', () => {
        const result = perl_versions({ since_perl: decode_version('5.36'), until_perl: null, with_devel: true });
        for (const v of result) {
            if (v === 'devel') continue;
            expect(decode_version(v).compare(decode_version('5.36'))).toBeGreaterThanOrEqual(0);
        }
    });

    test('since 5.24 until 5.32 returns only versions in that range', () => {
        const result = perl_versions({ since_perl: decode_version('5.24'), until_perl: decode_version('5.32'), with_devel: false });
        expect(result).toContain('5.24');
        expect(result).toContain('5.32');
        expect(result).not.toContain('5.22');
        expect(result).not.toContain('5.34');
        for (const v of result) {
            const ver = decode_version(v);
            expect(ver.compare(decode_version('5.24'))).toBeGreaterThanOrEqual(0);
            expect(ver.compare(decode_version('5.32'))).toBeLessThanOrEqual(0);
        }
    });

    test('result order is sorted ascending', () => {
        const result = perl_versions({ since_perl: decode_version('5.24'), until_perl: decode_version('5.32'), with_devel: false });
        expect(result).toEqual(sorted(result));
    });

    test('with devel and until-perl still includes devel', () => {
        const result = perl_versions({ since_perl: decode_version('5.36'), until_perl: decode_version('5.40'), with_devel: true });
        expect(result).toContain('devel');
        expect(result).toContain('5.36');
        expect(result).toContain('5.40');
    });

    test('single version (since === until)', () => {
        const result = perl_versions({ since_perl: decode_version('5.32'), until_perl: decode_version('5.32'), with_devel: false });
        expect(result).toContain('5.32');
        expect(result).toHaveLength(1);
    });

    test('since 5.6 until 5.14 includes 5.8 and excludes 5.6', () => {
        const result = perl_versions({ since_perl: decode_version('5.6'), until_perl: decode_version('5.14'), with_devel: false });
        expect(result).toContain('5.8');
        expect(result).toContain('5.14');
        expect(result).not.toContain('5.6');
        expect(result).not.toContain('5.16');
    });

    // Edge cases
    test('since latest version returns only that version', () => {
        const result = perl_versions({ since_perl: decode_version('5.42'), until_perl: null, with_devel: false });
        expect(result).toContain('5.42');
        expect(result).toHaveLength(1);
    });

    test('since latest version with devel returns version + devel', () => {
        const result = perl_versions({ since_perl: decode_version('5.42'), until_perl: null, with_devel: true });
        expect(result).toContain('5.42');
        expect(result).toContain('devel');
    });

    test('since future version returns empty list', () => {
        const result = perl_versions({ since_perl: decode_version('5.100'), until_perl: null, with_devel: false });
        expect(result).toHaveLength(0);
    });

    test('devel is excluded by default', () => {
        const result = perl_versions({ since_perl: decode_version('5.8'), until_perl: null, with_devel: false });
        expect(result).not.toContain('devel');
    });

    test('until-perl does not exclude devel when with-devel is true', () => {
        const result = perl_versions({ since_perl: decode_version('5.40'), until_perl: decode_version('5.40'), with_devel: true });
        expect(result).toContain('5.40');
        expect(result).toContain('devel');
    });

    test('v-prefixed input works via decode_version', () => {
        const result = perl_versions({ since_perl: decode_version('v5.30'), until_perl: decode_version('v5.34'), with_devel: false });
        expect(result).toContain('5.30');
        expect(result).toContain('5.34');
        expect(result).not.toContain('5.28');
        expect(result).not.toContain('5.36');
    });
});
