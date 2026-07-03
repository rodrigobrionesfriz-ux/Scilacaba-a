// Decodifica un archivo en base64 (generado en el servidor) a Blob y dispara su
// descarga en el navegador. Se invoca solo desde componentes cliente.
export const descargarArchivo = (
  base64: string,
  filename: string,
  mime: string,
): void => {
  const binario = atob(base64)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i)
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
