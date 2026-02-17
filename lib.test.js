const semver = require('semver');
const { available, filterVersions } = require('./lib');

describe('available versions', () => {
    test('contains expected range from 5.8 to 5.42 plus devel', () => {
        expect(available[0]).toBe('5.8');
        expect(available[available.length - 1]).toBe('devel');
        expect(available).toContain('5.20');
        expect(available).toContain('5.42');
    });

    test('all non-devel entries are valid semver-coercible', () => {
        for (const v of available.filter(v => v !== 'devel')) {
            expect(semver.coerce(v)).not.toBeNull();
        }
    });

    test('versions are in ascending order', () => {
        const numeric = available.filter(v => v !== 'devel').map(v => semver.coerce(v));
        for (let i = 1; i < numeric.length; i++) {
            expect(semver.gt(numeric[i], numeric[i - 1])).toBe(true);
        }
    });
});

describe('filterVersions', () => {
    // Mirror the CI workflow matrix test cases
    test('since v5.20 returns 5.20 through 5.42', () => {
        const result = filterVersions(semver.coerce('5.20'), null, false);
        expect(result).toEqual([
            '5.20', '5.22', '5.24', '5.26', '5.28',
            '5.30', '5.32', '5.34', '5.36', '5.38',
            '5.40', '5.42',
        ]);
    });

    test('since 5.36 with devel includes devel', () => {
        const result = filterVersions(semver.coerce('5.36'), null, true);
        expect(result).toEqual(['5.36', '5.38', '5.40', '5.42', 'devel']);
    });

    test('since 5.24 until 5.32 returns bounded range', () => {
        const result = filterVersions(semver.coerce('5.24'), semver.coerce('5.32'), false);
        expect(result).toEqual(['5.24', '5.26', '5.28', '5.30', '5.32']);
    });

    test('with devel and until-perl still includes devel', () => {
        const result = filterVersions(semver.coerce('5.36'), semver.coerce('5.40'), true);
        expect(result).toEqual(['5.36', '5.38', '5.40', 'devel']);
    });

    test('single version (since === until)', () => {
        const result = filterVersions(semver.coerce('5.32'), semver.coerce('5.32'), false);
        expect(result).toEqual(['5.32']);
    });

    test('oldest supported: since 5.6 until 5.14 starts at 5.8', () => {
        const result = filterVersions(semver.coerce('5.6'), semver.coerce('5.14'), false);
        expect(result).toEqual(['5.8', '5.10', '5.12', '5.14']);
    });

    // Edge cases
    test('since latest version returns only that version', () => {
        const result = filterVersions(semver.coerce('5.42'), null, false);
        expect(result).toEqual(['5.42']);
    });

    test('since latest version with devel returns version + devel', () => {
        const result = filterVersions(semver.coerce('5.42'), null, true);
        expect(result).toEqual(['5.42', 'devel']);
    });

    test('since very old version returns all versions', () => {
        const result = filterVersions(semver.coerce('5.6'), null, false);
        expect(result).toEqual(available.filter(v => v !== 'devel'));
    });

    test('since future version returns empty list', () => {
        const result = filterVersions(semver.coerce('5.100'), null, false);
        expect(result).toEqual([]);
    });

    test('devel is excluded by default', () => {
        const result = filterVersions(semver.coerce('5.8'), null, false);
        expect(result).not.toContain('devel');
    });

    test('until-perl does not exclude devel when with-devel is true', () => {
        const result = filterVersions(semver.coerce('5.40'), semver.coerce('5.40'), true);
        expect(result).toEqual(['5.40', 'devel']);
    });

    test('v-prefixed input works via semver.coerce', () => {
        const result = filterVersions(semver.coerce('v5.30'), semver.coerce('v5.34'), false);
        expect(result).toEqual(['5.30', '5.32', '5.34']);
    });
});
