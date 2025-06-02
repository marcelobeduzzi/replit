import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export async function generateLiquidations() {
  // Crear el cliente con las claves explícitas solo para esta función
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  let generated = 0
  const updated = 0
  let skipped = 0
  const errors = []

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
        console.log(`Procesando empleado ${employee.id}: ${employee.first_name} ${employee.last_name}`)

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
          console.log(`Ya existe una liquidación para ${employee.first_name} ${employee.last_name}`)
          skipped++
          continue
        }

        // 3. Calcular la liquidación
        const hireDate = new Date(employee.hire_date)
        const terminationDate = new Date(employee.termination_date)

        if (isNaN(hireDate.getTime()) || isNaN(terminationDate.getTime())) {
          console.error(`Fechas inválidas para ${employee.first_name} ${employee.last_name}`)
          skipped++
          continue
        }

        const diffTime = Math.abs(terminationDate.getTime() - hireDate.getTime())
        const workedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        const workedMonths = Math.floor(workedDays / 30)

        // Días a pagar en el último mes
        const daysToPayInLastMonth = terminationDate.getDate()

        // Calcular montos
        const baseSalary = Number(employee.salary) || 0
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

        // Incluir por defecto si trabajó más de 20 días
        const includeByDefault = workedDays >= 20

        // Total
        const totalAmount =
          lastMonthPayment + (includeByDefault ? proportionalVacation : 0) + (includeByDefault ? proportionalBonus : 0)

        // 4. Crear la liquidación
        console.log(`Creando nueva liquidación para empleado ${employee.id}`)

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
          include_vacation: includeByDefault,
          include_bonus: includeByDefault,
          days_to_pay_in_last_month: daysToPayInLastMonth,
        }

        console.log("Datos de liquidación a insertar:", liquidationData)

        // Usar el método .insert() con autenticación explícita
        const { data, error } = await supabase.from("liquidations").insert([liquidationData]).select()

        if (error) {
          console.error(`Error al crear liquidación para ${employee.first_name} ${employee.last_name}:`, error)
          errors.push({
            employee: `${employee.first_name} ${employee.last_name}`,
            error: error.message,
          })
          skipped++
        } else {
          generated++
          console.log(`Liquidación creada exitosamente para ${employee.first_name} ${employee.last_name}`)
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
  // Crear el cliente con las claves explícitas solo para esta función
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

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
