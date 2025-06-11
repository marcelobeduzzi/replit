"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/app/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { dbService } from "@/lib/db-service"
import { formatCurrency, formatDate } from "@/lib/export-utils"
import { useToast } from "@/components/ui/use-toast"
import { Calendar, Search, Calculator, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import type { Employee, Attendance } from "@/types"

export default function DiagnosticPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [payrollData, setPayrollData] = useState<any>(null)
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null)
  const [sessionStatus, setSessionStatus] = useState<"valid" | "invalid" | "checking">("checking")
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Verificar sesión al cargar la página
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setSessionStatus(session ? "valid" : "invalid")

        // Si hay una sesión válida, almacenar un indicador en localStorage
        if (session) {
          localStorage.setItem("diagnostic_session", "active")
        }
      } catch (error) {
        console.error("Error al verificar sesión:", error)
        setSessionStatus("invalid")
      }
    }

    checkSession()
  }, [supabase.auth])

  // Cargar empleados al iniciar
  useEffect(() => {
    const loadEmployees = async () => {
      if (sessionStatus !== "valid") return

      try {
        const data = await dbService.getEmployees()
        setEmployees(data)

        // Establecer fechas predeterminadas (mes actual en 2025)
        const today = new Date()
        today.setFullYear(2025) // Forzar el año a 2025
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)

        setStartDate(firstDay.toISOString().split("T")[0])
        setEndDate(lastDay.toISOString().split("T")[0])
      } catch (error) {
        console.error("Error al cargar empleados:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los empleados",
          variant: "destructive",
        })
      }
    }

    loadEmployees()
  }, [toast, sessionStatus])

  // Función para preservar la sesión al navegar a otras páginas
  const preserveSession = () => {
    // Almacenar un token temporal en localStorage
    localStorage.setItem("diagnostic_session", "active")

    // Este token se verificará en otras páginas para mantener la sesión
    // y permitir volver a la página de diagnóstico sin iniciar sesión nuevamente
  }

  // Función para calcular manualmente los resultados
  const calculateResults = () => {
    if (!selectedEmployee || attendances.length === 0) return

    const employee = employees.find((e) => e.id === selectedEmployee)
    if (!employee) return

    // Calcular valores basados en asistencias
    const baseSalary = employee.baseSalary || 0
    const bankSalary = employee.bankSalary || 0

    // Calcular sueldo en mano (debe ser positivo)
    const totalSalaryBeforeAdjustments = bankSalary > baseSalary ? bankSalary + baseSalary : baseSalary
    const handSalary = bankSalary > baseSalary ? baseSalary : baseSalary - bankSalary

    // Calcular deducciones y adiciones
    let deductions = 0
    let additions = 0
    let totalMinutesBalance = 0

    // Valor del minuto trabajado
    const minuteValue = totalSalaryBeforeAdjustments / (30 * 8 * 60)

    console.log("Calculando resultados para", employee.firstName, employee.lastName)
    console.log("Valor del minuto:", minuteValue)

    // Procesar asistencias
    attendances.forEach((attendance) => {
      console.log("Procesando asistencia:", attendance.date)

      // Sumar balance de minutos
      totalMinutesBalance += attendance.totalMinutesBalance || 0

      // Ausencias injustificadas
      if (attendance.isAbsent && !attendance.isJustified) {
        const dailyRate = totalSalaryBeforeAdjustments / 30
        deductions += dailyRate
        console.log("- Deducción por ausencia injustificada:", dailyRate)
      }

      // Minutos tarde
      if (attendance.lateMinutes > 0) {
        const lateDeduction = attendance.lateMinutes * minuteValue
        deductions += lateDeduction
        console.log("- Deducción por", attendance.lateMinutes, "minutos tarde:", lateDeduction)
      }

      // Salida anticipada
      if (attendance.earlyDepartureMinutes > 0) {
        const earlyDeduction = attendance.earlyDepartureMinutes * minuteValue
        deductions += earlyDeduction
        console.log(
          "- Deducción por",
          attendance.earlyDepartureMinutes,
          "minutos de salida anticipada:",
          earlyDeduction,
        )
      }

      // Horas extra
      if (attendance.extraMinutes > 0) {
        const extraAddition = attendance.extraMinutes * minuteValue * 1.5
        additions += extraAddition
        console.log("- Adición por", attendance.extraMinutes, "minutos extra:", extraAddition)
      }

      // Feriados (adición por trabajar en feriado)
      if (attendance.isHoliday && !attendance.isAbsent) {
        const holidayAddition = 480 * minuteValue // Una jornada completa adicional
        additions += holidayAddition
        console.log("- Adición por trabajar en feriado:", holidayAddition)
      }
    })

    // Redondear valores
    deductions = Math.round(deductions * 100) / 100
    additions = Math.round(additions * 100) / 100

    // Calcular valores finales
    const finalHandSalary = handSalary - deductions + additions
    const totalSalary = bankSalary + finalHandSalary

    console.log("Resultados calculados:")
    console.log("- Sueldo base:", baseSalary)
    console.log("- Sueldo banco:", bankSalary)
    console.log("- Sueldo en mano original:", handSalary)
    console.log("- Deducciones:", deductions)
    console.log("- Adiciones:", additions)
    console.log("- Sueldo final en mano:", finalHandSalary)
    console.log("- Total a pagar:", totalSalary)

    // Guardar resultados del diagnóstico
    setDiagnosticResults({
      baseSalary,
      bankSalary,
      handSalary,
      deductions,
      additions,
      finalHandSalary,
      totalSalary,
      totalMinutesBalance,
      minuteValue,
    })
  }

  // Función para buscar asistencias
  const handleSearch = async () => {
    if (!selectedEmployee || !startDate || !endDate) {
      toast({
        title: "Datos incompletos",
        description: "Por favor seleccione un empleado y un rango de fechas",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setAttendances([])
    setPayrollData(null)
    setDiagnosticResults(null)

    try {
      // Obtener asistencias para el rango de fechas
      const attendanceData = await dbService.getAttendancesByDateRange(selectedEmployee, startDate, endDate)
      setAttendances(attendanceData)

      // Obtener datos de nómina para el empleado
      // Extraer mes y año de la fecha de inicio para buscar la nómina correspondiente
      const startDateObj = new Date(startDate)
      const month = startDateObj.getMonth() + 1
      const year = startDateObj.getFullYear()

      // Buscar nóminas para el empleado
      const payrolls = await dbService.getPayrollByEmployeeId(selectedEmployee)

      // Filtrar por mes y año
      const matchingPayroll = payrolls.find((p) => p.month === month && p.year === year)

      setPayrollData(matchingPayroll || null)

      // Realizar cálculos inmediatamente si hay asistencias
      if (attendanceData.length > 0) {
        // Esperar un momento para que los estados se actualicen
        setTimeout(() => {
          calculateResults()
        }, 100)
      }
    } catch (error) {
      console.error("Error al buscar datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron obtener los datos solicitados",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Diagnóstico de Nómina</h2>
            <p className="text-muted-foreground">
              Herramienta para verificar cálculos de nómina basados en asistencias
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" asChild onClick={preserveSession}>
              <Link href="/nomina">Ir a Nómina</Link>
            </Button>
          </div>
        </div>

        {sessionStatus === "invalid" && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-red-700 flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Sesión no válida
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">
                No se ha detectado una sesión válida. Por favor inicie sesión para continuar con el diagnóstico.
              </p>
              <div className="mt-4">
                <Button asChild>
                  <Link href="/login">Iniciar Sesión</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {sessionStatus === "valid" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Parámetros de Búsqueda</CardTitle>
                <CardDescription>Seleccione un empleado y un rango de fechas para analizar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee">Empleado</Label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger id="employee">
                        <SelectValue placeholder="Seleccionar empleado" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.firstName} {employee.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate">Fecha Inicio</Label>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Fecha Fin</Label>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <Button onClick={handleSearch} disabled={isLoading} className="w-full">
                      <Search className="mr-2 h-4 w-4" />
                      {isLoading ? "Buscando..." : "Buscar"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedEmployee && employees.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Información del Empleado</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const employee = employees.find((e) => e.id === selectedEmployee)
                    if (!employee) return <p>Empleado no encontrado</p>

                    return (
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <h3 className="font-medium mb-2">Datos Personales</h3>
                          <p>
                            <span className="font-medium">Nombre:</span> {employee.firstName} {employee.lastName}
                          </p>
                          <p>
                            <span className="font-medium">DNI:</span> {employee.documentId}
                          </p>
                          <p>
                            <span className="font-medium">Fecha de Ingreso:</span> {formatDate(employee.hireDate)}
                          </p>
                        </div>
                        <div>
                          <h3 className="font-medium mb-2">Datos Laborales</h3>
                          <p>
                            <span className="font-medium">Cargo:</span> {employee.position}
                          </p>
                          <p>
                            <span className="font-medium">Local:</span> {employee.local}
                          </p>
                          <p>
                            <span className="font-medium">Estado:</span> {employee.status}
                          </p>
                        </div>
                        <div>
                          <h3 className="font-medium mb-2">Datos Salariales</h3>
                          <p>
                            <span className="font-medium">Sueldo Base:</span> {formatCurrency(employee.baseSalary || 0)}
                          </p>
                          <p>
                            <span className="font-medium">Sueldo Banco:</span>{" "}
                            {formatCurrency(employee.bankSalary || 0)}
                          </p>
                          <p>
                            <span className="font-medium">Sueldo en Mano (calculado):</span>{" "}
                            {formatCurrency(
                              (employee.bankSalary || 0) > (employee.baseSalary || 0)
                                ? employee.baseSalary || 0
                                : (employee.baseSalary || 0) - (employee.bankSalary || 0),
                            )}
                          </p>
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            )}

            {attendances.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Asistencias en el Período</CardTitle>
                  <CardDescription>Se encontraron {attendances.length} registros de asistencia</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Entrada
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Salida
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Min. Tarde
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Min. Salida Ant.
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Min. Extra
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Balance Min.
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attendances.map((attendance) => (
                          <tr key={attendance.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(attendance.date)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{attendance.checkIn || "-"}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{attendance.checkOut || "-"}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{attendance.lateMinutes || 0}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {attendance.earlyDepartureMinutes || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{attendance.extraMinutes || 0}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {attendance.totalMinutesBalance || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {attendance.isAbsent
                                ? attendance.isJustified
                                  ? "Ausente Justificado"
                                  : "Ausente Injustificado"
                                : attendance.isHoliday
                                  ? "Feriado"
                                  : "Normal"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Botón para calcular manualmente si es necesario */}
                  {attendances.length > 0 && !diagnosticResults && (
                    <div className="mt-4 flex justify-end">
                      <Button onClick={calculateResults}>
                        <Calculator className="mr-2 h-4 w-4" />
                        Calcular Resultados
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {attendances.length > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="bg-blue-100">
                  <CardTitle>
                    Resultados del Cálculo para {(() => {
                      const employee = employees.find((e) => e.id === selectedEmployee)
                      return employee ? `${employee.firstName} ${employee.lastName}` : "Empleado"
                    })()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="font-medium mb-4 text-blue-800">Valores Base</h3>
                      <div className="space-y-3">
                        <p>
                          <span className="font-medium">Sueldo Base:</span>
                          <br />
                          {formatCurrency(employees.find((e) => e.id === selectedEmployee)?.baseSalary || 0)}
                        </p>
                        <p>
                          <span className="font-medium">Sueldo en Banco:</span>
                          <br />
                          {formatCurrency(employees.find((e) => e.id === selectedEmployee)?.bankSalary || 0)}
                        </p>
                        <p>
                          <span className="font-medium">Sueldo en Mano Original:</span>
                          <br />
                          {formatCurrency(
                            (() => {
                              const employee = employees.find((e) => e.id === selectedEmployee)
                              if (!employee) return 0
                              const baseSalary = employee.baseSalary || 0
                              const bankSalary = employee.bankSalary || 0
                              return bankSalary > baseSalary ? baseSalary : baseSalary - bankSalary
                            })(),
                          )}
                        </p>
                        <p>
                          <span className="font-medium">Valor del Minuto:</span>
                          <br />
                          {formatCurrency(
                            (() => {
                              const employee = employees.find((e) => e.id === selectedEmployee)
                              if (!employee) return 0
                              const baseSalary = employee.baseSalary || 0
                              const bankSalary = employee.bankSalary || 0
                              const totalSalary = bankSalary > baseSalary ? bankSalary + baseSalary : baseSalary
                              return totalSalary / (30 * 8 * 60)
                            })(),
                          )}
                        </p>
                      </div>

                      <h3 className="font-medium mb-4 mt-6 text-blue-800">Ajustes</h3>
                      <div className="space-y-3">
                        <p>
                          <span className="font-medium">Total Deducciones:</span>
                          <br />
                          <span className="text-red-600">
                            -
                            {formatCurrency(
                              (() => {
                                let deductions = 0
                                const employee = employees.find((e) => e.id === selectedEmployee)
                                if (!employee) return 0

                                const baseSalary = employee.baseSalary || 0
                                const bankSalary = employee.bankSalary || 0
                                const totalSalary = bankSalary > baseSalary ? bankSalary + baseSalary : baseSalary
                                const minuteValue = totalSalary / (30 * 8 * 60)

                                attendances.forEach((attendance) => {
                                  // Ausencias injustificadas
                                  if (attendance.isAbsent && !attendance.isJustified) {
                                    deductions += totalSalary / 30
                                  }

                                  // Minutos tarde
                                  if (attendance.lateMinutes > 0) {
                                    deductions += attendance.lateMinutes * minuteValue
                                  }

                                  // Salida anticipada
                                  if (attendance.earlyDepartureMinutes > 0) {
                                    deductions += attendance.earlyDepartureMinutes * minuteValue
                                  }
                                })

                                return Math.round(deductions * 100) / 100
                              })(),
                            )}
                          </span>
                        </p>
                        <p>
                          <span className="font-medium">Total Adiciones:</span>
                          <br />
                          <span className="text-green-600">
                            +
                            {formatCurrency(
                              (() => {
                                let additions = 0
                                const employee = employees.find((e) => e.id === selectedEmployee)
                                if (!employee) return 0

                                const baseSalary = employee.baseSalary || 0
                                const bankSalary = employee.bankSalary || 0
                                const totalSalary = bankSalary > baseSalary ? bankSalary + baseSalary : baseSalary
                                const minuteValue = totalSalary / (30 * 8 * 60)

                                attendances.forEach((attendance) => {
                                  // Horas extra
                                  if (attendance.extraMinutes > 0) {
                                    additions += attendance.extraMinutes * minuteValue * 1.5
                                  }

                                  // Feriados
                                  if (attendance.isHoliday && !attendance.isAbsent) {
                                    additions += 480 * minuteValue // Una jornada completa adicional
                                  }
                                })

                                return Math.round(additions * 100) / 100
                              })(),
                            )}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-4 text-blue-800">Resultados Finales</h3>
                      <div className="space-y-3">
                        <p>
                          <span className="font-medium">Sueldo Final en Mano:</span>
                          <br />
                          <span className="text-lg font-bold">
                            {formatCurrency(
                              (() => {
                                const employee = employees.find((e) => e.id === selectedEmployee)
                                if (!employee) return 0

                                const baseSalary = employee.baseSalary || 0
                                const bankSalary = employee.bankSalary || 0
                                const handSalary = bankSalary > baseSalary ? baseSalary : baseSalary - bankSalary
                                const totalSalary = bankSalary > baseSalary ? bankSalary + baseSalary : baseSalary
                                const minuteValue = totalSalary / (30 * 8 * 60)

                                let deductions = 0
                                let additions = 0

                                attendances.forEach((attendance) => {
                                  // Ausencias injustificadas
                                  if (attendance.isAbsent && !attendance.isJustified) {
                                    deductions += totalSalary / 30
                                  }

                                  // Minutos tarde
                                  if (attendance.lateMinutes > 0) {
                                    deductions += attendance.lateMinutes * minuteValue
                                  }

                                  // Salida anticipada
                                  if (attendance.earlyDepartureMinutes > 0) {
                                    deductions += attendance.earlyDepartureMinutes * minuteValue
                                  }

                                  // Horas extra
                                  if (attendance.extraMinutes > 0) {
                                    additions += attendance.extraMinutes * minuteValue * 1.5
                                  }

                                  // Feriados
                                  if (attendance.isHoliday && !attendance.isAbsent) {
                                    additions += 480 * minuteValue // Una jornada completa adicional
                                  }
                                })

                                return Math.round((handSalary - deductions + additions) * 100) / 100
                              })(),
                            )}
                          </span>
                        </p>
                        <p>
                          <span className="font-medium">Total a Pagar:</span>
                          <br />
                          <span className="text-lg font-bold">
                            {formatCurrency(
                              (() => {
                                const employee = employees.find((e) => e.id === selectedEmployee)
                                if (!employee) return 0

                                const baseSalary = employee.baseSalary || 0
                                const bankSalary = employee.bankSalary || 0
                                const handSalary = bankSalary > baseSalary ? baseSalary : baseSalary - bankSalary
                                const totalSalary = bankSalary > baseSalary ? bankSalary + baseSalary : baseSalary
                                const minuteValue = totalSalary / (30 * 8 * 60)

                                let deductions = 0
                                let additions = 0

                                attendances.forEach((attendance) => {
                                  // Ausencias injustificadas
                                  if (attendance.isAbsent && !attendance.isJustified) {
                                    deductions += totalSalary / 30
                                  }

                                  // Minutos tarde
                                  if (attendance.lateMinutes > 0) {
                                    deductions += attendance.lateMinutes * minuteValue
                                  }

                                  // Salida anticipada
                                  if (attendance.earlyDepartureMinutes > 0) {
                                    deductions += attendance.earlyDepartureMinutes * minuteValue
                                  }

                                  // Horas extra
                                  if (attendance.extraMinutes > 0) {
                                    additions += attendance.extraMinutes * minuteValue * 1.5
                                  }

                                  // Feriados
                                  if (attendance.isHoliday && !attendance.isAbsent) {
                                    additions += 480 * minuteValue // Una jornada completa adicional
                                  }
                                })

                                const finalHandSalary = handSalary - deductions + additions
                                return Math.round((bankSalary + finalHandSalary) * 100) / 100
                              })(),
                            )}
                          </span>
                        </p>
                      </div>

                      <div className="mt-6 p-4 bg-white rounded-md border border-blue-200">
                        <h4 className="font-medium text-blue-800 mb-2">Detalles de Cálculo</h4>
                        <ul className="space-y-2 text-sm">
                          {attendances.filter((a) => a.isAbsent && !a.isJustified).length > 0 && (
                            <li>
                              <span className="font-medium">Ausencias Injustificadas:</span>{" "}
                              {attendances.filter((a) => a.isAbsent && !a.isJustified).length} días
                            </li>
                          )}

                          {attendances.filter((a) => a.lateMinutes > 0).length > 0 && (
                            <li>
                              <span className="font-medium">Llegadas Tarde:</span>{" "}
                              {attendances.filter((a) => a.lateMinutes > 0).length} días, total{" "}
                              {attendances.reduce((sum, a) => sum + (a.lateMinutes || 0), 0)} minutos
                            </li>
                          )}

                          {attendances.filter((a) => a.earlyDepartureMinutes > 0).length > 0 && (
                            <li>
                              <span className="font-medium">Salidas Anticipadas:</span>{" "}
                              {attendances.filter((a) => a.earlyDepartureMinutes > 0).length} días, total{" "}
                              {attendances.reduce((sum, a) => sum + (a.earlyDepartureMinutes || 0), 0)} minutos
                            </li>
                          )}

                          {attendances.filter((a) => a.extraMinutes > 0).length > 0 && (
                            <li>
                              <span className="font-medium">Horas Extra:</span>{" "}
                              {attendances.filter((a) => a.extraMinutes > 0).length} días, total{" "}
                              {attendances.reduce((sum, a) => sum + (a.extraMinutes || 0), 0)} minutos
                            </li>
                          )}

                          {attendances.filter((a) => a.isHoliday && !a.isAbsent).length > 0 && (
                            <li>
                              <span className="font-medium">Días Feriados Trabajados:</span>{" "}
                              {attendances.filter((a) => a.isHoliday && !a.isAbsent).length} días
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {payrollData && (
              <Card>
                <CardHeader>
                  <CardTitle>Nómina en Base de Datos</CardTitle>
                  <CardDescription>Datos de la nómina existente para el período seleccionado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Período:</span> {payrollData.month}/{payrollData.year}
                    </p>
                    <p>
                      <span className="font-medium">Sueldo Base:</span> {formatCurrency(payrollData.baseSalary)}
                    </p>
                    <p>
                      <span className="font-medium">Sueldo Banco:</span> {formatCurrency(payrollData.bankSalary)}
                    </p>
                    <p>
                      <span className="font-medium">Sueldo en Mano Original:</span>{" "}
                      {formatCurrency(payrollData.handSalary)}
                    </p>
                    <p>
                      <span className="font-medium">Deducciones:</span> {formatCurrency(payrollData.deductions)}
                    </p>
                    <p>
                      <span className="font-medium">Adiciones:</span> {formatCurrency(payrollData.additions)}
                    </p>
                    <p>
                      <span className="font-medium">Sueldo Final en Mano:</span>{" "}
                      {formatCurrency(payrollData.finalHandSalary)}
                    </p>
                    <p>
                      <span className="font-medium">Total a Pagar:</span> {formatCurrency(payrollData.totalSalary)}
                    </p>
                    <p>
                      <span className="font-medium">Estado:</span> {payrollData.isPaid ? "Pagado" : "Pendiente"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Información sobre la sesión */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-700 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Información Importante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700">
              Esta página de diagnóstico está diseñada para verificar cálculos de nómina y facilitar la navegación
              durante el desarrollo y pruebas. Al hacer clic en los enlaces de navegación, se preservará la sesión para
              permitir volver a esta página sin necesidad de iniciar sesión nuevamente.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

