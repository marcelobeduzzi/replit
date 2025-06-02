"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function CreateLiquidation() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [formData, setFormData] = useState({
    employee_id: "",
    termination_date: undefined,
    worked_days: 0,
    worked_months: 0,
    base_salary: 0,
    proportional_vacation: 0,
    proportional_bonus: 0,
    compensation_amount: 0,
    total_amount: 0,
    include_vacation: true,
    include_bonus: true,
    days_to_pay_in_last_month: 0,
  })

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("id, first_name, last_name, status")
          .eq("status", "active")
          .order("first_name")

        if (error) throw error
        setEmployees(data || [])
      } catch (error) {
        console.error("Error fetching employees:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los empleados",
          variant: "destructive",
        })
      }
    }

    fetchEmployees()
  }, [supabase])

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === "number" ? Number.parseFloat(value) || 0 : value,
    })
  }

  const handleCheckboxChange = (name) => (checked) => {
    setFormData({
      ...formData,
      [name]: checked,
    })
  }

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      termination_date: date,
    })
  }

  const calculateLiquidation = async () => {
    if (!formData.employee_id || !formData.termination_date) {
      toast({
        title: "Error",
        description: "Por favor seleccione un empleado y fecha de terminación",
        variant: "destructive",
      })
      return
    }

    setCalculating(true)
    try {
      // Obtener información del empleado
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("*")
        .eq("id", formData.employee_id)
        .single()

      if (employeeError) throw employeeError

      // Obtener fecha de contratación
      const hireDate = new Date(employeeData.hire_date)
      const terminationDate = new Date(formData.termination_date)

      // Calcular días y meses trabajados
      const diffTime = Math.abs(terminationDate - hireDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const months = Math.floor(diffDays / 30)
      const days = diffDays % 30

      // Calcular proporcionales
      const baseSalary = employeeData.salary || 0
      const dailySalary = baseSalary / 30

      // Proporcional de vacaciones (si se incluye)
      const proportionalVacation = formData.include_vacation ? (baseSalary / 12) * (months / 12) : 0

      // Proporcional de aguinaldo (si se incluye)
      const proportionalBonus = formData.include_bonus ? (baseSalary / 12) * (months / 12) : 0

      // Días a pagar del último mes
      const daysToPayInLastMonth = formData.days_to_pay_in_last_month || 0
      const lastMonthPayment = dailySalary * daysToPayInLastMonth

      // Compensación (puede ser personalizada según las políticas de la empresa)
      const compensationAmount = 0 // Esto puede ser calculado según tus reglas

      // Total
      const totalAmount = proportionalVacation + proportionalBonus + compensationAmount + lastMonthPayment

      setFormData({
        ...formData,
        worked_days: days,
        worked_months: months,
        base_salary: baseSalary,
        proportional_vacation: proportionalVacation,
        proportional_bonus: proportionalBonus,
        compensation_amount: compensationAmount,
        total_amount: totalAmount,
      })

      toast({
        title: "Cálculo completado",
        description: "Los valores han sido calculados correctamente",
      })
    } catch (error) {
      console.error("Error calculating liquidation:", error)
      toast({
        title: "Error",
        description: "No se pudo calcular la liquidación",
        variant: "destructive",
      })
    } finally {
      setCalculating(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.employee_id || !formData.termination_date) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from("liquidations").insert({
        employee_id: formData.employee_id,
        termination_date: formData.termination_date,
        worked_days: formData.worked_days,
        worked_months: formData.worked_months,
        base_salary: formData.base_salary,
        proportional_vacation: formData.proportional_vacation,
        proportional_bonus: formData.proportional_bonus,
        compensation_amount: formData.compensation_amount,
        total_amount: formData.total_amount,
        include_vacation: formData.include_vacation,
        include_bonus: formData.include_bonus,
        days_to_pay_in_last_month: formData.days_to_pay_in_last_month,
      })

      if (error) throw error

      // Actualizar el estado del empleado a 'inactive'
      const { error: updateError } = await supabase
        .from("employees")
        .update({ status: "inactive" })
        .eq("id", formData.employee_id)

      if (updateError) throw updateError

      toast({
        title: "Liquidación creada",
        description: "La liquidación ha sido creada exitosamente",
      })

      router.push("/nomina/liquidations")
    } catch (error) {
      console.error("Error creating liquidation:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la liquidación",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Crear Liquidación</h1>
      <Card>
        <CardHeader>
          <CardTitle>Datos de la Liquidación</CardTitle>
          <CardDescription>Ingrese los datos para calcular la liquidación del empleado</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="employee_id">Empleado</Label>
                <Select
                  value={formData.employee_id}
                  onValueChange={(value) => handleSelectChange("employee_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="termination_date">Fecha de Terminación</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.termination_date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.termination_date ? (
                        format(formData.termination_date, "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.termination_date}
                      onSelect={handleDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="days_to_pay_in_last_month">Días a pagar del último mes</Label>
                <Input
                  id="days_to_pay_in_last_month"
                  name="days_to_pay_in_last_month"
                  type="number"
                  min="0"
                  max="30"
                  value={formData.days_to_pay_in_last_month}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-4 flex flex-col justify-end">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include_vacation"
                    checked={formData.include_vacation}
                    onCheckedChange={handleCheckboxChange("include_vacation")}
                  />
                  <Label htmlFor="include_vacation">Incluir vacaciones proporcionales</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include_bonus"
                    checked={formData.include_bonus}
                    onCheckedChange={handleCheckboxChange("include_bonus")}
                  />
                  <Label htmlFor="include_bonus">Incluir aguinaldo proporcional</Label>
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={calculateLiquidation}
              disabled={calculating || !formData.employee_id || !formData.termination_date}
              className="w-full"
            >
              {calculating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculando...
                </>
              ) : (
                "Calcular Liquidación"
              )}
            </Button>

            {formData.total_amount > 0 && (
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-lg">Resultados del Cálculo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Tiempo Trabajado</Label>
                    <p className="text-sm text-gray-600">
                      {formData.worked_months} meses y {formData.worked_days} días
                    </p>
                  </div>
                  <div>
                    <Label>Salario Base</Label>
                    <p className="text-sm text-gray-600">${formData.base_salary.toFixed(2)}</p>
                  </div>
                  {formData.include_vacation && (
                    <div>
                      <Label>Vacaciones Proporcionales</Label>
                      <p className="text-sm text-gray-600">${formData.proportional_vacation.toFixed(2)}</p>
                    </div>
                  )}
                  {formData.include_bonus && (
                    <div>
                      <Label>Aguinaldo Proporcional</Label>
                      <p className="text-sm text-gray-600">${formData.proportional_bonus.toFixed(2)}</p>
                    </div>
                  )}
                  {formData.days_to_pay_in_last_month > 0 && (
                    <div>
                      <Label>Pago por días del último mes</Label>
                      <p className="text-sm text-gray-600">
                        ${((formData.base_salary / 30) * formData.days_to_pay_in_last_month).toFixed(2)}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label>Compensación</Label>
                    <p className="text-sm text-gray-600">${formData.compensation_amount.toFixed(2)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Total a Pagar</Label>
                    <p className="text-xl font-bold">${formData.total_amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => router.push("/nomina/liquidations")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || formData.total_amount <= 0}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Liquidación"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
