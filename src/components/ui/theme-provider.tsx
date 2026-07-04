"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

// Envoltorio cliente de next-themes para poder usarlo desde el root layout (server).
// Alterna la clase `.dark` en <html> (globals.css usa @custom-variant dark).
export const ThemeProvider = ({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) => (
  <NextThemesProvider {...props}>{children}</NextThemesProvider>
)
