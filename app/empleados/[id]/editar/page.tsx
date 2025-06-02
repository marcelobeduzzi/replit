"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { dbService } from "@/lib/db-service"
import type { Employee, Local, WorkShift, EmployeeStatus, UserRole } from "@/types"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

export default function EditarEmpleadoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { id } = params

  const [formData, setFormData] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estado para horario personalizado
  const [useCustomSchedule, setUseCustomSchedule] = useState(false)

  useEffect(() => {
    const fetchEmployee = async () => {
      setIsLoading(true)
      try {
        const employee = await dbService.getEmployeeById(id)
        if (employee) {
          // Asegurarse de que bankSalary sea un número, incluso si es 0
          if (employee.bankSalary === null || employee.bankSalary === undefined) {
            employee.bankSalary = 0
          }

          // Asegurarse de que baseSalary sea un número
          if (employee.baseSalary === null || employee.baseSalary === undefined) {
            employee.baseSalary = 0
          }

          // Calcular totalSalary
          employee.totalSalary = (employee.baseSalary || 0) + (employee.bankSalary || 0)

          // Verificar si tiene horario personalizado
          if (employee.customCheckIn && employee.customCheckOut) {
            setUseCustomSchedule(true)
          }

          // Asegurarse de que attendanceBonus tenga un valor
          if (employee.attendanceBonus === undefined) {
            employee.attendanceBonus = false
          }

          setFormData(employee)
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
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmployee()
  }, [id, router, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target

    if (!formData) return

    if (type === "number") {
      // Convertir a número o usar 0 si está vacío
      const numValue = value === "" ? 0 : Number.parseFloat(value)

      setFormData((prev) => {
        if (!prev) return prev

        const newData = { ...prev, [name]: numValue }

        // Actualizar sueldo total automáticamente
        if (name === "baseSalary" || name === "bankSalary") {
          newData.totalSalary = (newData.baseSalary || 0) + (newData.bankSalary || 0)
        }

        return newData
      })
    } else {
      setFormData((prev) => {
        if (!prev) return prev
        return { ...prev, [name]: value }
      })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    if (!formData) return

    setFormData((prev) => {
      if (!prev) return prev
      return { ...prev, [name]: value }
    })
  }

  const handleCustomScheduleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    // Extraer el nombre del campo sin el "expected" al inicio
    const fieldName = name === "expectedCheckIn" ? "customCheckIn" : "customCheckOut"

    setFormData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [fieldName]: value,
      }
    })
  }

  const handleAttendanceBonusChange = (checked: boolean) => {
    if (!formData) return

    setFormData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        attendanceBonus: checked,
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    setIsSubmitting(true)

    try {
      // Asegurarse de que bankSalary y baseSalary sean números antes de enviar
      const dataToSubmit = {
        ...formData,
        bankSalary: typeof formData.bankSalary === "number" ? formData.bankSalary : 0,
        baseSalary: typeof formData.baseSalary === "number" ? formData.baseSalary : 0,
        totalSalary: typeof formData.totalSalary === "number" ? formData.totalSalary : 0,
      }

      if (!useCustomSchedule) {
        // Si no se usa horario personalizado, establecer los valores como null
        dataToSubmit.customCheckIn = null
        dataToSubmit.customCheckOut = null
      }

      const updatedEmployee = await dbService.updateEmployee(id, dataToSubmit)

      if (updatedEmployee) {
        toast({
          title: "Empleado actualizado",
          description: `${updatedEmployee.firstName} ${updatedEmployee.lastName} ha sido actualizado correctamente.`,
        })

        router.push("/empleados")
      } else {
        throw new Error("No se pudo actualizar el empleado")
      }
    } catch (error) {
      console.error("Error al actualizar empleado:", error)

      toast({
        title: "Error",
        description: "No se pudo actualizar el empleado. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para obtener el texto del horario según el valor
  const getWorkShiftText = (shift: string) => {
    const shiftMap: Record<string, string> = {
      morning: "Mañana (8:00 - 16:00)",
      afternoon: "Tarde (16:00 - 00:00)",
      night: "Noche (00:00 - 8:00)",
      full_time: "Tiempo Completo",
      part_time: "Tiempo Parcial",
    }
    return shiftMap[shift] || shift
  }

  if (isLoading || !formData) {
    return (
      <DashboardLayout>
        <div className="flex-1 p-8 flex items-center justify-center">
          <p>Cargando información del empleado...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center">
          <Link href="/empleados" className="mr-2">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Editar Empleado</h2>
            <p className="text-muted-foreground">
              Actualiza la información de {formData.firstName} {formData.lastName}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="personal" className="space-y-4">
            <TabsList>
              <TabsTrigger value="personal">Información Personal</TabsTrigger>
              <TabsTrigger value="laboral">Información Laboral</TabsTrigger>
              <TabsTrigger value="horario">Horario</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                  <CardDescription>Actualiza los datos personales del empleado</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nombre</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="Nombre"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Apellido</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Apellido"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="documentType">Tipo de Documento</Label>
                      <Select
                        value={formData.documentType}
                        onValueChange={(value) => handleSelectChange("documentType", value)}
                      >
                        <SelectTrigger id="documentType">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DNI">DNI</SelectItem>
                          <SelectItem value="CUIT">CUIT</SelectItem>
                          <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="documentId">Número de Documento</Label>
                      <Input
                        id="documentId"
                        name="documentId"
                        placeholder="Número de documento"
                        value={formData.documentId}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="Número de teléfono"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Dirección</Label>
                      <Input
                        id="address"
                        name="address"
                        placeholder="Dirección completa"
                        value={formData.address}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                      <Input
                        id="birthDate"
                        name="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="laboral">
              <Card>
                <CardHeader>
                  <CardTitle>Información Laboral</CardTitle>
                  <CardDescription>Actualiza los datos laborales del empleado</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="position">Cargo</Label>
                      <Input
                        id="position"
                        name="position"
                        placeholder="Cargo"
                        value={formData.position}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Rol en el Sistema</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) => handleSelectChange("role", value as UserRole)}
                      >
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="manager">Gerente</SelectItem>
                          <SelectItem value="employee">Empleado</SelectItem>
                          <SelectItem value="cashier">Cajero</SelectItem>
                          <SelectItem value="waiter">Mesero</SelectItem>
                          <SelectItem value="kitchen">Cocina</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="local">Local</Label>
                      <Select
                        value={formData.local}
                        onValueChange={(value) => handleSelectChange("local", value as Local)}
                      >
                        <SelectTrigger id="local">
                          <SelectValue placeholder="Seleccionar local" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BR Cabildo">BR Cabildo</SelectItem>
                          <SelectItem value="BR Carranza">BR Carranza</SelectItem>
                          <SelectItem value="BR Pacifico">BR Pacifico</SelectItem>
                          <SelectItem value="BR Lavalle">BR Lavalle</SelectItem>
                          <SelectItem value="BR Rivadavia">BR Rivadavia</SelectItem>
                          <SelectItem value="BR Aguero">BR Aguero</SelectItem>
                          <SelectItem value="BR Dorrego">BR Dorrego</SelectItem>
                          <SelectItem value="Dean & Dennys">Dean & Dennys</SelectItem>
                          <SelectItem value="Administración">Administración</SelectItem>
                          <SelectItem value="Capacitación">Capacitación</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hireDate">Fecha de Ingreso</Label>
                      <Input
                        id="hireDate"
                        name="hireDate"
                        type="date"
                        value={formData.hireDate}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="terminationDate">Fecha de Egreso</Label>
                      <Input
                        id="terminationDate"
                        name="terminationDate"
                        type="date"
                        value={formData.terminationDate || ""}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workShift">Horario</Label>
                      <Select
                        value={formData.workShift}
                        onValueChange={(value) => handleSelectChange("workShift", value as WorkShift)}
                      >
                        <SelectTrigger id="workShift">
                          <SelectValue placeholder="Seleccionar horario" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Mañana (8:00 - 16:00)</SelectItem>
                          <SelectItem value="afternoon">Tarde (16:00 - 00:00)</SelectItem>
                          <SelectItem value="night">Noche (00:00 - 8:00)</SelectItem>
                          <SelectItem value="full_time">Tiempo Completo</SelectItem>
                          <SelectItem value="part_time">Tiempo Parcial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Estado</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => handleSelectChange("status", value as EmployeeStatus)}
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="inactive">Inactivo</SelectItem>
                          <SelectItem value="on_leave">En Licencia</SelectItem>
                          <SelectItem value="vacation">Vacaciones</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="baseSalary">Sueldo en Mano</Label>
                      <Input
                        id="baseSalary"
                        name="baseSalary"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.baseSalary === 0 ? "0" : formData.baseSalary || ""}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankSalary">Sueldo en Banco</Label>
                      <Input
                        id="bankSalary"
                        name="bankSalary"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.bankSalary === 0 ? "0" : formData.bankSalary || ""}
                        onChange={handleChange}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Puede ser 0 para empleados no registrados formalmente.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalSalary">Sueldo Total</Label>
                      <Input
                        id="totalSalary"
                        name="totalSalary"
                        type="number"
                        placeholder="0.00"
                        value={formData.totalSalary === 0 ? "0" : formData.totalSalary || ""}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="attendanceBonus"
                          checked={formData.attendanceBonus}
                          onCheckedChange={handleAttendanceBonusChange}
                        />
                        <Label htmlFor="attendanceBonus" className="font-medium">
                          Aplicar bono de presentismo ($50,000)
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">
                        Este bono se aplicará mensualmente si el empleado cumple con los requisitos de asistencia.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="horario">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de Horario</CardTitle>
                  <CardDescription>Configura el horario personalizado del empleado</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="useCustomSchedule"
                        checked={useCustomSchedule}
                        onCheckedChange={(checked) => setUseCustomSchedule(checked === true)}
                      />
                      <Label htmlFor="useCustomSchedule" className="font-medium">
                        Usar horario personalizado
                      </Label>
                    </div>

                    {useCustomSchedule && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 border rounded-md">
                        <div className="space-y-2">
                          <Label htmlFor="expectedCheckIn">Hora de entrada</Label>
                          <Input
                            id="expectedCheckIn"
                            name="expectedCheckIn"
                            type="time"
                            value={formData.customCheckIn || ""}
                            onChange={handleCustomScheduleChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expectedCheckOut">Hora de salida</Label>
                          <Input
                            id="expectedCheckOut"
                            name="expectedCheckOut"
                            type="time"
                            value={formData.customCheckOut || ""}
                            onChange={handleCustomScheduleChange}
                          />
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground">
                            Este horario personalizado se utilizará para calcular las horas trabajadas, llegadas tarde y
                            salidas anticipadas.
                          </p>
                        </div>
                      </div>
                    )}

                    {!useCustomSchedule && (
                      <div className="p-4 border rounded-md bg-muted/50">
                        <h3 className="font-medium mb-2">Horario actual: {getWorkShiftText(formData.workShift)}</h3>
                        <p className="text-sm text-muted-foreground">
                          Se utilizará el horario estándar definido en la configuración del sistema para este turno.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button variant="outline" type="button" onClick={() => router.push("/empleados")}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </DashboardLayout>
  )
}
