import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"

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

    const supabase = createClient()

    // Crear la consulta base corrigiendo la estructura
    let query = supabase
      .from("payroll")
      .select(`
        id,
        employee_id,
        year,
        month,
        hand_salary,
        bank_salary,
        final_hand_salary,
        total_salary,
        is_paid,
        is_paid_hand,
        is_paid_bank,
        created_at,
        updated_at,
        employees!inner (
          id,
          first_name,
          last_name,
          position,
          base_salary,
          hand_salary,
          bank_salary
        )
      `)
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

    // Formatear los datos para el frontend
    const formattedPayrolls = payrolls.map((payroll: any) => ({
      id: payroll.id,
      employee_id: payroll.employee_id,
      year: payroll.year,
      month: payroll.month,
      hand_salary: payroll.hand_salary,
      bank_salary: payroll.bank_salary,
      final_hand_salary: payroll.final_hand_salary,
      total_salary: payroll.total_salary,
      is_paid: payroll.is_paid,
      is_paid_hand: payroll.is_paid_hand,
      is_paid_bank: payroll.is_paid_bank,
      created_at: payroll.created_at,
      updated_at: payroll.updated_at,
      employees: {
        id: payroll.employees.id,
        first_name: payroll.employees.first_name,
        last_name: payroll.employees.last_name,
        position: payroll.employees.position,
        base_salary: payroll.employees.base_salary,
        hand_salary: payroll.employees.hand_salary,
        bank_salary: payroll.employees.bank_salary
      }
    }))

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