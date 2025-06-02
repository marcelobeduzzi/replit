import { NextResponse } from "next/server"
import { dbService } from "@/lib/db-service"
import { payrollService } from "@/lib/payroll-service"

/**
 * Endpoint para corregir los valores de deducciones y adiciones en las nóminas
 *
 * Este endpoint recalcula las deducciones y adiciones basadas en las asistencias reales
 * y actualiza directamente la base de datos usando SQL para evitar problemas de tipos.
 */
export async function POST(request: Request) {
  try {
    // Obtener parámetros de la solicitud
    const params = await request.json()
    const { payrollId, month, year } = params

    console.log("Iniciando corrección de valores de nóminas con parámetros:", params)

    // Determinar qué nóminas corregir
    let payrolls = []

    if (payrollId) {
      // Corregir una nómina específica
      const payroll = await dbService.getPayrollById(payrollId)
      if (payroll) {
        payrolls = [payroll]
      } else {
        return NextResponse.json({ error: "Nómina no encontrada" }, { status: 404 })
      }
    } else if (month && year) {
      // Corregir nóminas de un período específico
      payrolls = await dbService.getPayrollsByPeriod(month, year, false)
    } else {
      // Corregir todas las nóminas (limitado a 100 para evitar sobrecarga)
      const { data, error } = await dbService.getSupabase().from("payroll").select("*").limit(100)

      if (error) {
        throw error
      }

      payrolls = data
    }

    console.log(`Se encontraron ${payrolls.length} nóminas para corregir`)

    // Resultados
    const results = {
      total: payrolls.length,
      fixed: 0,
      errors: 0,
      details: [],
    }

    // Procesar cada nómina
    for (const payroll of payrolls) {
      try {
        const payrollId = payroll.id
        console.log(`Procesando nómina ID: ${payrollId}`)

        // Obtener información del empleado
        const employeeId = payroll.employee_id || payroll.employeeId

        // Calcular el rango de fechas para el período
        const month = payroll.month
        const year = payroll.year
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0)
        const startDateStr = startDate.toISOString().split("T")[0]
        const endDateStr = endDate.toISOString().split("T")[0]

        // Obtener asistencias del empleado para el período
        const attendances = await dbService.getAttendancesByDateRange(employeeId, startDateStr, endDateStr)
        console.log(`Se encontraron ${attendances.length} registros de asistencia para el empleado ${employeeId}`)

        // Obtener el salario base para los cálculos
        const baseSalary = Number(payroll.baseSalary || payroll.base_salary || 0)

        // Usar el método existente para calcular deducciones y adiciones
        const { deductions, additions } = payrollService["calculateAdjustmentsFromAttendances"](attendances, baseSalary)

        console.log(`Valores calculados: deductions=${deductions}, additions=${additions}`)

        // Actualizar directamente usando SQL para evitar problemas de tipos
        const { error } = await dbService.getSupabase().rpc("update_payroll_values", {
          p_id: payrollId,
          p_deductions: deductions,
          p_additions: additions,
        })

        if (error) {
          console.error(`Error al actualizar nómina ${payrollId} usando RPC:`, error)

          // Intentar actualización directa con SQL si RPC falla
          const { error: sqlError } = await dbService
            .getSupabase()
            .from("payroll")
            .update({
              deductions: deductions,
              additions: additions,
            })
            .eq("id", payrollId)

          if (sqlError) {
            throw sqlError
          }
        }

        // Recalcular los valores finales
        const handSalary = Number(payroll.handSalary || payroll.hand_salary || 0)
        const bankSalary = Number(payroll.bankSalary || payroll.bank_salary || 0)
        const attendanceBonus = Number(payroll.attendanceBonus || payroll.attendance_bonus || 0)
        const hasAttendanceBonus = Boolean(payroll.hasAttendanceBonus || payroll.has_attendance_bonus || false)

        const finalHandSalary = handSalary - deductions + additions
        const totalSalary = bankSalary + finalHandSalary + (hasAttendanceBonus ? attendanceBonus : 0)

        // Actualizar los valores finales
        const { error: updateError } = await dbService
          .getSupabase()
          .from("payroll")
          .update({
            final_hand_salary: finalHandSalary,
            total_salary: totalSalary,
          })
          .eq("id", payrollId)

        if (updateError) {
          throw updateError
        }

        // Verificar que los valores se hayan guardado correctamente
        const { data: updatedData, error: verifyError } = await dbService
          .getSupabase()
          .from("payroll")
          .select("deductions, additions, final_hand_salary, total_salary")
          .eq("id", payrollId)
          .single()

        if (verifyError) {
          throw verifyError
        }

        const updatedDeductions = Number(updatedData.deductions || 0)
        const updatedAdditions = Number(updatedData.additions || 0)

        if (Math.abs(updatedDeductions - deductions) < 0.01 && Math.abs(updatedAdditions - additions) < 0.01) {
          console.log(`Nómina ${payrollId} actualizada correctamente`)
          results.fixed++
          results.details.push({
            id: payrollId,
            status: "fixed",
            before: { deductions: payroll.deductions || 0, additions: payroll.additions || 0 },
            after: { deductions: updatedDeductions, additions: updatedAdditions },
          })
        } else {
          console.error(
            `Nómina ${payrollId} no se actualizó correctamente. Valores esperados: deductions=${deductions}, additions=${additions}. Valores actuales: deductions=${updatedDeductions}, additions=${updatedAdditions}`,
          )
          results.errors++
          results.details.push({
            id: payrollId,
            status: "error",
            message: "Los valores no se actualizaron correctamente",
            expected: { deductions, additions },
            actual: { deductions: updatedDeductions, additions: updatedAdditions },
          })
        }
      } catch (error) {
        console.error(`Error al procesar nómina ${payroll.id}:`, error)
        results.errors++
        results.details.push({
          id: payroll.id,
          status: "error",
          message: error.message,
        })
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error general:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
