const core = require('@actions/core');
const semver = require('semver');
const {
    perl_versions,
    decode_version,
    resolve_single_out,
    target_info
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

    const info = target_info (target);

    if (with_devel && info && !info.has_devel) {
        core.warning (`with-devel was requested but target '${target}' does not provide a devel version`);
    }

    if (since_perl && info && info.min_version) {
        const min = semver.coerce (info.min_version);
        if (semver.lt (since_perl, min)) {
            core.warning (`since-perl (${since_perl.major}.${since_perl.minor}) is below the minimum available version for target '${target}' (${info.min_version})`);
        }
    }

    if (until_perl && info && info.max_version) {
        const max = semver.coerce (info.max_version);
        if (semver.gt (until_perl, max)) {
            core.warning (`until-perl (${until_perl.major}.${until_perl.minor}) is above the maximum available version for target '${target}' (${info.max_version})`);
        }
    }

    const filtered = perl_versions({
        since_perl,
        until_perl,
        with_devel,
        target
    });

    const { single_out, versions } = resolve_single_out (filtered, single_out_input);

    console.log ('perl-versions', JSON.stringify (versions));
    core.setOutput ('perl-versions', JSON.stringify (versions));

    if (single_out) {
        console.log ('single-out', single_out);
        core.setOutput ('single-out', single_out);
    }
} catch (error) {
    core.setFailed(error.message);
}
