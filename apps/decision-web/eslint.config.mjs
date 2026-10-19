import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default defineConfig([
  ...tseslint.configs.recommended,
  reactHooks.configs.flat["recommended-latest"],
  nextVitals.configs["core-web-vitals"],
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
