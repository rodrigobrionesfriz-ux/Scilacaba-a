import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import boundaries from "eslint-plugin-boundaries"
import prettier from "eslint-config-prettier"

// Capas técnicas (ADR-013 / docs/CONVENTIONS.md). La UI no es importada por capas
// inferiores; el acceso a datos pasa por `server`; las hojas (types/constants/...) no
// importan hacia arriba.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/include": ["src/**/*"],
      "boundaries/elements": [
        { type: "app", pattern: "src/app", mode: "folder" },
        { type: "server", pattern: "src/server", mode: "folder" },
        { type: "components", pattern: "src/components", mode: "folder" },
        { type: "hooks", pattern: "src/hooks", mode: "folder" },
        { type: "db", pattern: "src/db", mode: "folder" },
        { type: "lib", pattern: "src/lib", mode: "folder" },
        { type: "utils", pattern: "src/utils", mode: "folder" },
        { type: "schemas", pattern: "src/schemas", mode: "folder" },
        { type: "types", pattern: "src/types", mode: "folder" },
        { type: "constants", pattern: "src/constants", mode: "folder" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          rules: [
            {
              from: { type: "app" },
              allow: {
                to: {
                  type: [
                    "app",
                    "server",
                    "components",
                    "hooks",
                    "lib",
                    "utils",
                    "schemas",
                    "types",
                    "constants",
                  ],
                },
              },
            },
            {
              from: { type: ["components", "hooks"] },
              allow: {
                to: {
                  type: [
                    "components",
                    "hooks",
                    "server",
                    "lib",
                    "utils",
                    "schemas",
                    "types",
                    "constants",
                  ],
                },
              },
            },
            {
              from: { type: "server" },
              allow: {
                to: {
                  type: [
                    "server",
                    "db",
                    "lib",
                    "utils",
                    "schemas",
                    "types",
                    "constants",
                  ],
                },
              },
            },
            {
              from: { type: "db" },
              allow: {
                to: {
                  type: ["db", "lib", "utils", "schemas", "types", "constants"],
                },
              },
            },
            {
              from: { type: "lib" },
              allow: {
                to: { type: ["lib", "utils", "schemas", "types", "constants"] },
              },
            },
            {
              from: { type: "utils" },
              allow: { to: { type: ["utils", "lib", "types", "constants"] } },
            },
            {
              from: { type: "schemas" },
              allow: { to: { type: ["schemas", "types", "constants"] } },
            },
            {
              from: { type: "types" },
              allow: { to: { type: ["types", "constants"] } },
            },
            {
              from: { type: "constants" },
              allow: { to: { type: ["constants"] } },
            },
          ],
        },
      ],
    },
  },

  // Desactiva reglas de formato que chocan con Prettier (debe ir al final).
  prettier,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "drizzle/**",
    "next-env.d.ts",
  ]),
])

export default eslintConfig
