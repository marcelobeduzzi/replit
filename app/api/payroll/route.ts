import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Verificar autenticación de manera más robusta
    let currentSession = null
    let sessionUser = null

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error("Error obteniendo sesión en API payroll:", sessionError)
      } else if (sessionData?.session) {
        currentSession = sessionData.session
        sessionUser = sessionData.session.user
        console.log("Sesión activa encontrada para:", sessionUser.email)
      }

      // Si no hay sesión, intentar obtener el usuario directamente
      if (!currentSession) {
        const { data: userData, error: userError } = await supabase.auth.getUser()
        
        if (!userError && userData?.user) {
          sessionUser = userData.user
          console.log("Usuario obtenido directamente:", sessionUser.email)
          // Crear una sesión mínima para continuar
          currentSession = { user: sessionUser }
        }
      }

    } catch (authError) {
      console.error("Error en verificación de autenticación:", authError)
    }

    // Verificar si tenemos un usuario válido
    if (!sessionUser) {
      console.log("No se pudo obtener usuario válido")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("API Payroll - Usuario autenticado:", sessionUser.email)

    // Obtener parámetros de consulta
    const url = new URL(request.url)
    const month = url.searchParams.get("month")
    const year = url.searchParams.get("year")

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
      query = query.eq("month", parseInt(month)).eq("year", parseInt(year))
      console.log(`Filtrando por mes: ${month}, año: ${year}`)
    } else if (month) {
      query = query.eq("month", parseInt(month))
      console.log(`Filtrando solo por mes: ${month}`)
    } else if (year) {
      query = query.eq("year", parseInt(year))
      console.log(`Filtrando solo por año: ${year}`)
    }

    console.log("Ejecutando consulta de nóminas...")
    const { data: payrolls, error } = await query

    if (error) {
      console.error("Error al obtener nóminas:", error)
      return NextResponse.json({ error: "Error al obtener nóminas" }, { status: 500 })
    }

    console.log(`Nóminas encontradas: ${payrolls?.length || 0}`)

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
