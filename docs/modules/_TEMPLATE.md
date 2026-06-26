# Módulo: <nombre>

> Copia este template a `docs/modules/<modulo>.md` al empezar una fase que toque el módulo. Mantenlo actualizado: es el contrato de lo que el módulo hace y cómo se verifica.

**Fase**: <n> · **Estado**: PENDIENTE | EN CURSO | HECHO | VERIFICADO
**Ubicación**: `src/modules/<modulo>/`

## Alcance (qué replica del original)

- Funcionalidad que cubre (lista de acciones del usuario).
- Referencia en el monolito: `index.html` líneas `<x-y>`, funciones `render...`, `<acciones>`.
- Lo que explícitamente NO cubre (si aplica).

## Modelo de datos (tablas Drizzle)

- Tablas en `data/schema.ts`: `<tabla>` (columnas clave, PK, FKs, índices).
- Reglas de unicidad / constraints.

## Server Actions (`actions/`)

| Action | Entrada (zod) | Permiso | Efectos | Revalida |
|--------|---------------|---------|---------|----------|
| `<accion>` | `<schema>` | `<modulo>.<perm>` | <qué muta> | `<rutas>` |

## Lógica de dominio (`domain/`)

- Reglas puras no obvias (ej. PPP, validaciones de tipo, cálculos de dosis/estimación).

## UI (`ui/`)

- Pantallas, tablas (columnas), formularios, modales.

## Reglas de negocio (lo no obvio)

- Ej.: `validaUnicidadDoc`, congelar PPP en tomas, dosis = dosis×ha×pasadas, etc.

## Checklist de verificación end-to-end

- [ ] Crear `<X>` con datos válidos → persiste y aparece en la lista.
- [ ] Editar y eliminar `<X>` (si aplica) funcionan y respetan reglas.
- [ ] Validación: datos inválidos muestran errores de campo (zod).
- [ ] Permiso: usuario sin `<modulo>.<perm>` recibe "Sin permiso".
- [ ] Import Excel: archivo válido importa; archivo con errores muestra preview de errores.
- [ ] Export Excel: descarga archivo con las columnas correctas.
- [ ] (movimientos) PPP correcto tras ENT / SAL / TRASPASO / lotes.
- [ ] (terreno) Captura offline → reconectar → "Subir a la nube" → persiste sin duplicar.
- [ ] Audit trail registra la acción.
- [ ] Tests unit (domain) y de integración (actions) verdes.

## Evidencia de verificación

- Output de `npm test` / capturas de Playwright / notas de prueba manual (pegar al marcar VERIFICADO).
