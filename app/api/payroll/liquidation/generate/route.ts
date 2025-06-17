
import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Verificar autenticación (modo permisivo para desarrollo)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    
    if (!session) {
      console.log("⚠️ No hay session de Supabase Auth, pero continuando con generación automática...")
    } else {
      console.log("✅ Sesión autenticada:", session.user?.email)
    }

    console.log("Iniciando generación automática de liquidaciones...")

    // 1. Obtener empleados inactivos con fecha de egreso
    const { data: inactiveEmployees, error: employeesError } = await supabase
      .from("employees")
      .select("*")
      .eq("status", "inactive")
      .not("termination_date", "is", null)
      .order("termination_date", { ascending: false })

    if (employeesError) {
      console.error("Error al obtener empleados inactivos:", employeesError)
      return NextResponse.json({ error: employeesError.message }, { status: 500 })
    }

    console.log(`Encontrados ${inactiveEmployees?.length || 0} empleados inactivos con fecha de egreso`)

    let generated = 0
    let updated = 0
    let skipped = 0
    const errors = []

    // 2. Procesar cada empleado inactivo
    for (const employee of inactiveEmployees || []) {
      try {
        console.log(`Procesando empleado ${employee.id}: ${employee.first_name} ${employee.last_name}`)

        // Verificar si ya existe una liquidación para este empleado
        const { data: existingLiquidation, error: checkError } = await supabase
          .from("liquidations")
          .select("id, employee_id, is_paid")
          .eq("employee_id", employee.id)
          .maybeSingle()
        
        console.log(`Verificando liquidación existente para empleado ${employee.id}:`, existingLiquidation)

        if (checkError) {
          console.error(`Error al verificar liquidación para ${employee.first_name} ${employee.last_name}:`, checkError)
          errors.push({
            employee: `${employee.first_name} ${employee.last_name}`,
            error: checkError.message,
          })
          skipped++
          continue
        }

        if (existingLiquidation) {
          console.log(`Ya existe liquidación para ${employee.first_name} ${employee.last_name}, omitiendo...`)
          skipped++
          continue
        }

        // 3. Calcular la liquidación
        if (!employee.hire_date || !employee.termination_date) {
          console.log(`Empleado ${employee.first_name} ${employee.last_name} no tiene fechas válidas, omitiendo...`)
          skipped++
          continue
        }

        const hireDate = new Date(employee.hire_date)
        const terminationDate = new Date(employee.termination_date)
        
        // Validar que las fechas sean válidas
        if (isNaN(hireDate.getTime()) || isNaN(terminationDate.getTime())) {
          console.log(`Fechas inválidas para empleado ${employee.first_name} ${employee.last_name}, omitiendo...`)
          skipped++
          continue
        }

        const diffTime = Math.abs(terminationDate.getTime() - hireDate.getTime())
        const workedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        const workedMonths = Math.floor(workedDays / 30)

        // Días a pagar en el último mes (hasta la fecha de egreso)
        const daysToPayInLastMonth = terminationDate.getDate()
        
        console.log(`Empleado ${employee.first_name} ${employee.last_name}:`, {
          hireDate: employee.hire_date,
          terminationDate: employee.termination_date,
          workedDays,
          workedMonths,
          daysToPayInLastMonth
        })

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

        // Incluir por defecto si trabajó más de 20 días
        const includeVacation = workedDays >= 20
        const includeBonus = workedDays >= 20

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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { error: insertError } = await supabase.from("liquidations").insert([liquidationData])

        if (insertError) {
          console.error(`Error al crear liquidación para ${employee.first_name} ${employee.last_name}:`, insertError)
          errors.push({
            employee: `${employee.first_name} ${employee.last_name}`,
            error: insertError.message,
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

    return NextResponse.json({
      success: true,
      generated,
      updated,
      skipped,
      errors: errors.length > 0 ? errors : null,
    })
  } catch (error: any) {
    console.error("Error general al generar liquidaciones:", error)
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        generated: 0,
        updated: 0,
        skipped: 0,
      },
      { status: 500 }
    )
  }
}
