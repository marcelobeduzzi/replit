import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Liquidation } from "@/types"

export async function POST(request: Request) {
  try {
    const { employeeId } = await request.json()

    // Validar datos de entrada
    if (!employeeId) {
      return NextResponse.json({ error: "Se requiere ID de empleado" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // 1. Obtener información del empleado
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("*")
      .eq("id", employeeId)
      .single()

    if (employeeError || !employee) {
      console.error("Error al obtener empleado:", employeeError)
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 })
    }

    // Verificar que el empleado tenga fecha de terminación
    if (!employee.termination_date) {
      return NextResponse.json({ error: "El empleado no tiene fecha de terminación" }, { status: 400 })
    }

    // 2. Calcular días y meses trabajados
    const hireDate = new Date(employee.hire_date)
    const terminationDate = new Date(employee.termination_date)

    const workedDays = Math.floor((terminationDate.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24))
    const workedMonths = Math.floor(workedDays / 30)

    // 3. Calcular liquidación según antigüedad
    let proportionalVacation = 0
    let proportionalBonus = 0
    let compensationAmount = 0
    let baseSalary = 0
    let totalAmount = 0

    const monthlySalary = employee.hand_salary + employee.bank_salary
    const dailySalary = monthlySalary / 30

    // Calcular salario base (días trabajados en el mes actual)
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    let daysWorkedInCurrentMonth = 0

    if (terminationDate >= firstDayOfMonth) {
      // Si la terminación es en el mes actual, calcular días trabajados
      daysWorkedInCurrentMonth = Math.min(
        terminationDate.getDate(),
        new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate(),
      )

      baseSalary = dailySalary * daysWorkedInCurrentMonth
    }

    // Calcular según antigüedad
    if (workedMonths < 3) {
      // Menos de 3 meses: solo días trabajados en el mes en curso
      totalAmount = baseSalary
    } else if (workedMonths >= 6 && workedMonths < 12) {
      // De 6 a 12 meses: días trabajados + proporcional de aguinaldo + proporcional de vacaciones

      // Proporcional de aguinaldo (1 salario mensual / 12 * meses trabajados)
      proportionalBonus = (monthlySalary / 12) * workedMonths

      // Proporcional de vacaciones (1 jornada por cada 20 días trabajados)
      const vacationDays = Math.floor(workedDays / 20)
      proportionalVacation = dailySalary * vacationDays

      totalAmount = baseSalary + proportionalBonus + proportionalVacation
    } else if (workedMonths >= 12) {
      // Más de 12 meses: todo lo anterior + 1 salario por cada 12 meses

      // Proporcional de aguinaldo
      proportionalBonus = (monthlySalary / 12) * (workedMonths % 12)

      // Proporcional de vacaciones
      const vacationDays = Math.floor(workedDays / 20)
      proportionalVacation = dailySalary * vacationDays

      // Indemnización (1 salario por cada 12 meses trabajados)
      const yearsWorked = Math.floor(workedMonths / 12)
      compensationAmount = monthlySalary * yearsWorked

      totalAmount = baseSalary + proportionalBonus + proportionalVacation + compensationAmount
    }

    // 4. Crear registro de liquidación
    const liquidation: Partial<Liquidation> = {
      employeeId,
      terminationDate: employee.termination_date,
      workedDays,
      workedMonths,
      baseSalary,
      proportionalVacation,
      proportionalBonus,
      compensationAmount,
      totalAmount,
      isPaid: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // 5. Guardar liquidación en la base de datos
    const { data: newLiquidation, error: liquidationError } = await supabase
      .from("liquidations")
      .insert({
        employee_id: liquidation.employeeId,
        termination_date: liquidation.terminationDate,
        worked_days: liquidation.workedDays,
        worked_months: liquidation.workedMonths,
        base_salary: liquidation.baseSalary,
        proportional_vacation: liquidation.proportionalVacation,
        proportional_bonus: liquidation.proportionalBonus,
        compensation_amount: liquidation.compensationAmount,
        total_amount: liquidation.totalAmount,
        is_paid: false,
        created_at: liquidation.createdAt,
        updated_at: liquidation.updatedAt,
      })
      .select()
      .single()

    if (liquidationError) {
      console.error("Error al crear liquidación:", liquidationError)
      return NextResponse.json({ error: "Error al crear liquidación" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Liquidación generada correctamente",
      liquidation: newLiquidation,
    })
  } catch (error: any) {
    console.error("Error en la generación de liquidación:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}

