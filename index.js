const core = require('@actions/core');
const { perl_versions, decode_version } = require('./lib');

function parse_input_version (input_name) {
    // semver.coerce() returns null for both empty string and null inputs
    return decode_version (core.getInput (input_name));
}

try {
    const since_perl = parse_input_version ('since-perl');
    const until_perl = parse_input_version ('until-perl');
    const with_devel = core.getInput('with-devel') === "true";

    const filtered = perl_versions({ since_perl, until_perl, with_devel });

    console.log('perl-versions', JSON.stringify(filtered));
    core.setOutput('perl-versions', JSON.stringify(filtered));
} catch (error) {
    core.setFailed(error.message);
}
