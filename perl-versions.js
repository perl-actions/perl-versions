const semver = require('semver');

const available = [
    '5.8',
    '5.10', '5.12', '5.14', '5.16', '5.18',
    '5.20', '5.22', '5.24', '5.26', '5.28',
    '5.30', '5.32', '5.34', '5.36', '5.38',
    '5.40', '5.42',
    'devel',
];

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
    with_devel
} = {}) {
    return available.filter((item) => {
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

function resolve_single_out (versions, single_out_input) {
    if (!single_out_input) {
        return { single_out: null, versions };
    }

    const non_devel = versions.filter ((v) => v !== 'devel');
    let single_out;

    switch (single_out_input) {
        case 'oldest':
            single_out = non_devel.shift () || null;
            break;
        case 'newest':
        case 'latest':
            single_out = non_devel.pop () || null;
            break;
        case 'devel':
            single_out = versions.includes ('devel') ? 'devel' : null;
            break;
        default: {
            const decoded = decode_version (single_out_input);
            single_out = decoded ? `${decoded.major}.${decoded.minor}` : null;
            break;
        }
    }

    if (!single_out) {
        return { single_out: null, versions };
    }

    return {
        single_out,
        versions: versions.filter ((v) => v !== single_out)
    };
}

module.exports = {
    perl_versions,
    decode_version,
    resolve_single_out
};
