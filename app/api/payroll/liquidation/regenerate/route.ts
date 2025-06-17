
import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { liquidationId } = await request.json()

    if (!liquidationId) {
      return NextResponse.json({ error: "ID de liquidación requerido" }, { status: 400 })
    }

    console.log(`Regenerando liquidación individual: ${liquidationId}`)

    // 1. Obtener la liquidación existente
    const { data: currentLiquidation, error: liquidationError } = await supabase
      .from("liquidations")
      .select("*")
      .eq("id", liquidationId)
      .single()

    if (liquidationError || !currentLiquidation) {
      console.error("Error al obtener liquidación:", liquidationError)
      return NextResponse.json({ error: "Liquidación no encontrada" }, { status: 404 })
    }

    // 2. Obtener información del empleado
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("*")
      .eq("id", currentLiquidation.employee_id)
      .single()

    if (employeeError || !employee) {
      console.error("Error al obtener empleado:", employeeError)
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 })
    }

    console.log(`Recalculando liquidación para empleado: ${employee.first_name} ${employee.last_name}`)

    // 3. Validar fechas
    if (!employee.hire_date || !employee.termination_date) {
      return NextResponse.json({ error: "Empleado no tiene fechas válidas" }, { status: 400 })
    }

    const hireDate = new Date(employee.hire_date)
    const terminationDate = new Date(employee.termination_date)
    
    if (isNaN(hireDate.getTime()) || isNaN(terminationDate.getTime())) {
      return NextResponse.json({ error: "Fechas inválidas" }, { status: 400 })
    }

    // 4. Calcular días y meses trabajados
    const diffTime = Math.abs(terminationDate.getTime() - hireDate.getTime())
    const workedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const workedMonths = Math.floor(workedDays / 30)

    // 5. Días a pagar en el último mes (hasta la fecha de egreso)
    const daysToPayInLastMonth = terminationDate.getDate()
    
    console.log(`Empleado ${employee.first_name} ${employee.last_name}:`, {
      hireDate: employee.hire_date,
      terminationDate: employee.termination_date,
      workedDays,
      workedMonths,
      daysToPayInLastMonth
    })

    // 6. Calcular salarios usando las columnas correctas (base_salary + bank_salary)
    const baseSalaryFromDB = Number.parseFloat(employee.base_salary) || 0
    const bankSalaryFromDB = Number.parseFloat(employee.bank_salary) || 0
    let totalMonthlySalary = baseSalaryFromDB + bankSalaryFromDB
    
    console.log(`Salarios del empleado ${employee.first_name} ${employee.last_name}:`, {
      base_salary: baseSalaryFromDB,
      bank_salary: bankSalaryFromDB,
      total: totalMonthlySalary
    })

    // 7. Si no tiene salarios en el empleado, intentar obtener de la última nómina
    if (totalMonthlySalary === 0) {
      const { data: latestPayroll, error: payrollError } = await supabase
        .from("payroll")
        .select("base_salary, bank_salary")
        .eq("employee_id", employee.id)
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .limit(1)

      if (!payrollError && latestPayroll && latestPayroll.length > 0) {
        const payrollBase = Number.parseFloat(latestPayroll[0].base_salary) || 0
        const payrollBank = Number.parseFloat(latestPayroll[0].bank_salary) || 0
        totalMonthlySalary = payrollBase + payrollBank
        console.log(`Usando salario de última nómina: ${totalMonthlySalary}`)
      }
    }

    if (totalMonthlySalary === 0) {
      return NextResponse.json({ 
        error: `Empleado ${employee.first_name} ${employee.last_name} no tiene salario definido` 
      }, { status: 400 })
    }

    // 8. Calcular montos
    const dailySalary = totalMonthlySalary / 30
    const lastMonthPayment = dailySalary * daysToPayInLastMonth

    // Proporcional de vacaciones (1 día por mes trabajado)
    const proportionalVacation = (workedMonths % 12) * (totalMonthlySalary / 30)

    // Proporcional de aguinaldo (1/12 del salario por mes trabajado en el año actual)
    const currentYear = terminationDate.getFullYear()
    const startOfYear = new Date(currentYear, 0, 1)
    const monthsInCurrentYear = hireDate > startOfYear
      ? workedMonths
      : Math.floor((terminationDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24 * 30))

    const proportionalBonus = (totalMonthlySalary / 12) * (monthsInCurrentYear % 12)

    // Mantener las preferencias de inclusión existentes
    const includeVacation = currentLiquidation.include_vacation
    const includeBonus = currentLiquidation.include_bonus

    // Calcular indemnización (1 mes de salario por año trabajado)
    const yearsWorked = Math.floor(workedMonths / 12)
    const indemnificationAmount = yearsWorked > 0 ? totalMonthlySalary * yearsWorked : 0

    // Total
    const totalAmount = lastMonthPayment + 
                       (includeVacation ? proportionalVacation : 0) + 
                       (includeBonus ? proportionalBonus : 0) + 
                       indemnificationAmount

    console.log(`Cálculos finales para ${employee.first_name} ${employee.last_name}:`, {
      lastMonthPayment,
      proportionalVacation,
      proportionalBonus,
      indemnificationAmount,
      includeVacation,
      includeBonus,
      totalAmount
    })

    // 9. Actualizar la liquidación
    const updateData = {
      worked_days: workedDays,
      worked_months: workedMonths,
      days_to_pay_in_last_month: daysToPayInLastMonth,
      base_salary: totalMonthlySalary,
      proportional_vacation: proportionalVacation,
      proportional_bonus: proportionalBonus,
      compensation_amount: lastMonthPayment,
      total_amount: totalAmount,
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from("liquidations")
      .update(updateData)
      .eq("id", liquidationId)

    if (updateError) {
      console.error("Error al actualizar liquidación:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log(`Liquidación ${liquidationId} regenerada exitosamente`)

    return NextResponse.json({
      success: true,
      message: "Liquidación regenerada correctamente",
      liquidation: {
        ...currentLiquidation,
        ...updateData
      }
    })

  } catch (error: any) {
    console.error("Error general al regenerar liquidación:", error)
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    )
  }
}
