import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Adapted EvilCharts components drive ECharts imperatively and intentionally
  // hold a stable mutable per-instance object via `useRef(...).current` (see the
  // `LiveState` docs in each chart). The React Compiler lint rule flags that
  // pattern by design, so it is disabled for this adapted vendor folder only.
  {
    files: ["src/components/evilcharts/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/refs": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated files:
    ".source/**",
  ]),
]);

export default eslintConfig;
