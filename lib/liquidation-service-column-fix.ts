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

        // IMPORTANTE: Usar days_to_pay_in_last_month en lugar de days_to_pay
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
          days_to_pay_in_last_month: daysToPayInLastMonth, // Nombre correcto de la columna
          version: 1, // Añadir versión inicial
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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
/**
 * Marca múltiples liquidaciones como pagadas
 * @param liquidationIds IDs de las liquidaciones a marcar como pagadas
 * @param paymentDetails Detalles del pago
 * @returns Resultado de la operación
 */
export async function markLiquidationsAsPaid(liquidationIds: string[], paymentDetails: any) {
  try {
    console.log(`Marcando ${liquidationIds.length} liquidaciones como pagadas:`, liquidationIds)

    const supabase = createClientComponentClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    })

    // Convertir fecha a formato ISO si es necesario
    const paymentDate = paymentDetails.payment_date
      ? new Date(paymentDetails.payment_date).toISOString()
      : new Date().toISOString()

    // Datos de actualización
    const updateData = {
      is_paid: true,
      payment_date: paymentDate,
      payment_method: paymentDetails.payment_method || "transfer",
      payment_reference: paymentDetails.payment_reference || "",
      notes: paymentDetails.notes || "",
      updated_at: new Date().toISOString(),
    }

    // Actualizar todas las liquidaciones seleccionadas
    const { error } = await supabase.from("liquidations").update(updateData).in("id", liquidationIds)

    if (error) {
      console.error("Error al marcar liquidaciones como pagadas:", error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      message: `${liquidationIds.length} liquidaciones marcadas como pagadas correctamente`,
    }
  } catch (error: any) {
    console.error("Error en markLiquidationsAsPaid:", error)
    return { success: false, error: error.message || "Error desconocido" }
  }
}

// Nueva función para regenerar una liquidación
export async function regenerateLiquidation(liquidationId: string) {
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  try {
    // 1. Obtener la liquidación actual
    const { data: currentLiquidation, error: getLiquidationError } = await supabase
      .from("liquidations")
      .select("*")
      .eq("id", liquidationId)
      .single()

    if (getLiquidationError) {
      console.error("Error al obtener liquidación:", getLiquidationError)
      return { success: false, error: getLiquidationError.message }
    }

    if (!currentLiquidation) {
      return { success: false, error: "Liquidación no encontrada" }
    }

    // 2. Obtener datos actualizados del empleado
    const { data: employee, error: getEmployeeError } = await supabase
      .from("employees")
      .select("*")
      .eq("id", currentLiquidation.employee_id)
      .single()

    if (getEmployeeError) {
      console.error("Error al obtener empleado:", getEmployeeError)
      return { success: false, error: getEmployeeError.message }
    }

    if (!employee) {
      return { success: false, error: "Empleado no encontrado" }
    }

    // 3. Recalcular la liquidación con los datos actuales
    const hireDate = new Date(employee.hire_date)
    const terminationDate = new Date(employee.termination_date || currentLiquidation.termination_date)

    if (isNaN(hireDate.getTime()) || isNaN(terminationDate.getTime())) {
      return { success: false, error: "Fechas inválidas para el cálculo" }
    }

    const diffTime = Math.abs(terminationDate.getTime() - hireDate.getTime())
    const workedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const workedMonths = Math.floor(workedDays / 30)

    // Días a pagar en el último mes (usar el valor existente o recalcular)
    const daysToPayInLastMonth = currentLiquidation.days_to_pay_in_last_month || terminationDate.getDate()

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

    // Mantener las preferencias de inclusión de la liquidación original
    const includeVacation = currentLiquidation.include_vacation
    const includeBonus = currentLiquidation.include_bonus

    // Total
    const totalAmount =
      lastMonthPayment + (includeVacation ? proportionalVacation : 0) + (includeBonus ? proportionalBonus : 0)

    // 4. Crear la nueva versión de la liquidación
    const newVersion = (currentLiquidation.version || 1) + 1

    // Actualizar la liquidación existente
    const updateData = {
      base_salary: baseSalary,
      proportional_vacation: proportionalVacation,
      proportional_bonus: proportionalBonus,
      compensation_amount: lastMonthPayment,
      total_amount: totalAmount,
      days_to_pay_in_last_month: daysToPayInLastMonth,
      version: newVersion,
      previous_version_id: currentLiquidation.id,
      regenerated_at: new Date().toISOString(),
      regenerated_by: "admin", // Idealmente, usar el usuario actual
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase.from("liquidations").update(updateData).eq("id", liquidationId)

    if (updateError) {
      console.error("Error al actualizar liquidación:", updateError)
      return { success: false, error: updateError.message }
    }

    return {
      success: true,
      message: "Liquidación regenerada correctamente",
      liquidation: {
        ...currentLiquidation,
        ...updateData,
      },
    }
  } catch (error) {
    console.error("Error general al regenerar liquidación:", error)
    return { success: false, error: String(error) }
  }
}
