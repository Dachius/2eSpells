import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script", // plain <script> files, not ES modules
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    ignores: [],
  },
];
