import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettierConfig,
  {
    rules: {
      // Preferências do projeto: nada de console esquecido, window.confirm/alert
      // (usar Modal/Toast próprios) e nenhum `any` solto.
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-restricted-globals": [
        "error",
        { name: "confirm", message: "Use o componente ConfirmDialog em vez de window.confirm." },
        { name: "alert", message: "Use o componente Toast em vez de window.alert." },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      // Nenhum arquivo grande — força quebrar em subcomponentes/hooks (ver plano).
      "max-lines": [
        "warn",
        { max: 200, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
