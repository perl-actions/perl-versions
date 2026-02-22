const semver = require('semver');

const available_versions = {
    'perl': [
        '5.8',
        '5.10', '5.12', '5.14', '5.16', '5.18',
        '5.20', '5.22', '5.24', '5.26', '5.28',
        '5.30', '5.32', '5.34', '5.36', '5.38',
        '5.40', '5.42',
        'devel',
    ],
    'perl-tester': [
        '5.8',
        '5.10', '5.12', '5.14', '5.16', '5.18',
        '5.20', '5.22', '5.24', '5.26', '5.28',
        '5.30', '5.32', '5.34', '5.36', '5.38',
        '5.40', '5.42',
        'devel',
    ],
    'macos': [
        '5.8',
        '5.10', '5.12', '5.14', '5.16', '5.18',
        '5.20', '5.22', '5.24', '5.26', '5.28',
        '5.30', '5.32', '5.34', '5.36', '5.38',
        '5.40', '5.42',
        'devel',
    ],
    'windows-strawberry': [
        '5.14', '5.16', '5.18',
        '5.20', '5.22', '5.24', '5.26', '5.28',
        '5.30', '5.32', '5.34', '5.36', '5.38',
        '5.40',
    ],
};

function decode_version(input) {
    const version = semver.coerce(input);
    if (!version) {
        return null;
    }
    // Normalize to major.minor.0 — available versions are major.minor only,
    // so "5.8.1" should match the "5.8" series (resolves #8)
    return semver.coerce(`${version.major}.${version.minor}`);
}

function perl_versions({
    since_perl,
    until_perl,
    with_devel,
    target = 'perl-tester'
} = {}) {
    const versions = available_versions[target];
    if (!versions) {
        throw new Error(`Unknown target: '${target}'. Available targets: ${Object.keys(available_versions).join(', ')}`);
    }

    return versions.filter((item) => {
        if (item === 'devel') {
            return !!with_devel;
        }
        const version = semver.coerce(item);
        if (since_perl && semver.lt(version, since_perl)) {
            return false;
        }
        if (until_perl && semver.gt(version, until_perl)) {
            return false;
        }
        return true;
    });
}

function available_targets() {
    return Object.keys(available_versions);
}

module.exports = {
    perl_versions,
    decode_version,
    available_targets
};
