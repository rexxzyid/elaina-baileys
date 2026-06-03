import typescriptEslint from "@typescript-eslint/eslint-plugin";
import react from "eslint-plugin-react";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unicorn from "eslint-plugin-unicorn";
import jest from "eslint-plugin-jest";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import stylistic from '@stylistic/eslint-plugin'
import { defineConfig } from "eslint/config";

export default defineConfig({
    extends: [
        react.configs.flat.recommended,
    ],
    plugins: {
        "@typescript-eslint": typescriptEslint,
        react,
        "simple-import-sort": simpleImportSort,
        unicorn,
        jest,
        '@stylistic': stylistic,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...jest.environments.globals.globals,
        },

        parser: tsParser,
        ecmaVersion: 5,
        sourceType: "module",
        parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        }
    },

    settings: {
        react: {
            version: "detect",
        },
    },

    rules: {
        "unicorn/no-array-for-each": ["error"],

        "unicorn/consistent-function-scoping": ["error", {
            checkArrowFunctions: false,
        }],

        "unicorn/no-await-expression-member": "error",
        "unicorn/no-for-loop": "error",
        "unicorn/no-lonely-if": "error",
        "unicorn/no-object-as-default-parameter": "error",
        "unicorn/prefer-array-find": "error",
        "unicorn/prefer-array-some": "error",
        "max-depth": ["error", 4],

        "@typescript-eslint/no-misused-promises": ["error", {
            checksSpreads: true,
            checksVoidReturn: false,
            checksConditionals: true,
        }],

        "@typescript-eslint/prefer-optional-chain": ["error"],
        "@typescript-eslint/no-unnecessary-type-assertion": ["error"],
        "@typescript-eslint/no-unnecessary-type-constraint": ["error"],
        "@typescript-eslint/no-redundant-type-constituents": ["error"],
        "@typescript-eslint/no-inferrable-types": ["error"],

        "@typescript-eslint/no-explicit-any": ["warn", {
            ignoreRestArgs: true,
        }],

        "@stylistic/type-annotation-spacing": ["error"],

        "@stylistic/member-delimiter-style": ["error", {
            multiline: {
                delimiter: "none",
                requireLast: false,
            },

            singleline: {
                delimiter: "comma",
                requireLast: false,
            },
        }],

        "@typescript-eslint/no-unused-vars": ["error"],
        "@typescript-eslint/consistent-type-imports": ["error"],

        camelcase: ["error", {
            ignoreGlobals: true,
            ignoreImports: true,
        }],

        "no-unneeded-ternary": ["error"],

        "no-restricted-syntax": ["error", {
            selector: "TSEnumDeclaration",
            message: "Don't declare enums, use literals instead",
        }],

        "no-constant-condition": ["error"],
        "no-constant-binary-expression": "error",
        "no-trailing-spaces": "error",
        "no-multi-spaces": "error",
        "space-infix-ops": "error",
        indent: ["error", "tab"],

        quotes: [2, "single", {
            avoidEscape: true,
        }],

        "object-curly-spacing": ["error", "always"],
        "space-in-parens": ["error", "never"],
        curly: [2, "all"],
        "brace-style": ["error"],
        "linebreak-style": ["error", "unix"],
        semi: ["error", "never"],
        "space-before-function-paren": ["error", "never"],

        "keyword-spacing": ["error", {
            overrides: {
                if: {
                    after: false,
                },

                for: {
                    after: false,
                },

                while: {
                    after: false,
                },

                catch: {
                    after: false,
                },
            },
        }],

        "padding-line-between-statements": ["error", {
            blankLine: "always",
            prev: "function",
            next: "*",
        }, {
            blankLine: "always",
            prev: "block-like",
            next: "*",
        }, {
            blankLine: "always",
            prev: "import",
            next: "block-like",
        }],

        eqeqeq: "error",
        "func-names": ["error", "never"],

        "func-style": ["error", "declaration", {
            allowArrowFunctions: true,
        }],

        "prefer-const": "error",
        "prefer-arrow-callback": "error",
        "arrow-spacing": ["error"],
        "implicit-arrow-linebreak": ["error", "beside"],
        "no-multiple-empty-lines": "error",
        "space-before-blocks": "error",
        "comma-spacing": "error",
        "no-unused-vars": "off",
        "jsx-quotes": ["error", "prefer-single"],

        "simple-import-sort/imports": ["error", {
            groups: [[
                "^react",
                "^@?\\w",
                "^(components|modules|utils)(/.*|$)",
                "^\\u0000",
                "^\\.\\.(?!/?$)",
                "^\\.\\./?$",
                "^\\./(?=.*/)(?!/?$)",
                "^\\.(?!/?$)",
                "^\\./?$",
            ]],
        }],

        "react/jsx-curly-brace-presence": ["error", {
            props: "never",
            children: "never",
        }],

        "react/no-typos": "error",
        "react/react-in-jsx-scope": "off",
        "react/self-closing-comp": "error",
        "react/jsx-closing-tag-location": "error",
        "react/jsx-equals-spacing": ["error", "never"],

        "react/jsx-tag-spacing": ["error", {
            closingSlash: "never",
        }],

        "react/display-name": "off",
        "react/prop-types": "off",
        "react/jsx-indent": ["error", "tab"],

        "react/jsx-curly-newline": ["error", {
            multiline: "require",
            singleline: "forbid",
        }],

        "react/jsx-first-prop-new-line": ["error", "multiline"],
        "react/jsx-max-props-per-line": "error",
        "react/jsx-one-expression-per-line": "error",

        "react/jsx-wrap-multilines": ["error", {
            declaration: "parens-new-line",
            assignment: "parens-new-line",
            return: "parens-new-line",
            arrow: "parens-new-line",
            condition: "parens-new-line",
            logical: "parens-new-line",
            prop: "ignore",
        }],

        "jest/no-disabled-tests": "error",
        "jest/no-focused-tests": "error",
    },
});
