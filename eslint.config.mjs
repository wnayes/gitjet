import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    ignores: [".vite/"],
  },
  {
    rules: {
      "@typescript-eslint/no-non-null-assertion": 0,
      "@typescript-eslint/no-this-alias": 0,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  }
);
