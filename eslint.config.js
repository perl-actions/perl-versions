const globals = require("globals");
const pluginJs = require("@eslint/js");

module.exports = [
    { ignores: ["dist/", "node_modules/"] },
    { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
    { languageOptions: { globals: { ...globals.node, ...globals.jest } } },
    pluginJs.configs.recommended,
    {
        rules: {
            "prefer-const": "error",
            eqeqeq: "error",
            "comma-dangle": ["error", "only-multiline"],
        },
    },
];
