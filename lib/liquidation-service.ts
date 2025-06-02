import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "./supabase/client"

export type Liquidation = {
  id: string
  employee_id: string
  amount: number
  status: "pending" | "completed" | "cancelled"
  created_at: string
  updated_at: string
  notes?: string
}

export async function generateLiquidations() {
  const supabase = createClientComponentClient()
  let generated = 0
  const updated = 0
  let skipped = 0
  let errors = []

  try {
    // 1. Obtener todos los empleados inactivos con fecha de egreso
    const { data: inactiveEmployees, error: employeesError } = await supabase
      .from("employees")
      .select("*")
      .eq("status", "inactive")
      .not("termination_date", "is", null)

    if (employeesError) {
      console.error("Error al obtener empleados inactivos:", employeesError)
      return { success: false, error: employeesError.message }
    }

    console.log(`Encontrados ${inactiveEmployees?.length || 0} empleados inactivos con fecha de egreso`)

    // 2. Para cada empleado, verificar si ya tiene liquidación
    for (const employee of inactiveEmployees || []) {
      try {
        // Verificar si ya existe una liquidación
        const { data: existingLiquidation, error: checkError } = await supabase
          .from("liquidations")
          .select("id")
          .eq("employee_id", employee.id)
          .maybeSingle()

        if (checkError) {
          console.error(`Error al verificar liquidación para ${employee.first_name} ${employee.last_name}:`, checkError)
          errors.push({
            employee: `${employee.first_name} ${employee.last_name}`,
            error: checkError.message,
          })
          skipped++
          continue
        }

        // Si ya existe, actualizar si es necesario
        if (existingLiquidation) {
          // Opcionalmente actualizar si hay cambios en el empleado
          // Por ahora solo lo saltamos
          skipped++
          continue
        }

        // 3. Calcular la liquidación
        const hireDate = new Date(employee.hire_date)
        const terminationDate = new Date(employee.termination_date)
        const diffTime = Math.abs(terminationDate.getTime() - hireDate.getTime())
        const workedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        const workedMonths = Math.floor(workedDays / 30)

        // Días a pagar en el último mes
        const daysToPayInLastMonth = terminationDate.getDate()

        // Calcular montos
        const baseSalary = Number.parseFloat(employee.salary) || 0
        const dailySalary = baseSalary / 30
        const lastMonthPayment = dailySalary * daysToPayInLastMonth

        // Proporcional de vacaciones (1 día por mes trabajado)
        const proportionalVacation = (workedMonths % 12) * (baseSalary / 30)

        // Proporcional de aguinaldo (1/12 del salario por mes trabajado en el año actual)
        const currentYear = terminationDate.getFullYear()
        const startOfYear = new Date(currentYear, 0, 1)
        const monthsInCurrentYear =
          hireDate > startOfYear
            ? workedMonths
            : Math.floor((terminationDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24 * 30))

        const proportionalBonus = (baseSalary / 12) * (monthsInCurrentYear % 12)

        // Incluir por defecto
        const includeVacation = true
        const includeBonus = true

        // Total
        const totalAmount =
          lastMonthPayment + (includeVacation ? proportionalVacation : 0) + (includeBonus ? proportionalBonus : 0)

        // 4. Crear la liquidación
        const liquidationData = {
          employee_id: employee.id,
          termination_date: employee.termination_date,
          worked_days: workedDays,
          worked_months: workedMonths,
          base_salary: baseSalary,
          proportional_vacation: proportionalVacation,
          proportional_bonus: proportionalBonus,
          compensation_amount: lastMonthPayment,
          total_amount: totalAmount,
          is_paid: false,
          include_vacation: includeVacation,
          include_bonus: includeBonus,
          days_to_pay_in_last_month: daysToPayInLastMonth,
        }

        const { data: insertedLiquidation, error: insertError } = await supabase.from("liquidations").insert([liquidationData]).select().single()

        if (insertError) {
          console.error(`Error al crear liquidación para ${employee.first_name} ${employee.last_name}:`, insertError)
          errors.push({
            employee: `${employee.first_name} ${employee.last_name}`,
            error: insertError.message,
          })
          skipped++
        } else {
          generated++
        }
      } catch (employeeError) {
        console.error(`Error al procesar empleado ${employee.first_name} ${employee.last_name}:`, employeeError)
        errors.push({
          employee: `${employee.first_name} ${employee.last_name}`,
          error: String(employeeError),
        })
        skipped++
      }
    }

    return {
      success: true,
      generated,
      updated,
      skipped,
      errors: errors.length > 0 ? errors : null,
    }
  } catch (error) {
    console.error("Error general al generar liquidaciones:", error)
    return {
      success: false,
      error: String(error),
      generated,
      updated,
      skipped,
    }
  }
}

// Función para marcar liquidaciones como pagadas
export async function markLiquidationsAsPaid(
  liquidationIds: string[],
  paymentDetails: {
    payment_date: string
    payment_method: string
    payment_reference?: string
    notes?: string
  },
) {
  const supabase = createClientComponentClient()

  try {
    const { error } = await supabase
      .from("liquidations")
      .update({
        is_paid: true,
        payment_date: paymentDetails.payment_date,
        payment_method: paymentDetails.payment_method,
        payment_reference: paymentDetails.payment_reference,
        notes: paymentDetails.notes,
        updated_at: new Date().toISOString(),
      })
      .in("id", liquidationIds)

    if (error) {
      console.error("Error al marcar liquidaciones como pagadas:", error)
      return { success: false, error: error.message }
    }

    return { success: true, count: liquidationIds.length }
  } catch (error) {
    console.error("Error general al marcar liquidaciones como pagadas:", error)
    return { success: false, error: String(error) }
  }
}

export const liquidationService = {
  async getLiquidations() {
    const { data, error } = await supabase
      .from("liquidations")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching liquidations:", error)
      throw error
    }

    return data
  },

  async getLiquidationById(id: string) {
    const { data, error } = await supabase
      .from("liquidations")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching liquidation:", error)
      throw error
    }

    return data
  },

  async createLiquidation(liquidation: Omit<Liquidation, "id">) {
    const { data, error } = await supabase
      .from("liquidations")
      .insert(liquidation)
      .select()
      .single()

    if (error) {
      console.error("Error creating liquidation:", error)
      throw error
    }

    return data
  },

  async updateLiquidation(id: string, liquidation: Partial<Liquidation>) {
    const { data, error } = await supabase
      .from("liquidations")
      .update(liquidation)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating liquidation:", error)
      throw error
    }

    return data
  },

  async deleteLiquidation(id: string) {
    const { error } = await supabase
      .from("liquidations")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting liquidation:", error)
      throw error
    }
  }
}
