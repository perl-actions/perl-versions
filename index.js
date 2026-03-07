const core = require('@actions/core');
const {
    perl_versions,
    decode_version,
    resolve_single_out
} = require('./perl-versions');

function parse_input_version(input_name) {
    return decode_version(core.getInput(input_name));
}

try {
    const since_perl = parse_input_version('since-perl');
    const until_perl = parse_input_version('until-perl');
    const with_devel = core.getInput('with-devel') === 'true';
    const single_out_input = core.getInput('single-out') || null;

    const target = core.getInput ('target') || 'perl-tester';

    const filtered = perl_versions({
        since_perl,
        until_perl,
        with_devel,
        target
    });

    const { single_out, versions } = resolve_single_out (filtered, single_out_input);

    if (single_out && !filtered.includes (single_out)) {
        core.warning (
            `single-out version '${single_out}' is not in the filtered perl-versions list. ` +
            `This may cause downstream CI failures if no Docker image exists for this version.`
        );
    }

    console.log ('perl-versions', JSON.stringify (versions));
    core.setOutput ('perl-versions', JSON.stringify (versions));

    if (single_out) {
        console.log ('single-out', single_out);
        core.setOutput ('single-out', single_out);
    }
} catch (error) {
    core.setFailed(error.message);
}
