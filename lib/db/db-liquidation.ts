import { DatabaseServiceBase } from "./db-core"
import { objectToCamelCase, objectToSnakeCase } from "../utils"
import type { Liquidation, Employee } from "@/types"

export class LiquidationService extends DatabaseServiceBase {
  // Método para obtener liquidaciones
  async getLiquidations(isPaid = false) {
    try {
      const { data, error } = await this.supabase
        .from("liquidations")
        .select("*")
        .eq("is_paid", isPaid)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Convertir de snake_case a camelCase
      return (data || []).map((item) => objectToCamelCase(item))
    } catch (error) {
      console.error("Error al obtener liquidaciones:", error)
      throw error
    }
  }

  // Método para crear una liquidación
  async createLiquidation(liquidation: Omit<Liquidation, "id">) {
    try {
      // Convertir de camelCase a snake_case
      const liquidationData = objectToSnakeCase({
        ...liquidation,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const { data, error } = await this.supabase.from("liquidations").insert([liquidationData]).select().single()

      if (error) throw error

      // Convertir de snake_case a camelCase
      return objectToCamelCase(data)
    } catch (error) {
      console.error("Error al crear liquidación:", error)
      throw error
    }
  }

  // Método para actualizar una liquidación
  async updateLiquidation(liquidation: Liquidation) {
    try {
      // Convertir de camelCase a snake_case
      const liquidationData = objectToSnakeCase({
        ...liquidation,
        updated_at: new Date().toISOString(),
      })

      const { data, error } = await this.supabase
        .from("liquidations")
        .update(liquidationData)
        .eq("id", liquidation.id)
        .select()
        .single()

      if (error) throw error

      // Convertir de snake_case a camelCase
      return objectToCamelCase(data)
    } catch (error) {
      console.error("Error al actualizar liquidación:", error)
      throw error
    }
  }

  // Método para generar liquidaciones para empleados inactivos
  async generateLiquidations(inactiveEmployees: Employee[]) {
    try {
      let generated = 0
      let updated = 0
      let skipped = 0

      console.log("Iniciando generación de liquidaciones para", inactiveEmployees.length, "empleados inactivos")

      // Obtener liquidaciones existentes
      const { data: existingLiquidations, error: fetchError } = await this.supabase
        .from("liquidations")
        .select("id, employee_id")

      if (fetchError) {
        console.error("Error al obtener liquidaciones existentes:", fetchError)
        throw fetchError
      }

      console.log("Liquidaciones existentes encontradas:", existingLiquidations?.length || 0)

      // Crear un mapa de IDs de empleados que ya tienen liquidación para facilitar la búsqueda
      const employeesWithLiquidation = new Map(existingLiquidations?.map((liq) => [liq.employee_id, liq.id]) || [])

      // Procesar cada empleado inactivo
      for (const employee of inactiveEmployees) {
        console.log(`Procesando empleado ${employee.id}: ${employee.firstName} ${employee.lastName}`)

        // Verificar que tenga fecha de egreso
        if (!employee.terminationDate) {
          console.log(`Empleado ${employee.id} no tiene fecha de egreso, omitiendo...`)
          skipped++
          continue
        }

        // Calcular días trabajados
        const hireDate = new Date(employee.hireDate)
        const terminationDate = new Date(employee.terminationDate)
        const diffTime = Math.abs(terminationDate.getTime() - hireDate.getTime())
        const workedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        console.log(`Empleado ${employee.id} trabajó ${workedDays} días`)

        // Calcular meses trabajados
        const workedMonths = Math.floor(workedDays / 30)

        // Calcular días a pagar en el último mes
        // Si trabajó más de 30 días, solo se pagan los días adicionales al último mes completo
        const daysToPayInLastMonth = workedDays % 30

        console.log(`Días a pagar en el último mes: ${daysToPayInLastMonth}`)

        // Usar salarios del empleado directamente (base_salary + bank_salary)
        const baseSalaryFromEmployee = Number(employee.baseSalary) || 0
        const bankSalaryFromEmployee = Number(employee.bankSalary) || 0
        const totalEmployeeSalary = baseSalaryFromEmployee + bankSalaryFromEmployee
        
        console.log(`Salarios del empleado ${employee.firstName} ${employee.lastName}:`, {
          baseSalary: baseSalaryFromEmployee,
          bankSalary: bankSalaryFromEmployee,
          total: totalEmployeeSalary
        })

        // Si no tiene salarios en el empleado, intentar obtener de la última nómina
        let finalSalary = totalEmployeeSalary
        if (finalSalary === 0) {
          const { data: latestPayroll, error: payrollError } = await this.supabase
            .from("payroll")
            .select("base_salary, bank_salary")
            .eq("employee_id", employee.id)
            .order("year", { ascending: false })
            .order("month", { ascending: false })
            .limit(1)

          if (!payrollError && latestPayroll && latestPayroll.length > 0) {
            const payrollBase = Number(latestPayroll[0].base_salary) || 0
            const payrollBank = Number(latestPayroll[0].bank_salary) || 0
            finalSalary = payrollBase + payrollBank
            console.log(`Usando salario de última nómina: ${finalSalary}`)
          }
        }

        if (finalSalary === 0) {
          console.log(`Empleado ${employee.firstName} ${employee.lastName} no tiene salario definido, omitiendo...`)
          skipped++
          continue
        }

        console.log(`Salario final a usar: ${finalSalary}`)

        // Valor diario del salario
        const dailyRate = finalSalary / 30

        // Calcular monto a pagar por días trabajados en el último mes
        const lastMonthPayment = dailyRate * daysToPayInLastMonth
        console.log(`Monto a pagar por último mes: ${lastMonthPayment}`)

        // Calcular vacaciones proporcionales (siempre calculadas, pero solo se pagan si trabajó más de 20 días)
        // 1 día por mes trabajado
        const proportionalVacation = (workedMonths % 12) * (finalSalary / 30)
        console.log(`Vacaciones proporcionales: ${proportionalVacation}`)

        // Calcular aguinaldo proporcional (siempre calculado, pero solo se paga si trabajó más de 20 días)
        // 1/12 del salario por mes trabajado en el año actual
        const currentYear = terminationDate.getFullYear()
        const startOfYear = new Date(currentYear, 0, 1)
        const monthsInCurrentYear =
          hireDate > startOfYear
            ? workedMonths
            : Math.floor((terminationDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24 * 30))

        const proportionalBonus = (finalSalary / 12) * (monthsInCurrentYear % 12)
        console.log(`Aguinaldo proporcional: ${proportionalBonus}`)

        // Determinar si se incluyen vacaciones y aguinaldo por defecto (si trabajó más de 20 días)
        const includeByDefault = workedDays >= 20
        console.log(`Incluir por defecto (>= 20 días): ${includeByDefault}`)

        // Calcular indemnización (1 mes de salario por año trabajado, si corresponde)
        // Solo si trabajó más de 3 meses y no renunció voluntariamente
        const yearsWorked = Math.floor(workedMonths / 12)
        const indemnificationAmount = yearsWorked > 0 ? finalSalary * yearsWorked : 0
        console.log(`Indemnización: ${indemnificationAmount}`)

        // Calcular monto total (incluyendo o no vacaciones y aguinaldo según corresponda)
        const totalAmount =
          lastMonthPayment +
          (includeByDefault ? proportionalVacation : 0) +
          (includeByDefault ? proportionalBonus : 0) +
          indemnificationAmount

        console.log(`Monto total: ${totalAmount}`)

        // Datos de la liquidación
        const liquidationData = {
          employee_id: employee.id,
          termination_date: employee.terminationDate,
          worked_days: workedDays,
          worked_months: workedMonths,
          days_to_pay_in_last_month: daysToPayInLastMonth,
          base_salary: finalSalary, // Usar el salario final calculado
          proportional_vacation: proportionalVacation,
          proportional_bonus: proportionalBonus,
          compensation_amount: lastMonthPayment, // Monto por días trabajados en último mes
          total_amount: totalAmount,
          is_paid: false,
          include_vacation: includeByDefault,
          include_bonus: includeByDefault,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        // Verificar si ya existe una liquidación para este empleado
        if (employeesWithLiquidation.has(employee.id)) {
          const liquidationId = employeesWithLiquidation.get(employee.id)
          console.log(`Actualizando liquidación existente con ID ${liquidationId} para empleado ${employee.id}`)

          // Obtener la liquidación existente para preservar algunos campos
          const { data: existingLiquidation, error: getLiquidationError } = await this.supabase
            .from("liquidations")
            .select("*")
            .eq("id", liquidationId)
            .single()

          if (getLiquidationError) {
            console.error(`Error al obtener liquidación existente para empleado ${employee.id}:`, getLiquidationError)
            skipped++
            continue
          }

          // Preservar los valores de include_vacation e include_bonus si ya existen
          if (existingLiquidation) {
            liquidationData.include_vacation =
              existingLiquidation.include_vacation !== undefined
                ? existingLiquidation.include_vacation
                : includeByDefault

            liquidationData.include_bonus =
              existingLiquidation.include_bonus !== undefined ? existingLiquidation.include_bonus : includeByDefault

            // Recalcular el monto total basado en las inclusiones existentes
            liquidationData.total_amount =
              lastMonthPayment +
              (liquidationData.include_vacation ? proportionalVacation : 0) +
              (liquidationData.include_bonus ? proportionalBonus : 0) +
              compensationAmount

            console.log(
              `Valores preservados: include_vacation=${liquidationData.include_vacation}, include_bonus=${liquidationData.include_bonus}`,
            )
            console.log(`Monto total recalculado: ${liquidationData.total_amount}`)
          }

          // Actualizar liquidación existente
          const { error: updateError } = await this.supabase
            .from("liquidations")
            .update(liquidationData)
            .eq("id", liquidationId)

          if (updateError) {
            console.error(`Error al actualizar liquidación para empleado ${employee.id}:`, updateError)
            skipped++
            continue
          }

          updated++
          console.log(`Liquidación actualizada exitosamente para empleado ${employee.id}`)
        } else {
          console.log(`Creando nueva liquidación para empleado ${employee.id}`)
          // Crear nueva liquidación
          const { error: insertError } = await this.supabase.from("liquidations").insert(liquidationData)

          if (insertError) {
            console.error(`Error al crear liquidación para empleado ${employee.id}:`, insertError)
            skipped++
            continue
          }

          generated++
          console.log(`Liquidación creada exitosamente para empleado ${employee.id}`)
        }
      }

      console.log(`Proceso completado: ${generated} generadas, ${updated} actualizadas, ${skipped} omitidas`)
      return { generated, updated, skipped }
    } catch (error) {
      console.error("Error al generar liquidaciones:", error)
      throw new Error("No se pudieron generar las liquidaciones")
    }
  }

  /**
   * Actualiza los días a pagar del último mes en las liquidaciones existentes
   * @returns Resultado de la operación
   */
  async updateLiquidationDaysToPayInLastMonth() {
    try {
      console.log("Iniciando actualización de días a pagar en liquidaciones...")

      // Obtener todas las liquidaciones
      const { data: liquidations, error: fetchError } = await this.supabase
        .from("liquidations")
        .select(
          "id, employee_id, termination_date, include_vacation, include_bonus, proportional_vacation, proportional_bonus",
        )

      if (fetchError) throw fetchError

      if (!liquidations || liquidations.length === 0) {
        console.log("No hay liquidaciones para actualizar")
        return { updated: 0, failed: 0, skipped: 0 }
      }

      console.log(`Se encontraron ${liquidations.length} liquidaciones para procesar`)

      let updated = 0
      let failed = 0
      const skipped = 0

      // Procesar cada liquidación
      for (const liquidation of liquidations) {
        try {
          console.log(`Procesando liquidación ID: ${liquidation.id} para empleado: ${liquidation.employee_id}`)

          // Obtener información del empleado
          const { data: employee, error: employeeError } = await this.supabase
            .from("employees")
            .select("hire_date, salary, base_salary")
            .eq("id", liquidation.employee_id)
            .single()

          if (employeeError) {
            console.error(`Error al obtener empleado para liquidación ${liquidation.id}:`, employeeError)
            failed++
            continue
          }

          if (!employee) {
            console.log(`No se encontró el empleado ${liquidation.employee_id} para la liquidación ${liquidation.id}`)
            failed++
            continue
          }

          // Usar base_salary si está disponible, de lo contrario usar salary
          const employeeSalary = employee.base_salary || employee.salary || 0
          console.log(`Empleado encontrado - Fecha contratación: ${employee.hire_date}, Salario: ${employeeSalary}`)

          // Calcular los días a pagar del último mes
          const terminationDate = new Date(liquidation.termination_date)

          // Obtener el último día del mes
          const lastDayOfMonth = new Date(terminationDate.getFullYear(), terminationDate.getMonth() + 1, 0).getDate()

          // Calcular días trabajados en el último mes (hasta la fecha de terminación)
          const daysInLastMonth = Math.min(terminationDate.getDate(), lastDayOfMonth)

          console.log(`Días trabajados en el último mes: ${daysInLastMonth}`)

          // Calcular el valor diario del salario
          const dailySalary = employeeSalary / 30
          console.log(`Salario diario: ${dailySalary}`)

          // Calcular el monto de compensación (pago por días trabajados en el último mes)
          const compensationAmount = dailySalary * daysInLastMonth
          console.log(`Monto de compensación calculado: ${compensationAmount}`)

          // Calcular el nuevo monto total
          let totalAmount = compensationAmount

          // Agregar vacaciones proporcionales si se incluyen
          if (liquidation.include_vacation) {
            totalAmount += liquidation.proportional_vacation || 0
            console.log(`Incluyendo vacaciones proporcionales: ${liquidation.proportional_vacation}`)
          }

          // Agregar aguinaldo proporcional si se incluye
          if (liquidation.include_bonus) {
            totalAmount += liquidation.proportional_bonus || 0
            console.log(`Incluyendo aguinaldo proporcional: ${liquidation.proportional_bonus}`)
          }

          console.log(`Nuevo monto total calculado: ${totalAmount}`)

          // Actualizar la liquidación
          const { error: updateError } = await this.supabase
            .from("liquidations")
            .update({
              days_to_pay_in_last_month: daysInLastMonth,
              compensation_amount: compensationAmount,
              total_amount: totalAmount,
            })
            .eq("id", liquidation.id)

          if (updateError) {
            console.error(`Error al actualizar liquidación ${liquidation.id}:`, updateError)
            failed++
          } else {
            console.log(`Liquidación ${liquidation.id} actualizada correctamente`)
            updated++
          }
        } catch (error) {
          console.error(`Error al procesar liquidación ${liquidation.id}:`, error)
          failed++
        }
      }

      console.log(`Actualización completada: ${updated} actualizadas, ${failed} fallidas, ${skipped} omitidas`)
      return { updated, failed, skipped }
    } catch (error) {
      console.error("Error al actualizar días a pagar en liquidaciones:", error)
      throw error
    }
  }
}

// Crear una instancia del servicio
export const liquidationService = new LiquidationService()
