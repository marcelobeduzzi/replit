
// Este archivo existe solo para compatibilidad
// El componente principal está en app/dashboard-layout.tsx

import type React from "react"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

// Exportación por defecto corregida
export default DashboardLayout
