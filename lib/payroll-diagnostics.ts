// Archivo dedicado para funciones de diagnóstico de nóminas
import { dbService } from "@/lib/db"
import { payrollService } from "@/lib/payroll-service"

/**
 * Clase para diagnóstico de problemas con nóminas
 */
export class PayrollDiagnostics {
  /**
   * Diagnóstico 1: Verifica el cálculo de ajustes sin guardar
   * @param payrollId ID de la nómina a diagnosticar
   */
  static async diagnosticCalculateAdjustments(payrollId: string) {
    try {
      console.log(`DIAGNÓSTICO: Calculando ajustes para nómina ID: ${payrollId}`)

      // Obtener la nómina
      const payroll = await payrollService.getPayrollById(payrollId)
      if (!payroll) {
        throw new Error("Nómina no encontrada")
      }

      console.log("Datos de la nómina:", JSON.stringify(payroll, null, 2))

      // Obtener el empleado
      const employeeId = payroll.employeeId || payroll.employee_id
      const employee = await dbService.getEmployeeById(employeeId)
      if (!employee) {
        throw new Error("Empleado no encontrado")
      }

      console.log("Datos del empleado:", JSON.stringify(employee, null, 2))

      // Obtener asistencias para el período
      const month = payroll.month
      const year = payroll.year
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)
      const startDateStr = startDate.toISOString().split("T")[0]
      const endDateStr = endDate.toISOString().split("T")[0]

      console.log(`Buscando asistencias desde ${startDateStr} hasta ${endDateStr}`)

      const attendances = await dbService.getAttendancesByDateRange(employeeId, startDateStr, endDateStr)

      console.log(`Se encontraron ${attendances.length} registros de asistencia`)
      if (attendances.length > 0) {
        console.log("Muestra de asistencias:", JSON.stringify(attendances.slice(0, 2), null, 2))
      }

      // Calcular ajustes usando el método privado de PayrollService
      // Nota: Esto es un hack para acceder al método privado, solo para diagnóstico
      const baseSalary = Number(payroll.baseSalary || payroll.base_salary || 0)
      // @ts-ignore - Accediendo a método privado para diagnóstico
      const { deductions, additions, details } = payrollService.calculateAdjustmentsFromAttendances(
        attendances,
        baseSalary,
      )

      console.log(`RESULTADOS DEL CÁLCULO:`)
      console.log(`- Deducciones: ${deductions}`)
      console.log(`- Adiciones: ${additions}`)
      console.log(`- Detalles: ${details.length}`)

      if (details.length > 0) {
        console.log("Muestra de detalles:", JSON.stringify(details.slice(0, 3), null, 2))
      }

      return {
        payroll,
        employee,
        attendances: attendances.length,
        calculation: { deductions, additions, detailsCount: details.length },
        details: details.slice(0, 5), // Solo devolver los primeros 5 detalles para la UI
      }
    } catch (error) {
      console.error("Error en diagnóstico:", error)
      throw error
    }
  }

  /**
   * Diagnóstico 2: Actualiza una nómina con valores fijos para verificar el guardado
   * @param payrollId ID de la nómina a actualizar
   */
  static async testUpdateWithFixedValues(payrollId: string) {
    try {
      console.log(`PRUEBA: Actualizando nómina ${payrollId} con valores fijos`)

      // Valores fijos para prueba
      const testData = {
        deductions: 100,
        additions: 200,
      }

      console.log("Datos de prueba:", testData)

      // Obtener la nómina antes de actualizar
      const beforePayroll = await payrollService.getPayrollById(payrollId)

      // Actualizar la nómina
      await dbService.updatePayroll(payrollId, testData)

      // Verificar si se guardaron correctamente
      const updatedPayroll = await payrollService.getPayrollById(payrollId)

      console.log("Nómina después de actualizar:", JSON.stringify(updatedPayroll, null, 2))

      // Verificar específicamente los campos de interés
      console.log(`Deducciones guardadas: ${updatedPayroll.deductions}`)
      console.log(`Adiciones guardadas: ${updatedPayroll.additions}`)

      return {
        before: {
          deductions: beforePayroll.deductions,
          additions: beforePayroll.additions,
        },
        testValues: testData,
        after: {
          deductions: updatedPayroll.deductions,
          additions: updatedPayroll.additions,
        },
        success: {
          deductions: updatedPayroll.deductions === testData.deductions,
          additions: updatedPayroll.additions === testData.additions,
        },
      }
    } catch (error) {
      console.error("Error en prueba:", error)
      throw error
    }
  }

  /**
   * Diagnóstico 3: Recalcula y guarda los ajustes de una nómina
   * @param payrollId ID de la nómina a recalcular
   */
  static async testRecalculateAndSave(payrollId: string) {
    try {
      console.log(`PRUEBA COMPLETA: Recalculando y guardando ajustes para nómina ${payrollId}`)

      // Obtener la nómina antes de recalcular
      const beforePayroll = await payrollService.getPayrollById(payrollId)
      if (!beforePayroll) {
        throw new Error("Nómina no encontrada")
      }

      // Obtener el empleado
      const employeeId = beforePayroll.employeeId || beforePayroll.employee_id

      // Obtener asistencias para el período
      const month = beforePayroll.month
      const year = beforePayroll.year
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)
      const startDateStr = startDate.toISOString().split("T")[0]
      const endDateStr = endDate.toISOString().split("T")[0]

      const attendances = await dbService.getAttendancesByDateRange(employeeId, startDateStr, endDateStr)
      console.log(`Se encontraron ${attendances.length} registros de asistencia`)

      // Recalcular ajustes usando el método de diagnóstico
      console.log("Recalculando ajustes...")
      const updatedPayroll = await payrollService.calculatePayrollAdjustmentsDebug(payrollId, attendances)

      console.log("Nómina después de recalcular:", JSON.stringify(updatedPayroll, null, 2))

      return {
        before: {
          deductions: beforePayroll.deductions,
          additions: beforePayroll.additions,
          finalHandSalary: beforePayroll.finalHandSalary || beforePayroll.final_hand_salary,
          totalSalary: beforePayroll.totalSalary || beforePayroll.total_salary,
        },
        after: {
          deductions: updatedPayroll.deductions,
          additions: updatedPayroll.additions,
          finalHandSalary: updatedPayroll.finalHandSalary || updatedPayroll.final_hand_salary,
          totalSalary: updatedPayroll.totalSalary || updatedPayroll.total_salary,
        },
        changed: {
          deductions: beforePayroll.deductions !== updatedPayroll.deductions,
          additions: beforePayroll.additions !== updatedPayroll.additions,
        },
      }
    } catch (error) {
      console.error("Error en prueba completa:", error)
      throw error
    }
  }

  /**
   * Diagnóstico 4: Verifica la estructura de la tabla payroll
   */
  static async checkPayrollTableStructure() {
    try {
      console.log("Verificando estructura de la tabla payroll")

      // Obtener una nómina existente para ver su estructura
      const payrolls = await dbService.getPayrollsByPeriod(1, 2023, false)

      if (payrolls && payrolls.length > 0) {
        const payroll = payrolls[0]
        console.log("ESTRUCTURA DE NÓMINA:", Object.keys(payroll))

        // Verificar si existen los campos deductions y additions
        const hasDeductions = "deductions" in payroll
        const hasAdditions = "additions" in payroll

        console.log(`Campo deductions existe: ${hasDeductions}`)
        console.log(`Campo additions existe: ${hasAdditions}`)

        // Verificar si hay campos similares que podrían estar siendo usados en su lugar
        const possibleDeductionsFields = Object.keys(payroll).filter(
          (key) =>
            key.toLowerCase().includes("deduct") ||
            key.toLowerCase().includes("discount") ||
            key.toLowerCase().includes("minus"),
        )

        const possibleAdditionsFields = Object.keys(payroll).filter(
          (key) =>
            key.toLowerCase().includes("add") ||
            key.toLowerCase().includes("plus") ||
            key.toLowerCase().includes("bonus"),
        )

        return {
          hasPayrolls: true,
          structure: Object.keys(payroll),
          hasDeductions,
          hasAdditions,
          possibleDeductionsFields,
          possibleAdditionsFields,
          samplePayroll: payroll,
        }
      } else {
        console.log("No se encontraron nóminas para verificar la estructura")
        return {
          hasPayrolls: false,
          structure: [],
          hasDeductions: false,
          hasAdditions: false,
          possibleDeductionsFields: [],
          possibleAdditionsFields: [],
        }
      }
    } catch (error) {
      console.error("Error al verificar la estructura de la tabla payroll:", error)
      throw error
    }
  }

  /**
   * Diagnóstico 5: Prueba directa de SQL para actualizar una nómina
   * @param payrollId ID de la nómina a actualizar
   */
  static async testDirectSqlUpdate(payrollId: string) {
    try {
      console.log(`PRUEBA SQL: Actualizando nómina ${payrollId} directamente con SQL`)

      // Obtener la nómina antes de actualizar
      const beforePayroll = await payrollService.getPayrollById(payrollId)

      // Valores fijos para prueba
      const testDeductions = 150
      const testAdditions = 250

      // Obtener el cliente de Supabase
      const supabase = dbService.getSupabase()

      // Ejecutar SQL directo
      const { data, error } = await supabase
        .from("payroll")
        .update({
          deductions: testDeductions,
          additions: testAdditions,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payrollId)
        .select()

      if (error) {
        console.error("Error en actualización SQL:", error)
        throw error
      }

      console.log("Resultado SQL:", data)

      // Verificar si se guardaron correctamente
      const updatedPayroll = await payrollService.getPayrollById(payrollId)

      return {
        before: {
          deductions: beforePayroll.deductions,
          additions: beforePayroll.additions,
        },
        testValues: {
          deductions: testDeductions,
          additions: testAdditions,
        },
        sqlResult: data,
        after: {
          deductions: updatedPayroll.deductions,
          additions: updatedPayroll.additions,
        },
        success: {
          deductions: updatedPayroll.deductions === testDeductions,
          additions: updatedPayroll.additions === testAdditions,
        },
      }
    } catch (error) {
      console.error("Error en prueba SQL:", error)
      throw error
    }
  }
}

export default PayrollDiagnostics
