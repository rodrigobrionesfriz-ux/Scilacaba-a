// Resultado uniforme de las Server Actions de dominio (regla 12). Permite a la UI
// mostrar toast de éxito/error sin lanzar excepciones a través del boundary cliente.
export type ActionResult = { ok: true } | { ok: false; error: string }
