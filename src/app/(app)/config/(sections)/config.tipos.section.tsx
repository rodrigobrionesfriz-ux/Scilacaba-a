"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { TipoRow } from "@/types/config.types"
import { TipoDelete } from "./config.tipo.delete"
import { TipoForm } from "./config.tipo.form"

type TiposSectionProps = {
  tipos: TipoRow[]
  puedeEditar: boolean
}

export const TiposSection = ({ tipos, puedeEditar }: TiposSectionProps) => (
  <Card>
    <CardHeader className="flex-row items-center justify-between gap-4">
      <div>
        <CardTitle>Tipos de producto</CardTitle>
        <CardDescription>
          Se usan al clasificar productos en el catálogo.
        </CardDescription>
      </div>
      {puedeEditar && <TipoForm />}
    </CardHeader>
    <CardContent>
      {tipos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin tipos registrados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 pr-4 font-medium">Nombre</th>
                <th className="py-2 pr-4 font-medium">Descripción</th>
                <th className="py-2 pr-4 font-medium">Estado</th>
                {puedeEditar && <th className="py-2 font-medium">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {tipos.map((t) => (
                <tr key={t.nombre} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{t.nombre}</td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {t.descripcion || "—"}
                  </td>
                  <td className="py-2 pr-4">
                    <Badge variant={t.activo ? "default" : "secondary"}>
                      {t.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  {puedeEditar && (
                    <td className="flex gap-1 py-2">
                      <TipoForm tipo={t} />
                      <TipoDelete nombre={t.nombre} />
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
