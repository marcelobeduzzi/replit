import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

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
      query = query.eq("month", month).eq("year", year)
    }

    const { data: payrolls, error } = await query

    if (error) {
      console.error("Error al obtener nóminas:", error)
      return NextResponse.json({ error: "Error al obtener nóminas" }, { status: 500 })
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
        handSalary: Number(employee.hand_salary || 0), // Salario original del empleado
        finalHandSalary: finalHandSalary, // Salario calculado final
        bankSalary: bankSalary,
        totalSalary: correctTotalSalary, // USAR EL TOTAL CORREGIDO
        status: payroll.is_paid ? "Pagado" : "Pendiente",
        createdAt: payroll.created_at,
        updatedAt: payroll.updated_at,
        // Campos adicionales para compatibilidad
        total_salary: correctTotalSalary,
        final_hand_salary: finalHandSalary,
        bank_salary: bankSalary,
      }
    })

    return NextResponse.json(formattedPayrolls)
  } catch (error: any) {
    console.error("Error en GET payrolls:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
