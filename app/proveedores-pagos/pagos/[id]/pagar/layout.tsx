import type { ReactNode } from "react"
import DashboardLayout from "@/app/dashboard-layout"

export default function PagarLayout({
  children,
}: {
  children: ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
}
