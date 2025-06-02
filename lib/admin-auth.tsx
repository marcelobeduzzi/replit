"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

// Componente para proteger rutas de administración
export function AdminAuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Si no está cargando y no hay usuario o no es admin, redirigir al login
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // Mostrar nada mientras verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  // Si no hay usuario o no es admin, no mostrar nada (la redirección ocurrirá en el useEffect)
  if (!user || user.role !== "admin") {
    return null
  }

  // Si hay un usuario admin, mostrar el contenido
  return <>{children}</>
}