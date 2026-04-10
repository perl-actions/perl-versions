const { latest_stable_version } = require ('./perl-versions');

// Mock @actions/core before loading index.js
jest.mock ('@actions/core');
const core = require ('@actions/core');

function run_action (inputs = {}) {
    // Reset mocks
    core.getInput.mockReset ();
    core.setOutput.mockReset ();
    core.setFailed.mockReset ();

    // Default all inputs to empty string (same as real Actions runtime)
    core.getInput.mockImplementation ((name) => inputs[name] ?? '');

    // Re-run index.js in isolation so the top-level try block re-executes
    jest.isolateModules (() => {
        require ('./index');
    });

    // Collect outputs
    const outputs = {};
    for (const call of core.setOutput.mock.calls) {
        outputs[call[0]] = call[1];
    }
    return { outputs, failed: core.setFailed.mock.calls };
}

describe ('action: perl-versions output', () => {
    test ('returns all stable versions when no inputs are given', () => {
        const { outputs } = run_action ();
        const versions = JSON.parse (outputs['perl-versions']);
        expect (Array.isArray (versions)).toBe (true);
        expect (versions.length).toBeGreaterThan (0);
        expect (versions).not.toContain ('devel');
    });

    test ('since-perl filters older versions', () => {
        const { outputs } = run_action ({ 'since-perl': '5.30' });
        const versions = JSON.parse (outputs['perl-versions']);
        expect (versions).toContain ('5.30');
        expect (versions).not.toContain ('5.28');
    });

    test ('until-perl filters newer versions', () => {
        const { outputs } = run_action ({ 'since-perl': '5.26', 'until-perl': '5.32' });
        const versions = JSON.parse (outputs['perl-versions']);
        expect (versions).toContain ('5.32');
        expect (versions).not.toContain ('5.34');
    });

    test ('with-devel=true includes devel', () => {
        const { outputs } = run_action ({ 'since-perl': '5.38', 'with-devel': 'true' });
        const versions = JSON.parse (outputs['perl-versions']);
        expect (versions).toContain ('devel');
    });

    test ('with-devel=false excludes devel', () => {
        const { outputs } = run_action ({ 'since-perl': '5.38', 'with-devel': 'false' });
        const versions = JSON.parse (outputs['perl-versions']);
        expect (versions).not.toContain ('devel');
    });

    test ('target=windows-strawberry restricts versions', () => {
        const { outputs } = run_action ({ 'since-perl': '5.8', 'target': 'windows-strawberry' });
        const versions = JSON.parse (outputs['perl-versions']);
        expect (versions).not.toContain ('5.8');
        expect (versions).toContain ('5.14');
    });

    test ('v-prefixed version input is handled correctly', () => {
        const { outputs } = run_action ({ 'since-perl': 'v5.30', 'until-perl': 'v5.34' });
        const versions = JSON.parse (outputs['perl-versions']);
        expect (versions).toContain ('5.30');
        expect (versions).toContain ('5.34');
        expect (versions).not.toContain ('5.28');
        expect (versions).not.toContain ('5.36');
    });

    test ('since-perl=latest filters to only the latest stable version', () => {
        const { outputs } = run_action ({ 'since-perl': 'latest' });
        const versions = JSON.parse (outputs['perl-versions']);
        expect (versions).toContain (latest_stable_version ());
        expect (versions).toHaveLength (1);
    });

    test ('single-out=newest sets the single-out output and removes it from the list', () => {
        const { outputs } = run_action ({ 'since-perl': '5.38', 'single-out': 'newest' });
        const versions = JSON.parse (outputs['perl-versions']);
        const single_out = outputs['single-out'];
        expect (single_out).toBeTruthy ();
        expect (versions).not.toContain (single_out);
    });

    test ('single-out=oldest sets the single-out output', () => {
        const { outputs } = run_action ({ 'since-perl': '5.38', 'single-out': 'oldest' });
        expect (outputs['single-out']).toBe ('5.38');
    });

    test ('no single-out output when single-out input is empty', () => {
        const { outputs } = run_action ({ 'since-perl': '5.38' });
        expect (outputs['single-out']).toBeUndefined ();
    });

    test ('unknown target calls setFailed', () => {
        const { failed } = run_action ({ 'target': 'unknown-os' });
        expect (failed.length).toBeGreaterThan (0);
        expect (failed[0][0]).toContain ('Unknown target');
    });
});
