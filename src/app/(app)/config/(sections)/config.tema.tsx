"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const OPCIONES = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
  { value: "system", label: "Sistema" },
]

export const TemaSelector = () => {
  // next-themes devuelve theme=undefined en SSR y en el primer render del cliente
  // (mismo markup → sin desajuste de hidratación); tras montar, resalta el activo.
  const { theme, setTheme } = useTheme()

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Apariencia</CardTitle>
        <CardDescription>El tema se guarda en este dispositivo.</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        {OPCIONES.map((o) => (
          <Button
            key={o.value}
            variant={theme === o.value ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme(o.value)}
          >
            {o.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
