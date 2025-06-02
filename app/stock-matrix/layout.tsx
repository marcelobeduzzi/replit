import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Planilla Stock Matriz",
  description: "Planilla de stock en formato matriz",
}

export default function StockMatrixLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
