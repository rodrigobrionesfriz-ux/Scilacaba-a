"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Group } from "@/types/catalogos.types"
import { GrupoDelete } from "./config.grupo.delete"
import { GrupoForm } from "./config.grupo.form"

type GruposSectionProps = {
  grupos: Group[]
  puedeEditar: boolean
}

export const GruposSection = ({ grupos, puedeEditar }: GruposSectionProps) => (
  <Card>
    <CardHeader className="flex-row items-center justify-between gap-4">
      <div>
        <CardTitle>Grupos y subgrupos</CardTitle>
        <CardDescription>
          Categorización de productos por grupo y sus subgrupos.
        </CardDescription>
      </div>
      {puedeEditar && <GrupoForm />}
    </CardHeader>
    <CardContent>
      {grupos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin grupos registrados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 pr-4 font-medium">Grupo</th>
                <th className="py-2 pr-4 font-medium">Subgrupos</th>
                {puedeEditar && <th className="py-2 font-medium">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {grupos.map((g) => (
                <tr key={g.nombre} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{g.nombre}</td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {g.subgrupos.length > 0 ? g.subgrupos.join(", ") : "—"}
                  </td>
                  {puedeEditar && (
                    <td className="flex gap-1 py-2">
                      <GrupoForm grupo={g} />
                      <GrupoDelete nombre={g.nombre} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardContent>
  </Card>
)
