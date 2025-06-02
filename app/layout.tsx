import type React from "react"
import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import "react-datepicker/dist/react-datepicker.css"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthInitializer } from "@/components/AuthInitializer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Gestión Quadrifoglio",
  description: "Sistema de gestión para restaurantes Quadrifoglio",
  generator: "v0.dev",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Agregar un link para cargar los estilos de react-datepicker desde CDN */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/react-datepicker@4.21.0/dist/react-datepicker.min.css"
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthInitializer>
            <AuthProvider>{children}</AuthProvider>
          </AuthInitializer>
        </ThemeProvider>
      </body>
    </html>
  )
}