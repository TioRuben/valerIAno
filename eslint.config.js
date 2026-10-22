//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config"

export default [
  ...tanstackConfig,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "ClassDeclaration",
          message: "Use functional composition instead of classes.",
        },
        {
          selector: "ClassExpression",
          message: "Use functional composition instead of classes.",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "error",
      complexity: ["error", 3],
      "max-depth": ["error", 3],
      "max-lines": [
        "warn",
        { max: 99, skipBlankLines: true, skipComments: true },
      ],
      "import/no-cycle": "off",
      "import/order": "off",
      "import/consistent-type-specifier-style": "off",
      "sort-imports": "off",
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/require-await": "off",
      "pnpm/json-enforce-catalog": "off",
    },
  },
  {
    ignores: [
      "eslint.config.js",
      ".prettierrc",
      "src/routeTree.gen.ts",
      "src/components/ui/**",
      "public/**",
      "dist/**",
    ],
  },
]
