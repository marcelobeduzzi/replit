"use client"

import type React from "react"

export function DashboardLayout({ children, isLoading }: { children: React.ReactNode; isLoading?: boolean }) {
  return <div>{children}</div>
}