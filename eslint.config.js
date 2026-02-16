import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "docs", "scripts"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // Warn on unused vars (ignore underscore-prefixed)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Warn on explicit any to encourage proper typing over time
      "@typescript-eslint/no-explicit-any": "warn",
      // Keep these off for now - can tighten later
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-require-imports": "off",
      // Allow short-circuit expressions (pre-existing pattern in codebase)
      "@typescript-eslint/no-unused-expressions": "warn",
      // Catch common bugs
      "no-console": ["warn", { allow: ["warn", "error", "log"] }],
      "no-debugger": "error",
      "no-duplicate-imports": "warn",
      "no-template-curly-in-string": "warn",
      "prefer-const": "warn",
      eqeqeq: ["warn", "smart"],
    },
  },
);
