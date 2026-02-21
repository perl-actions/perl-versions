const globals = require("globals");
const pluginJs = require("@eslint/js");

module.exports = [
    { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
    { languageOptions: { globals: { ...globals.node, ...globals.jest } } },
    pluginJs.configs.recommended,
    {
        rules: {
            "prefer-const": "error",
            eqeqeq: "error",
        },
    },
];
