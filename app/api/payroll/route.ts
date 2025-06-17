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
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    console.log("API Payroll - Parámetros:", { month, year, status, page, limit })

    // Crear instancia de Supabase para el servidor con mejor configuración
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    )

    // Calcular offset para paginación
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Consulta optimizada con paginación
    let query = supabase
      .from("payroll")
      .select(`
        id,
        employee_id,
        month,
        year,
        base_salary,
        hand_salary,
        bank_salary,
        final_hand_salary,
        total_salary,
        is_paid,
        is_paid_hand,
        is_paid_bank,
        created_at,
        updated_at,
        attendance_bonus,
        has_attendance_bonus,
        employees!inner (
          id,
          first_name,
          last_name,
          position,
          status
        )
      `, { count: "exact" })
      .eq("employees.status", "active")
      .order("created_at", { ascending: false })
      .range(from, to)

    // Aplicar filtros
    if (month && month !== "all") {
      query = query.eq("month", parseInt(month))
    }

    if (year && year !== "all") {
      query = query.eq("year", parseInt(year))
    }

    if (status && status !== "all") {
      if (status === "paid") {
        query = query.eq("is_paid", true)
      } else if (status === "pending") {
        query = query.eq("is_paid", false)
      }
    }

    const { data: payrolls, error, count } = await query

    if (error) {
      console.error("Error al obtener nóminas:", error)
      return NextResponse.json({ error: "Error al obtener nóminas", details: error.message }, { status: 500 })
    }

    console.log(`Nóminas encontradas: ${payrolls?.length || 0} de ${count || 0} total`)

    // Formatear los datos de manera más eficiente
    const formattedPayrolls = (payrolls || []).map((payroll: any) => ({
      id: payroll.id,
      employee_id: payroll.employee_id,
      year: payroll.year,
      month: payroll.month,
      hand_salary: Number(payroll.hand_salary || 0),
      bank_salary: Number(payroll.bank_salary || 0),
      base_salary: Number(payroll.base_salary || 0),
      final_hand_salary: Number(payroll.final_hand_salary || 0),
      total_salary: Number(payroll.total_salary || 0),
      attendance_bonus: Number(payroll.attendance_bonus || 0),
      has_attendance_bonus: Boolean(payroll.has_attendance_bonus),
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
        status: payroll.employees.status || "active"
      }
    }))

    // Respuesta con paginación
    const totalPages = Math.ceil((count || 0) / limit)
    
    return NextResponse.json({
      data: formattedPayrolls,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error: any) {
    console.error("Error general en API Payroll:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor", 
      details: error.message 
    }, { status: 500 })
  }
}