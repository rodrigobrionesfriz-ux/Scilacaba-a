"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { EntidadComercial } from "@/schemas/entidad-comercial.schema"

// Campos compartidos por los formularios de Proveedores y Clientes (misma forma).
type EntidadComercialFieldsProps = {
  form: EntidadComercial
  set: <K extends keyof EntidadComercial>(
    key: K,
    value: EntidadComercial[K],
  ) => void
  esEdicion: boolean
}

export const EntidadComercialFields = ({
  form,
  set,
  esEdicion,
}: EntidadComercialFieldsProps) => (
  <>
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="codigo">Código (RUT sin DV) *</Label>
        <Input
          id="codigo"
          value={form.codigo}
          onChange={(e) => set("codigo", e.target.value)}
          inputMode="numeric"
          disabled={esEdicion}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="rut">RUT (con DV)</Label>
        <Input
          id="rut"
          value={form.rut}
          onChange={(e) => set("rut", e.target.value)}
          placeholder="12345678-9"
        />
      </div>
    </div>
    <div className="flex flex-col gap-2">
      <Label htmlFor="razonSocial">Razón social *</Label>
      <Input
        id="razonSocial"
        value={form.razonSocial}
        onChange={(e) => set("razonSocial", e.target.value)}
        required
      />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="giro">Giro</Label>
        <Input
          id="giro"
          value={form.giro}
          onChange={(e) => set("giro", e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="contacto">Contacto</Label>
        <Input
          id="contacto"
          value={form.contacto}
          onChange={(e) => set("contacto", e.target.value)}
        />
      </div>
    </div>
    <div className="flex flex-col gap-2">
      <Label htmlFor="direccion">Dirección</Label>
      <Input
        id="direccion"
        value={form.direccion}
        onChange={(e) => set("direccion", e.target.value)}
      />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="comuna">Comuna</Label>
        <Input
          id="comuna"
          value={form.comuna}
          onChange={(e) => set("comuna", e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ciudad">Ciudad</Label>
        <Input
          id="ciudad"
          value={form.ciudad}
          onChange={(e) => set("ciudad", e.target.value)}
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input
          id="telefono"
          value={form.telefono}
          onChange={(e) => set("telefono", e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
      </div>
    </div>
    {esEdicion && (
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={form.activo}
          onCheckedChange={(c) => set("activo", c)}
        />
        Activo
      </label>
    )}
  </>
)
