import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getMonthName(month: number): string {
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]
  return months[month - 1] || "Mes inválido"
}

export async function GET(request: NextRequest) {
  console.log("=== INICIO API PAYROLL DEBUG ===")
  console.log("Request URL:", request.url)

  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const status = searchParams.get("status")

    console.log("API Payroll - Parámetros recibidos:", { month, year, status })

    // Crear instancia de Supabase para el servidor
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log("Supabase configurado correctamente para el servidor")

    // Consulta optimizada para obtener nóminas con empleados activos
    let query = supabase
      .from("payroll")
      .select(`
        *,
        employees!inner (
          id,
          first_name,
          last_name,
          position,
          base_salary,
          status
        )
      `)
      .eq("employees.status", "active")
      .order("created_at", { ascending: false })

    // Aplicar filtros si existen
    if (month && month !== "all") {
      query = query.eq("month", parseInt(month))
      console.log(`Filtrando por mes: ${getMonthName(parseInt(month))}`)
    }

    if (year && year !== "all") {
      query = query.eq("year", parseInt(year))
      console.log(`Filtrando por año: ${year}`)
    }

    if (status && status !== "all") {
      if (status === "paid") {
        query = query.eq("is_paid", true)
      } else if (status === "pending") {
        query = query.eq("is_paid", false)
      }
      console.log(`Filtrando por estado: ${status}`)
    }

    // Verificar acceso a datos
    const { data: testData, error: testError, count } = await supabase
      .from("payroll")
      .select("id", { count: "exact", head: true })

    if (testError) {
      console.error("❌ Error de acceso a tabla:", testError)
    } else {
      console.log(`✅ Acceso a tabla confirmado. Total registros: ${count || 0}`)
    }

    console.log("Ejecutando consulta de nóminas...")
    const { data: payrolls, error } = await query

    if (error) {
      console.error("Error al obtener nóminas:", error)
      return NextResponse.json({ error: "Error al obtener nóminas", details: error.message }, { status: 500 })
    }

    console.log(`Nóminas encontradas: ${payrolls?.length || 0}`)

    if (payrolls && payrolls.length > 0) {
      console.log("Muestra de datos encontrados:", payrolls[0])
    }

    // Formatear los datos para el frontend con validación
    const formattedPayrolls = payrolls.map((payroll: any) => {
      // Validar que el empleado existe
      if (!payroll.employees) {
        console.warn(`Nómina ${payroll.id} sin datos de empleado`)
        return null
      }

      // Calcular salarios correctamente
      const handSalary = Number(payroll.hand_salary || payroll.base_salary || 0)
      const bankSalary = Number(payroll.bank_salary || 0)
      const deductions = Number(payroll.deductions || 0)
      const additions = Number(payroll.additions || 0)
      const attendanceBonus = Number(payroll.attendance_bonus || 0)
      const hasAttendanceBonus = Boolean(payroll.has_attendance_bonus)

      // Calcular final_hand_salary si es 0
      let finalHandSalary = Number(payroll.final_hand_salary || 0)
      if (finalHandSalary === 0) {
        finalHandSalary = handSalary - deductions + additions
      }

      // Calcular total_salary si es 0
      let totalSalary = Number(payroll.total_salary || 0)
      if (totalSalary === 0) {
        totalSalary = finalHandSalary + bankSalary + (hasAttendanceBonus ? attendanceBonus : 0)
      }

      return {
        id: payroll.id,
        employee_id: payroll.employee_id,
        year: payroll.year || new Date().getFullYear(),
        month: payroll.month || new Date().getMonth() + 1,
        hand_salary: handSalary,
        bank_salary: bankSalary,
        base_salary: Number(payroll.base_salary || 0),
        deductions: deductions,
        additions: additions,
        final_hand_salary: finalHandSalary,
        total_salary: totalSalary,
        attendance_bonus: attendanceBonus,
        has_attendance_bonus: hasAttendanceBonus,
        is_paid: Boolean(payroll.is_paid),
        is_paid_hand: Boolean(payroll.is_paid_hand),
        is_paid_bank: Boolean(payroll.is_paid_bank),
        created_at: payroll.created_at,
        updated_at: payroll.updated_at,
        employees: {
          id: payroll.employees.id,
          first_name: payroll.employees.first_name || "Sin nombre",
          last_name: payroll.employees.last_name || "",
          position: payroll.employees.position || "Sin posición",
          base_salary: Number(payroll.employees.base_salary || 0),
          status: payroll.employees.status || "active"
        }
      }
    }).filter(Boolean) // Remover registros nulos

    console.log("=== FIN API PAYROLL DEBUG ===")
    return NextResponse.json(formattedPayrolls)

  } catch (error: any) {
    console.error("Error general en API Payroll:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor", 
      details: error.message 
    }, { status: 500 })
  }
}