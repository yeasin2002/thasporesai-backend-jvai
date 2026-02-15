import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Ignore patterns
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "uploads/**",
      "logs/**",
      "*.config.js",
      "*.config.ts",
      "script/**",
    ],
  },

  // Base JavaScript recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // Global configuration
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        project: "./tsconfig.json",
      },
    },

    rules: {
      // TypeScript specific rules
      "@typescript-eslint/no-explicit-any": "off", // Project uses any
      "@typescript-eslint/no-unused-vars": [
        "off",
        // {
        //   argsIgnorePattern: "^_",
        //   varsIgnorePattern: "^_",
        // },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-empty-object-type": "off", // Allow {} type
      "@typescript-eslint/no-namespace": "off", // Allow namespaces for Express types

      // General rules
      "no-console": "off", // Allow console for development
      "no-debugger": "warn",
      "prefer-const": "warn",
      "no-var": "error",
      "object-shorthand": "off", // Allow both shorthand and longhand
      "quote-props": "off", // Allow any quote style for properties

      // Import/Export rules
      "no-duplicate-imports": "warn", // Warn instead of error
      "no-duplicate-imports": "off",

      // Best practices
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-throw-literal": "error",
      "prefer-promise-reject-errors": "error",
    },
  },

  // Specific overrides for test files if needed
  {
    files: ["**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Prettier integration
  prettierConfig,
  {
    plugins: { prettier: prettierPlugin },
    rules: {
      "prettier/prettier": "warn",
    },
  }
);
