// Helpers de RUT chileno (regla 8). Usados por el migrador y por los maestros
// comerciales (proveedores/clientes: el código es el RUT sin DV).

// Cuerpo del RUT sin DV (= código de proveedor/cliente). null si no parseable.
export const rutBody = (value: unknown): string | null => {
  if (typeof value !== "string") return null
  const limpio = value.replace(/[^0-9kK]/g, "").toUpperCase()
  return limpio.length < 2 ? null : limpio.slice(0, -1)
}

// Valida el dígito verificador del RUT (módulo 11). false si formato inválido.
export const rutValido = (value: unknown): boolean => {
  if (typeof value !== "string") return false
  const limpio = value.replace(/[^0-9kK]/g, "").toUpperCase()
  if (limpio.length < 2) return false
  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)
  if (!/^\d+$/.test(cuerpo)) return false
  let suma = 0
  let factor = 2
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * factor
    factor = factor === 7 ? 2 : factor + 1
  }
  const resto = 11 - (suma % 11)
  const dvEsperado = resto === 11 ? "0" : resto === 10 ? "K" : String(resto)
  return dv === dvEsperado
}
