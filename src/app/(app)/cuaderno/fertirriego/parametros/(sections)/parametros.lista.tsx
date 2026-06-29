"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ListaEditableProps = {
  label: string
  valores: string[]
  disabled?: boolean
  onChange: (next: string[]) => void
}

// Editor de lista de strings (chips con × + alta). Reutilizado por cada lista de
// la configuración (formas, horarios, unidades, estados, condiciones, tiposDoc).
export const ListaEditable = ({
  label,
  valores,
  disabled,
  onChange,
}: ListaEditableProps) => {
  const [nuevo, setNuevo] = useState("")

  const agregar = () => {
    const v = nuevo.trim()
    if (!v || valores.includes(v)) return
    onChange([...valores, v])
    setNuevo("")
  }

  const quitar = (v: string) => onChange(valores.filter((x) => x !== v))

  return (
    <fieldset className="flex flex-col gap-2 rounded-md border p-3">
      <legend className="px-1 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-1">
        {valores.length === 0 && (
          <span className="text-sm text-muted-foreground">Sin valores.</span>
        )}
        {valores.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-xs"
          >
            {v}
            {!disabled && (
              <button
                type="button"
                onClick={() => quitar(v)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Quitar ${v}`}
              >
                ✕
              </button>
            )}
          </span>
        ))}
      </div>
      {!disabled && (
        <div className="flex gap-2">
          <Label htmlFor={`add-${label}`} className="sr-only">
            Añadir a {label}
          </Label>
          <Input
            id={`add-${label}`}
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                agregar()
              }
            }}
            placeholder="Añadir…"
          />
          <Button type="button" variant="outline" size="sm" onClick={agregar}>
            +
          </Button>
        </div>
      )}
    </fieldset>
  )
}
