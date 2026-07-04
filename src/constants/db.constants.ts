// Constantes de la conexión a la DB (regla 7). Hoja: no importa otras capas.
// Tuning del pool pg para acotar conexiones y fallar rápido ante latencia.

export const DB_POOL_MAX = 10
export const DB_POOL_IDLE_TIMEOUT_MS = 30_000
export const DB_POOL_CONNECTION_TIMEOUT_MS = 10_000
