const core = require('@actions/core');
const semver = require('semver');

let available = [
    "5.8",
    "5.10", "5.12", "5.14", "5.16", "5.18",
    "5.20", "5.22", "5.24", "5.26", "5.28",
    "5.30", "5.32", "5.34", "5.36", "5.38",
    "5.40", "5.42",
    "devel",
];

try {
    const since_perl = semver.coerce(core.getInput('since-perl'));
    const to_perl_input = core.getInput('to-perl');
    const to_perl = to_perl_input ? semver.coerce(to_perl_input) : null;
    const with_devel = core.getInput('with-devel') == "true";

    let filtered = available.filter(
        (item) => {
            if (item == "devel") {
                return with_devel;
            }
            const version = semver.coerce(item);
            const meetsLowerBound = semver.gte(version, since_perl);
            const meetsUpperBound = !to_perl || semver.lte(version, to_perl);
            return meetsLowerBound && meetsUpperBound;
        }
    );

    console.log('perl-versions', JSON.stringify(filtered));
    core.setOutput('perl-versions', JSON.stringify(filtered));
} catch (error) {
    core.setFailed(error.message);
}
