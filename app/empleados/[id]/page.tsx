"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/app/dashboard-layout"

export default function EmpleadoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params

  useEffect(() => {
    // Redirigir a la página de edición
    router.push(`/empleados/editar/${id}`)
  }, [id, router])

  return (
    <DashboardLayout>
      <div className="flex-1 p-8 flex items-center justify-center">
        <p>Redirigiendo...</p>
      </div>
    </DashboardLayout>
  )
}