import { SerwistProvider } from "@serwist/turbopack/react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { ThemeProvider } from "@/components/ui/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "SCI · La Cabaña",
  description: "Sistema de Control de Inventario — La Cabaña",
}

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <html
    lang="es"
    suppressHydrationWarning
    className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
  >
    <body className="min-h-full flex flex-col">
      <NuqsAdapter>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SerwistProvider
            swUrl="/sw.js"
            disable={process.env.NODE_ENV === "development"}
          >
            {children}
          </SerwistProvider>
          <Toaster />
        </ThemeProvider>
      </NuqsAdapter>
    </body>
  </html>
)

export default RootLayout
