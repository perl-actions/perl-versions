/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 95:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const semver = __nccwpck_require__(159);

const all_versions = [
    '5.8',
    '5.10', '5.12', '5.14', '5.16', '5.18',
    '5.20', '5.22', '5.24', '5.26', '5.28',
    '5.30', '5.32', '5.34', '5.36', '5.38',
    '5.40', '5.42',
    'devel',
];

const available_versions = {
    'perl': all_versions,
    'perl-tester': all_versions,
    'macos': all_versions,
    'windows-strawberry': [
        '5.14', '5.16', '5.18',
        '5.20', '5.22', '5.24', '5.26', '5.28',
        '5.30', '5.32', '5.34', '5.36', '5.38',
        '5.40', '5.42',
    ],
};

function latest_stable_version () {
    const stable = all_versions.filter ((v) => v !== 'devel');
    return stable[stable.length - 1];
}

function decode_version(input) {
    if (input === 'latest') {
        return semver.coerce(latest_stable_version());
    }
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

function available_targets() {
    return Object.keys(available_versions);
}

module.exports = {
    perl_versions,
    decode_version,
    latest_stable_version,
    resolve_single_out,
    available_targets
};


/***/ }),

/***/ 428:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 159:
/***/ ((module) => {

module.exports = eval("require")("semver");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
const core = __nccwpck_require__(428);
const {
    perl_versions,
    decode_version,
    resolve_single_out
} = __nccwpck_require__(95);

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

    console.log ('perl-versions', JSON.stringify (versions));
    core.setOutput ('perl-versions', JSON.stringify (versions));

    if (single_out) {
        console.log ('single-out', single_out);
        core.setOutput ('single-out', single_out);
    }
} catch (error) {
    core.setFailed(error.message);
}

module.exports = __webpack_exports__;
/******/ })()
;