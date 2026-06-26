# Reglas de boundaries — SCI v2

Dirección de dependencias entre capas, vigilada por `eslint-plugin-boundaries` (regla `boundaries/dependencies` en `eslint.config.mjs`). La UI no es importada por capas inferiores; el acceso a datos pasa por `server`; las hojas no importan hacia arriba.

| Desde (`from`) | Puede importar (`allow`) |
|---|---|
| `app` | `server`, `components`, `hooks`, `lib`, `utils`, `schemas`, `types`, `constants` (NO `db` directo) |
| `components`, `hooks` | `server`, `lib`, `utils`, `schemas`, `types`, `constants` (+ peers) |
| `server` | `db`, `lib`, `utils`, `schemas`, `types`, `constants` (NO `app`/`components`/`hooks`) |
| `db` | `lib`, `utils`, `schemas`, `types`, `constants` |
| `lib` | `utils`, `schemas`, `types`, `constants` |
| `utils` | `lib`, `types`, `constants` |
| `schemas` | `types`, `constants` |
| `types` | `constants` |
| `constants` | (hoja, no importa otras capas) |

Reglas prácticas:
- Un componente que necesita datos llama a una **query/action de `src/server`**, nunca a `src/db` directo.
- Las constantes, tipos y schemas son **hojas**: no importan lógica.
- Si el lint falla con `boundaries/dependencies`, el import cruza una capa no permitida → mover el código a la capa correcta, no relajar la regla.
