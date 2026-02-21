const core = require('@actions/core');
const semver = require('semver');

const available = [
    "5.8",
    "5.10", "5.12", "5.14", "5.16", "5.18",
    "5.20", "5.22", "5.24", "5.26", "5.28",
    "5.30", "5.32", "5.34", "5.36", "5.38",
    "5.40", "5.42",
    "devel",
];

function parse_input_version (input_name) {
    // semver.coerce() returns null for both empty string and null inputs
    return semver.coerce (core.getInput (input_name));
}

try {
    const since_perl = parse_input_version ('since-perl');
    const until_perl = parse_input_version ('until-perl');
    const with_devel = core.getInput('with-devel') === "true";

    // Normalize to major.minor — available versions are major.minor only,
    // so "5.8.1" should match the "5.8" series (resolves #8)
    const since_minor = since_perl
        ? semver.coerce (`${since_perl.major}.${since_perl.minor}`)
        : since_perl;
    const until_minor = until_perl
        ? semver.coerce (`${until_perl.major}.${until_perl.minor}`)
        : until_perl;

    const filtered = available.filter(
        (item) => {
            if (item === "devel") {
                return with_devel;
            }
            const version = semver.coerce (item);
            const meetsLowerBound = semver.gte (version, since_minor);
            const meetsUpperBound = !until_minor || semver.lte (version, until_minor);
            return meetsLowerBound && meetsUpperBound;
        }
    );

    console.log('perl-versions', JSON.stringify(filtered));
    core.setOutput('perl-versions', JSON.stringify(filtered));
} catch (error) {
    core.setFailed(error.message);
}
