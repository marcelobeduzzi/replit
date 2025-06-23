"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { dbService } from "@/lib/db-service"
import { formatCurrency, formatDate } from "@/lib/export-utils"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Edit, UserCog } from "lucide-react"
import Link from "next/link"
import type { Employee } from "@/types"

export default function VerEmpleadoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { id } = params

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchEmployee = async () => {
      setIsLoading(true)
      try {
        const data = await dbService.getEmployeeById(id)
        if (data) {
          setEmployee(data)
        } else {
          toast({
            title: "Error",
            description: "Empleado no encontrado",
            variant: "destructive",
          })
          router.push("/empleados")
        }
      } catch (error) {
        console.error("Error al cargar empleado:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar la información del empleado",
          variant: "destructive",
        })
        router.push("/empleados")
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchEmployee()
    }
  }, [id])

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex-1 p-8 flex items-center justify-center">
          <p>Cargando información del empleado...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!employee) {
    return (
      <DashboardLayout>
        <div className="flex-1 p-8 flex items-center justify-center">
          <p>No se encontró información del empleado</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/empleados" className="mr-2">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                {employee.firstName} {employee.lastName}
              </h2>
              <p className="text-muted-foreground">
                {employee.position} - {employee.local}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link href={`/empleados/${employee.id}/editar`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCog className="mr-2 h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre Completo</p>
                  <p>
                    {employee.firstName} {employee.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Documento</p>
                  <p>
                    {employee.documentType || "DNI"}: {employee.documentId}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Nacimiento</p>
                  <p>{formatDate(employee.birthDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                  <p>{employee.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{employee.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                  <p>{employee.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información Laboral</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cargo</p>
                  <p>{employee.position}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Local</p>
                  <p>{employee.local}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Ingreso</p>
                  <p>{formatDate(employee.hireDate)}</p>
                </div>
                {employee.terminationDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fecha de Egreso</p>
                    <p>{formatDate(employee.terminationDate)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Horario</p>
                  <p>
                    {(() => {
                      switch (employee.workShift) {
                        case "morning":
                          return "Mañana (8:00 - 16:00)"
                        case "afternoon":
                          return "Tarde (16:00 - 00:00)"
                        case "night":
                          return "Noche (00:00 - 8:00)"
                        case "full_time":
                          return "Tiempo Completo"
                        case "part_time":
                          return "Tiempo Parcial"
                        default:
                          return employee.workShift || "No especificado"
                      }
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <p>
                    {(() => {
                      switch (employee.status) {
                        case "active":
                          return "Activo"
                        case "inactive":
                          return "Inactivo"
                        case "on_leave":
                          return "En Licencia"
                        case "vacation":
                          return "Vacaciones"
                        default:
                          return employee.status || "No especificado"
                      }
                    })()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información Salarial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sueldo en Mano</p>
                  <p className="text-lg font-semibold">{formatCurrency(employee.baseSalary || 0)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sueldo en Banco</p>
                  <p className="text-lg font-semibold">{formatCurrency(employee.bankSalary || 0)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sueldo Total</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(employee.totalSalary || (employee.baseSalary || 0) + (employee.bankSalary || 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {employee.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{employee.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

