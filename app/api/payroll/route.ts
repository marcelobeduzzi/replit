import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Verificación de autenticación simplificada
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log("Error de autenticación o usuario no encontrado:", userError?.message || "No user")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("API Payroll - Usuario autenticado:", user.email)

    // Obtener parámetros de consulta
    const url = new URL(request.url)
    const month = url.searchParams.get("month")
    const year = url.searchParams.get("year")

    console.log(`API Payroll - Parámetros recibidos: month=${month}, year=${year}`)

    let query = supabase
      .from("payroll")
      .select(`
        *,
        employees!inner(
          id,
          first_name,
          last_name,
          position,
          department,
          hand_salary,
          bank_salary,
          base_salary
        )
      `)
      .order("created_at", { ascending: false })

    // Filtrar por mes y año si se proporcionan
    if (month && year) {
      const monthNum = parseInt(month)
      const yearNum = parseInt(year)
      query = query.eq("month", monthNum).eq("year", yearNum)
      console.log(`Aplicando filtros: month=${monthNum}, year=${yearNum}`)
    } else if (month) {
      const monthNum = parseInt(month)
      query = query.eq("month", monthNum)
      console.log(`Filtrando solo por mes: ${monthNum}`)
    } else if (year) {
      const yearNum = parseInt(year)
      query = query.eq("year", yearNum)
      console.log(`Filtrando solo por año: ${yearNum}`)
    } else {
      console.log("Sin filtros aplicados - obteniendo todas las nóminas")
    }

    // Verificar primero si hay datos en la tabla
    const { data: countData, error: countError } = await supabase
      .from("payroll")
      .select("id", { count: "exact", head: true })

    if (countError) {
      console.error("Error al verificar tabla payroll:", countError)
    } else {
      console.log(`Total de registros en tabla payroll: ${countData?.length || 0}`)
    }

    console.log("Ejecutando consulta de nóminas...")
    const { data: payrolls, error } = await query

    if (error) {
      console.error("Error al obtener nóminas:", error)
      console.error("Detalles del error:", JSON.stringify(error, null, 2))
      return NextResponse.json({ error: "Error al obtener nóminas" }, { status: 500 })
    }

    console.log(`Nóminas encontradas con filtros aplicados: ${payrolls?.length || 0}`)
    
    if (payrolls && payrolls.length > 0) {
      console.log("Muestra de datos encontrados:", payrolls[0])
    }

    // Formatear los datos para el frontend
    const formattedPayrolls = payrolls.map((payroll: any) => {
      const employee = payroll.employees

      // VERIFICAR Y CORREGIR EL TOTAL SI ES NECESARIO
      const finalHandSalary = Number(payroll.final_hand_salary || payroll.hand_salary || 0)
      const bankSalary = Number(payroll.bank_salary || 0)
      const storedTotalSalary = Number(payroll.total_salary || 0)
      const calculatedTotalSalary = finalHandSalary + bankSalary

      // Si el total guardado no coincide con el calculado, usar el calculado
      const correctTotalSalary =
        Math.abs(storedTotalSalary - calculatedTotalSalary) > 1 ? calculatedTotalSalary : storedTotalSalary

      if (Math.abs(storedTotalSalary - calculatedTotalSalary) > 1) {
        console.warn(`API PAYROLLS: Corrigiendo total para empleado ${employee.first_name} ${employee.last_name}`)
        console.warn(`- Total guardado: ${storedTotalSalary}`)
        console.warn(`- Total calculado: ${calculatedTotalSalary}`)
      }

      return {
        id: payroll.id,
        employeeId: payroll.employee_id,
        employeeName: `${employee.first_name} ${employee.last_name}`,
        position: employee.position || "Sin posición",
        department: employee.department || "Sin departamento",
        month: payroll.month,
        year: payroll.year,
        handSalary: Number(payroll.hand_salary || 0),
        finalHandSalary: finalHandSalary,
        bankSalary: bankSalary,
        totalSalary: correctTotalSalary,
        isPaid: payroll.is_paid || false,
        isPaidHand: payroll.is_paid_hand || false,
        isPaidBank: payroll.is_paid_bank || false,
        status: payroll.is_paid ? "Pagado" : "Pendiente",
        createdAt: payroll.created_at,
        updatedAt: payroll.updated_at,
        // Campos adicionales para compatibilidad
        total_salary: correctTotalSalary,
        final_hand_salary: finalHandSalary,
        bank_salary: bankSalary,
        is_paid: payroll.is_paid || false,
        is_paid_hand: payroll.is_paid_hand || false,
        is_paid_bank: payroll.is_paid_bank || false,
      }
    })

    return NextResponse.json(formattedPayrolls)
  } catch (error: any) {
    console.error("Error en GET payrolls:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
