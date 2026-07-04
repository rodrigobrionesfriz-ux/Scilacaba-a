"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PZ_MESES_TEMP } from "@/constants/config.constants"
import { guardarIndicadores } from "@/server/config/config.actions"
import type { IndicadorFila, IndicadoresRoot } from "@/types/config.types"
import {
  anioDeMesEnTemporada,
  mesesDeTemporada,
  parseIndicador,
  temporadaActual,
} from "@/utils/indicadores.utils"

type Celda = { usd: string; utm: string; uf: string }
type Matriz = Record<string, Celda>

const matrizDe = (root: IndicadoresRoot, temp: string): Matriz => {
  const meses = mesesDeTemporada(root, temp)
  const m: Matriz = {}
  for (const mes of PZ_MESES_TEMP) {
    const d = meses[mes] ?? {}
    m[mes] = {
      usd: d.usd != null ? String(d.usd) : "",
      utm: d.utm != null ? String(d.utm) : "",
      uf: d.uf != null ? String(d.uf) : "",
    }
  }
  return m
}

type IndicadoresSectionProps = {
  root: IndicadoresRoot
  temporadas: string[]
  puedeEditar: boolean
}

export const IndicadoresSection = ({
  root,
  temporadas,
  puedeEditar,
}: IndicadoresSectionProps) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const inicial = temporadaActual()
  const [temporada, setTemporada] = useState(
    temporadas.includes(inicial) ? inicial : (temporadas.at(-1) ?? inicial),
  )
  const [matriz, setMatriz] = useState<Matriz>(() => matrizDe(root, temporada))

  const items = temporadas.map((t) => ({ value: t, label: `Temporada ${t}` }))

  const cambiarTemporada = (t: string | null) => {
    const val = t ?? temporada
    setTemporada(val)
    setMatriz(matrizDe(root, val))
  }

  const set = (mes: string, campo: keyof Celda, valor: string) =>
    setMatriz((prev) => ({ ...prev, [mes]: { ...prev[mes], [campo]: valor } }))

  const onGuardar = () => {
    const filas: IndicadorFila[] = PZ_MESES_TEMP.map((mes) => ({
      mes,
      usd: parseIndicador(matriz[mes]?.usd),
      utm: parseIndicador(matriz[mes]?.utm),
      uf: parseIndicador(matriz[mes]?.uf),
    }))
    startTransition(async () => {
      const res = await guardarIndicadores({ temporada, filas })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(`Indicadores de la temporada ${temporada} guardados`)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Indicadores diarios</CardTitle>
          <CardDescription>Valor USD, UTM y UF por mes.</CardDescription>
        </div>
        <Select items={items} value={temporada} onValueChange={cambiarTemporada}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 pr-4 font-medium">Mes</th>
                <th className="py-2 pr-4 font-medium">USD</th>
                <th className="py-2 pr-4 font-medium">UTM</th>
                <th className="py-2 font-medium">UF</th>
              </tr>
            </thead>
            <tbody>
              {PZ_MESES_TEMP.map((mes) => (
                <tr key={mes} className="border-b last:border-0">
                  <td className="py-1 pr-4 font-medium">
                    {mes}{" "}
                    <span className="text-xs text-muted-foreground">
                      {anioDeMesEnTemporada(mes, temporada)}
                    </span>
                  </td>
                  {(["usd", "utm", "uf"] as const).map((campo) => (
                    <td key={campo} className="py-1 pr-4">
                      <Input
                        value={matriz[mes]?.[campo] ?? ""}
                        onChange={(e) => set(mes, campo, e.target.value)}
                        disabled={!puedeEditar}
                        className="h-8 w-28"
                        placeholder="—"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {puedeEditar && (
          <div>
            <Button onClick={onGuardar} disabled={pending}>
              {pending ? "Guardando…" : "Guardar temporada"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
