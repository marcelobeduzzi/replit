import type { ReactNode } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function PagosLayout({
  children,
}: {
  children: ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
}
