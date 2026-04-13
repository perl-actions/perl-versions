const core = require('@actions/core');
const semver = require('semver');
const {
    perl_versions,
    decode_version,
    resolve_single_out,
    target_info,
} = require('./perl-versions');

function parse_input_version(input_name) {
    return decode_version(core.getInput(input_name));
}

function build_version_validator (target, report) {
    const info = target_info (target);
    if (!info) {
        return () => {};
    }

    return (label, version_or_flag) => {
        if (!version_or_flag) {
            return;
        }

        if (label === 'devel') {
            if (version_or_flag === true && !info.has_devel) {
                report (`with-devel was requested but target '${target}' does not provide a devel version`);
            }
            return;
        }

        if (info.min_version) {
            const min = semver.coerce (info.min_version);
            if (label === 'since-perl' && semver.lt (version_or_flag, min)) {
                report (`since-perl (${version_or_flag.major}.${version_or_flag.minor}) is below the minimum available version for target '${target}' (${info.min_version})`);
            }
        }

        if (info.max_version) {
            const max = semver.coerce (info.max_version);
            if (label === 'until-perl' && semver.gt (version_or_flag, max)) {
                report (`until-perl (${version_or_flag.major}.${version_or_flag.minor}) is above the maximum available version for target '${target}' (${info.max_version})`);
            }
        }
    };
}

try {
    const since_perl = parse_input_version('since-perl');
    const until_perl = parse_input_version('until-perl');
    const with_devel = core.getInput('with-devel') === 'true';
    const single_out_input = core.getInput('single-out') || null;

    const target = core.getInput ('target') || 'perl-tester';
    const mismatch_policy = core.getInput ('version-mismatch') || 'ignore';

    let report;
    if (mismatch_policy === 'warn') {
        report = (msg) => core.warning (msg);
    } else if (mismatch_policy === 'error') {
        report = (msg) => core.setFailed (msg);
    }

    if (report) {
        const validate = build_version_validator (target, report);
        validate ('devel', with_devel);
        validate ('since-perl', since_perl);
        validate ('until-perl', until_perl);
    }

    const filtered = perl_versions({
        since_perl,
        until_perl,
        with_devel,
        target,
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
