const semver = require('semver');

const available = [
    "5.8",
    "5.10", "5.12", "5.14", "5.16", "5.18",
    "5.20", "5.22", "5.24", "5.26", "5.28",
    "5.30", "5.32", "5.34", "5.36", "5.38",
    "5.40", "5.42",
    "devel",
];

function filterVersions(since_perl, until_perl, with_devel) {
    return available.filter((item) => {
        if (item === "devel") {
            return with_devel;
        }
        const version = semver.coerce(item);
        const meetsLowerBound = semver.gte(version, since_perl);
        const meetsUpperBound = !until_perl || semver.lte(version, until_perl);
        return meetsLowerBound && meetsUpperBound;
    });
}

module.exports = { available, filterVersions };
