"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { actualizarEmpleado } from "@/lib/empleados"
import type { Employee, Local, UserRole, WorkShift, EmployeeStatus } from "@/types"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

interface EditarEmpleadoFormProps {
  empleado: Employee
}

export function EditarEmpleadoForm({ empleado }: EditarEmpleadoFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: empleado.firstName,
    lastName: empleado.lastName,
    documentId: empleado.documentId,
    documentType: empleado.documentType,
    phone: empleado.phone,
    email: empleado.email,
    address: empleado.address,
    birthDate: empleado.birthDate,
    hireDate: empleado.hireDate,
    terminationDate: empleado.terminationDate || "",
    position: empleado.position,
    local: empleado.local,
    workShift: empleado.workShift,
    baseSalary: empleado.baseSalary.toString(),
    bankSalary: empleado.bankSalary.toString(),
    totalSalary: empleado.totalSalary.toString(),
    status: empleado.status,
    role: empleado.role,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target

    if (type === "number") {
      setFormData((prev) => {
        // Permitir explícitamente el valor 0
        // Si el valor es vacío, usar "0"
        const newValue = value === "" ? "0" : value
        const newData = { ...prev, [name]: newValue }

        // Actualizar sueldo total automáticamente
        if (name === "baseSalary" || name === "bankSalary") {
          const baseSalary = Number.parseFloat(name === "baseSalary" ? newValue : prev.baseSalary) || 0
          const bankSalary = Number.parseFloat(name === "bankSalary" ? newValue : prev.bankSalary) || 0
          newData.totalSalary = (baseSalary + bankSalary).toString()
        }

        return newData
      })
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await actualizarEmpleado(empleado.id, {
        ...formData,
        baseSalary: Number.parseFloat(formData.baseSalary) || 0,
        bankSalary: Number.parseFloat(formData.bankSalary) || 0,
        totalSalary: Number.parseFloat(formData.totalSalary) || 0,
      })

      toast.success("Empleado actualizado correctamente")
      router.push("/dashboard/empleados")
      router.refresh()
    } catch (error) {
      console.error("Error al actualizar empleado:", error)
      toast.error("Error al actualizar empleado")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre</Label>
              <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentType">Tipo de Documento</Label>
              <Select
                value={formData.documentType}
                onValueChange={(value) => handleSelectChange("documentType", value)}
              >
                <SelectTrigger>
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
              <Input id="documentId" name="documentId" value={formData.documentId} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                value={formData.birthDate.split("T")[0]}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Cargo</Label>
              <Input id="position" name="position" value={formData.position} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="local">Local</Label>
              <Select value={formData.local} onValueChange={(value) => handleSelectChange("local", value as Local)}>
                <SelectTrigger>
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
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select value={formData.role} onValueChange={(value) => handleSelectChange("role", value as UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="employee">Empleado</SelectItem>
                  <SelectItem value="cashier">Cajero</SelectItem>
                  <SelectItem value="waiter">Mesero</SelectItem>
                  <SelectItem value="kitchen">Cocina</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workShift">Turno</Label>
              <Select
                value={formData.workShift}
                onValueChange={(value) => handleSelectChange("workShift", value as WorkShift)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Mañana</SelectItem>
                  <SelectItem value="afternoon">Tarde</SelectItem>
                  <SelectItem value="night">Noche</SelectItem>
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
                <SelectTrigger>
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
              <Label htmlFor="hireDate">Fecha de Contratación</Label>
              <Input
                id="hireDate"
                name="hireDate"
                type="date"
                value={formData.hireDate.split("T")[0]}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="terminationDate">Fecha de Terminación</Label>
              <Input
                id="terminationDate"
                name="terminationDate"
                type="date"
                value={formData.terminationDate ? formData.terminationDate.split("T")[0] : ""}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseSalary">Sueldo en Mano</Label>
              <Input
                id="baseSalary"
                name="baseSalary"
                type="number"
                min="0"
                step="0.01"
                value={formData.baseSalary === "0" ? "0" : formData.baseSalary}
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
                value={formData.bankSalary === "0" ? "0" : formData.bankSalary}
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
                value={formData.totalSalary === "0" ? "0" : formData.totalSalary}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}



