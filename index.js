const core = require('@actions/core');
const semver = require('semver');

let available = [
    "5.8",
    "5.10", "5.12", "5.14", "5.16", "5.18",
    "5.20", "5.22", "5.24", "5.26", "5.28",
    "5.30", "5.32", "5.34", "5.36", "5.38",
    "devel",
];

try {
    const since_perl = semver.coerce(core.getInput('since-perl'));
    const with_devel = core.getInput('with-devel') == "true";

    let filtered = available.filter(
        (item) => {
            if (item == "devel") {
                return with_devel;
            }
            return semver.gte(semver.coerce(item), since_perl);
        }
    );

    console.log('perl-versions', JSON.stringify(filtered));
    core.setOutput('perl-versions', JSON.stringify(filtered));
} catch (error) {
    core.setFailed(error.message);
}