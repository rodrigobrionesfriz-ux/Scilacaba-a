"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { SortableHeader } from "@/components/ui/data-table-sortable-header"
import { ROLE_LABELS } from "@/constants/permisos.constants"
import type { UsuarioRow } from "@/types/usuarios.types"
import { ResetPassword } from "./usuarios.reset-password"
import { ToggleActivo } from "./usuarios.toggle"
import { UsuarioForm } from "./usuarios.form"

export const buildUsuariosColumns = (
  puedeEditar: boolean,
): ColumnDef<UsuarioRow>[] => [
  {
    accessorKey: "nombre",
    header: ({ column }) => (
      <SortableHeader column={column}>Nombre</SortableHeader>
    ),
  },
  {
    accessorKey: "username",
    header: ({ column }) => (
      <SortableHeader column={column}>Usuario</SortableHeader>
    ),
  },
  {
    accessorKey: "role",
    header: "Rol",
    cell: ({ row }) => (
      <Badge variant="secondary">
        {ROLE_LABELS[row.original.role] ?? row.original.role}
      </Badge>
    ),
    filterFn: (row, _id, value) =>
      value === "todos" || row.original.role === value,
  },
  {
    accessorKey: "activo",
    header: "Estado",
    cell: ({ row }) =>
      row.original.activo ? (
        <Badge>Activo</Badge>
      ) : (
        <Badge variant="secondary">Inactivo</Badge>
      ),
  },
  {
    id: "permisos",
    header: "Permisos",
    cell: ({ row }) => row.original.permissions.length,
  },
  ...(puedeEditar
    ? [
        {
          id: "acciones",
          header: "Acciones",
          cell: ({ row }: { row: { original: UsuarioRow } }) => (
            <div className="flex gap-1">
              <UsuarioForm usuario={row.original} />
              <ResetPassword id={row.original.id} />
              <ToggleActivo id={row.original.id} activo={row.original.activo} />
            </div>
          ),
        },
      ]
    : []),
]
