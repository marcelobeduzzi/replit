"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function LiquidationMigration() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [tableStructure, setTableStructure] = useState<string[]>([])
  const [missingColumns, setMissingColumns] = useState<string[]>([])
  const [liquidations, setLiquidations] = useState<any[]>([])
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState({
    total: 0,
    updated: 0,
    failed: 0,
    skipped: 0,
  })
  const [logs, setLogs] = useState<string[]>([])

  // Columnas que deberían estar en la tabla
  const requiredColumns = [
    "id",
    "employee_id",
    "termination_date",
    "worked_days",
    "worked_months",
    "base_salary",
    "proportional_vacation",
    "proportional_bonus",
    "compensation_amount",
    "total_amount",
    "is_paid",
    "include_vacation",
    "include_bonus",
    "days_to_pay_in_last_month",
    "payment_date",
    "payment_method",
    "payment_reference",
    "notes",
    "created_at",
    "updated_at",
  ]

  useEffect(() => {
    verifyTableStructure()
  }, [])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const verifyTableStructure = async () => {
    setVerifying(true)
    addLog("Verificando estructura de la tabla liquidations...")

    try {
      // Obtener un registro para ver la estructura
      const { data, error } = await supabase.from("liquidations").select("*").limit(1)

      if (error) {
        addLog(`Error al verificar tabla: ${error.message}`)
        throw error
      }

      if (!data || data.length === 0) {
        addLog("No se encontraron registros en la tabla liquidations")
        setTableStructure([])
        setMissingColumns(requiredColumns)
        setVerifying(false)
        return
      }

      // Obtener las columnas existentes
      const existingColumns = Object.keys(data[0])
      setTableStructure(existingColumns)

      // Verificar columnas faltantes
      const missing = requiredColumns.filter((col) => !existingColumns.includes(col))
      setMissingColumns(missing)

      addLog(`Estructura actual: ${existingColumns.join(", ")}`)

      if (missing.length > 0) {
        addLog(`Columnas faltantes: ${missing.join(", ")}`)
      } else {
        addLog("La tabla tiene todas las columnas requeridas")
      }

      // Cargar todas las liquidaciones
      const { data: liquidationsData, error: liquidationsError } = await supabase.from("liquidations").select("*")

      if (liquidationsError) {
        addLog(`Error al cargar liquidaciones: ${liquidationsError.message}`)
        throw liquidationsError
      }

      setLiquidations(liquidationsData || [])
      addLog(`Se encontraron ${liquidationsData?.length || 0} liquidaciones`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al verificar la estructura: ${error.message}`,
        variant: "destructive",
      })
      addLog(`Error: ${error.message}`)
    } finally {
      setVerifying(false)
    }
  }

  const alterTable = async () => {
    if (missingColumns.length === 0) {
      addLog("No hay columnas para agregar")
      return true
    }

    setLoading(true)
    addLog("Iniciando alteración de la tabla...")

    try {
      // Usaremos RPC (Remote Procedure Call) para ejecutar SQL directamente
      // Esto requiere una función en Supabase que tenga permisos para alterar tablas

      // Como alternativa, mostraremos el SQL que se debería ejecutar
      const alterStatements = missingColumns.map((column) => {
        let dataType = "text"

        // Determinar el tipo de dato basado en el nombre de la columna
        if (column.includes("_date")) {
          dataType = "timestamp with time zone"
        } else if (column.includes("_days") || column.includes("_months") || column.includes("amount")) {
          dataType = "numeric"
        } else if (column.includes("is_") || column.includes("include_")) {
          dataType = "boolean"
        }

        return `ALTER TABLE liquidations ADD COLUMN IF NOT EXISTS ${column} ${dataType};`
      })

      addLog("Para agregar las columnas faltantes, ejecute el siguiente SQL en Supabase:")
      alterStatements.forEach((stmt) => addLog(stmt))

      // Aquí normalmente ejecutaríamos el SQL, pero como no tenemos acceso directo,
      // solo mostraremos las instrucciones

      addLog("No se pueden agregar columnas automáticamente. Por favor, ejecute el SQL manualmente.")
      return false
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al alterar la tabla: ${error.message}`,
        variant: "destructive",
      })
      addLog(`Error: ${error.message}`)
      return false
    } finally {
      setLoading(false)
    }
  }

  const updateLiquidations = async () => {
    if (liquidations.length === 0) {
      addLog("No hay liquidaciones para actualizar")
      return
    }

    setLoading(true)
    addLog("Iniciando actualización de liquidaciones...")

    let updated = 0
    let failed = 0
    let skipped = 0

    for (let i = 0; i < liquidations.length; i++) {
      const liquidation = liquidations[i]
      setProgress(Math.round(((i + 1) / liquidations.length) * 100))

      try {
        // Verificar si ya tiene days_to_pay_in_last_month
        if (liquidation.days_to_pay_in_last_month !== null && liquidation.days_to_pay_in_last_month !== undefined) {
          addLog(`Liquidación ${liquidation.id} ya tiene days_to_pay_in_last_month, omitiendo`)
          skipped++
          continue
        }

        // Calcular días a pagar en el último mes (por defecto 0)
        const daysToPayInLastMonth = 0

        // Recalcular el monto total
        const baseSalary = liquidation.base_salary || 0
        const dailySalary = baseSalary / 30
        const lastMonthPayment = dailySalary * daysToPayInLastMonth

        // Calcular el nuevo total
        let totalAmount = lastMonthPayment

        if (liquidation.include_vacation) {
          totalAmount += liquidation.proportional_vacation || 0
        }

        if (liquidation.include_bonus) {
          totalAmount += liquidation.proportional_bonus || 0
        }

        totalAmount += liquidation.compensation_amount || 0

        // Actualizar la liquidación
        const { error } = await supabase
          .from("liquidations")
          .update({
            days_to_pay_in_last_month: daysToPayInLastMonth,
            total_amount: totalAmount,
          })
          .eq("id", liquidation.id)

        if (error) {
          addLog(`Error al actualizar liquidación ${liquidation.id}: ${error.message}`)
          failed++
        } else {
          addLog(`Liquidación ${liquidation.id} actualizada correctamente`)
          updated++
        }
      } catch (error: any) {
        addLog(`Error al procesar liquidación ${liquidation.id}: ${error.message}`)
        failed++
      }
    }

    setResults({
      total: liquidations.length,
      updated,
      failed,
      skipped,
    })

    addLog(`Actualización completada: ${updated} actualizadas, ${failed} fallidas, ${skipped} omitidas`)
    setLoading(false)
  }

  const runMigration = async () => {
    // Primero intentamos alterar la tabla si es necesario
    const tableReady = await alterTable()

    // Si la tabla está lista o se ha mostrado el SQL necesario, procedemos
    if (tableReady) {
      await updateLiquidations()
    } else {
      addLog("No se puede continuar con la migración hasta que la estructura de la tabla sea corregida")
    }
  }

  // Función para calcular el monto total de la liquidación
  const calculateTotalAmount = (liquidation: any, daysToPayInLastMonth: number): number => {
    // Calcular el pago por días del último mes
    const baseSalary = liquidation.base_salary || 0
    const dailySalary = baseSalary / 30
    const lastMonthPayment = dailySalary * daysToPayInLastMonth

    // Calcular el nuevo total
    let totalAmount = lastMonthPayment

    // Agregar vacaciones proporcionales si se incluyen
    if (liquidation.include_vacation) {
      totalAmount += liquidation.proportional_vacation || 0
    }

    // Agregar aguinaldo proporcional si se incluye
    if (liquidation.include_bonus) {
      totalAmount += liquidation.proportional_bonus || 0
    }

    // Siempre agregar indemnización
    totalAmount += liquidation.compensation_amount || 0

    return totalAmount
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Migración de Liquidaciones</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Verificación de Estructura</CardTitle>
          <CardDescription>Verificando la estructura de la tabla de liquidaciones</CardDescription>
        </CardHeader>
        <CardContent>
          {verifying ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Verificando estructura de la tabla...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {missingColumns.length === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
                <span>
                  {missingColumns.length === 0
                    ? "La tabla tiene todas las columnas necesarias"
                    : `Faltan ${missingColumns.length} columnas en la tabla`}
                </span>
              </div>

              {missingColumns.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="font-medium text-amber-800 mb-2">Columnas faltantes:</p>
                  <ul className="list-disc list-inside text-sm text-amber-700">
                    {missingColumns.map((col) => (
                      <li key={col}>{col}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500 mb-1">Liquidaciones encontradas: {liquidations.length}</p>
              </div>

              <Button onClick={runMigration} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ejecutando migración...
                  </>
                ) : (
                  "Ejecutar Migración"
                )}
              </Button>
              <Button
                onClick={async () => {
                  setLoading(true)
                  addLog("Iniciando actualización de días a pagar en liquidaciones...")
                  try {
                    // Obtener todas las liquidaciones directamente
                    const { data: liquidations, error: fetchError } = await supabase.from("liquidations").select("*")

                    if (fetchError) {
                      addLog(`Error al obtener liquidaciones: ${fetchError.message}`)
                      throw fetchError
                    }

                    addLog(`Se encontraron ${liquidations?.length || 0} liquidaciones en total`)

                    if (!liquidations || liquidations.length === 0) {
                      addLog("No hay liquidaciones para actualizar")
                      toast({
                        title: "Información",
                        description: "No se encontraron liquidaciones para actualizar",
                      })
                      setLoading(false)
                      return
                    }

                    let updated = 0
                    let failed = 0
                    const skipped = 0

                    // Procesar cada liquidación
                    for (const liquidation of liquidations) {
                      try {
                        addLog(`Procesando liquidación ID: ${liquidation.id} para empleado: ${liquidation.employee_id}`)

                        // Obtener información del empleado
                        const { data: employee, error: employeeError } = await supabase
                          .from("employees")
                          .select("hire_date, termination_date")
                          .eq("id", liquidation.employee_id)
                          .single()

                        if (employeeError) {
                          addLog(
                            `Error al obtener empleado para liquidación ${liquidation.id}: ${employeeError.message}`,
                          )
                          failed++
                          continue
                        }

                        if (!employee) {
                          addLog(
                            `No se encontró el empleado ${liquidation.employee_id} para la liquidación ${liquidation.id}`,
                          )
                          failed++
                          continue
                        }

                        addLog(
                          `Empleado encontrado: fecha contratación ${employee.hire_date}, fecha terminación ${employee.termination_date || liquidation.termination_date}`,
                        )

                        // Usar la fecha de terminación del empleado o de la liquidación
                        const terminationDate = new Date(employee.termination_date || liquidation.termination_date)

                        // Calcular días trabajados en el último mes
                        const lastDayOfMonth = new Date(
                          terminationDate.getFullYear(),
                          terminationDate.getMonth() + 1,
                          0,
                        ).getDate()
                        const daysInLastMonth = Math.min(terminationDate.getDate(), lastDayOfMonth)

                        addLog(`Días calculados para el último mes: ${daysInLastMonth}`)

                        // Actualizar la liquidación
                        const { error: updateError } = await supabase
                          .from("liquidations")
                          .update({
                            days_to_pay_in_last_month: daysInLastMonth,
                            // Recalcular el monto total
                            total_amount: calculateTotalAmount(liquidation, daysInLastMonth),
                          })
                          .eq("id", liquidation.id)

                        if (updateError) {
                          addLog(`Error al actualizar liquidación ${liquidation.id}: ${updateError.message}`)
                          failed++
                        } else {
                          addLog(`Liquidación ${liquidation.id} actualizada con ${daysInLastMonth} días`)
                          updated++
                        }
                      } catch (error: any) {
                        addLog(`Error al procesar liquidación ${liquidation.id}: ${error.message}`)
                        failed++
                      }
                    }

                    addLog(`Actualización completada: ${updated} actualizadas, ${failed} fallidas, ${skipped} omitidas`)
                    toast({
                      title: "Actualización completada",
                      description: `Se actualizaron ${updated} liquidaciones con los días trabajados en el último mes.`,
                    })
                  } catch (error: any) {
                    console.error("Error:", error)
                    addLog(`Error general: ${error.message}`)
                    toast({
                      title: "Error",
                      description: "No se pudieron actualizar las liquidaciones",
                      variant: "destructive",
                    })
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="w-full mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando días a pagar...
                  </>
                ) : (
                  "Actualizar Días a Pagar"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {loading && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Progreso</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="mb-2" />
            <p className="text-sm text-center">{progress}% completado</p>
          </CardContent>
        </Card>
      )}

      {(results.updated > 0 || results.failed > 0) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-lg font-bold">{results.total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
              <div className="p-3 bg-green-50 rounded-md">
                <p className="text-lg font-bold text-green-600">{results.updated}</p>
                <p className="text-sm text-green-600">Actualizadas</p>
              </div>
              <div className="p-3 bg-red-50 rounded-md">
                <p className="text-lg font-bold text-red-600">{results.failed}</p>
                <p className="text-sm text-red-600">Fallidas</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-lg font-bold text-gray-600">{results.skipped}</p>
                <p className="text-sm text-gray-500">Omitidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
          <CardDescription>Registro de operaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm h-80 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



