"use client"

import { useEffect, useState } from "react"
import { EditarEmpleadoForm } from "@/components/empleados/editar-empleado-form"
import { getEmpleadoById } from "@/lib/empleados"
import { useParams, useRouter } from "next/navigation"
import type { Employee } from "@/types"

export default function EditarEmpleadoPage() {
  const params = useParams()
  const router = useRouter()
  const [empleado, setEmpleado] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const id = params.id as string

  useEffect(() => {
    async function fetchEmpleado() {
      try {
        setIsLoading(true)
        const data = await getEmpleadoById(id)
        
        if (!data) {
          setError("Empleado no encontrado")
          return
        }
        
        setEmpleado(data)
      } catch (err) {
        console.error("Error al cargar empleado:", err)
        setError("Error al cargar empleado")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchEmpleado()
  }, [id])

  if (isLoading) {
    return <div className="container mx-auto py-6">Cargando...</div>
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <p className="text-red-500">{error}</p>
        <button 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => router.push("/dashboard/empleados")}
        >
          Volver a la lista
        </button>
      </div>
    )
  }

  if (!empleado) {
    return <div className="container mx-auto py-6">Empleado no encontrado</div>
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Editar Empleado</h1>
      <EditarEmpleadoForm empleado={empleado} />
    </div>
  )
}