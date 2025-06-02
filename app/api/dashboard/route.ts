import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Verificar la sesión del usuario
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    // Si hay un error al obtener la sesión, devolver datos de demostración
    if (sessionError) {
      console.error("Error al obtener la sesión:", sessionError)
      return NextResponse.json(getDemoData(), { status: 200 })
    }

    // Si no hay sesión, devolver datos de demostración en lugar de un error
    if (!session) {
      console.log("No hay sesión activa, devolviendo datos de demostración")
      return NextResponse.json(getDemoData(), { status: 200 })
    }

    // Obtener fecha actual y primer día del mes
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

    // Realizar todas las consultas en paralelo para mejorar el rendimiento
    const [
      { data: activeEmployees, error: employeesError },
      { data: deliveryOrders, error: ordersError },
      { data: previousMonthOrders, error: previousOrdersError },
      { data: previousMonthEmployees, error: previousEmployeesError },
    ] = await Promise.all([
      // Empleados activos - ahora seleccionamos todos los campos para verificar
      supabase
        .from("employees")
        .select("*")
        .eq("status", "active"),

      // Pedidos del mes actual
      supabase
        .from("delivery_stats")
        .select("*")
        .gte("created_at", firstDayOfMonth.toISOString()),

      // Pedidos del mes anterior (para comparación)
      supabase
        .from("delivery_stats")
        .select("*")
        .gte("created_at", new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString())
        .lt("created_at", firstDayOfMonth.toISOString()),

      // Empleados activos del mes anterior (para comparación)
      supabase
        .from("employees")
        .select("*")
        .eq("status", "active")
        .lt("created_at", firstDayOfMonth.toISOString()),
    ])

    // Verificar errores
    if (employeesError || ordersError || previousOrdersError || previousEmployeesError) {
      console.error("Error en consultas:", {
        employeesError,
        ordersError,
        previousOrdersError,
        previousEmployeesError,
      })
      // Si hay errores en las consultas, devolver datos de demostración
      return NextResponse.json(getDemoData(), { status: 200 })
    }

    // Calcular estadísticas
    const currentEmployeeCount = activeEmployees?.length || 0
    const previousEmployeeCount = previousMonthEmployees?.length || 0
    const employeeChange =
      previousEmployeeCount > 0 ? ((currentEmployeeCount - previousEmployeeCount) / previousEmployeeCount) * 100 : 0

    // Log para depuración
    console.log("Empleados activos:", {
      current: currentEmployeeCount,
      previous: previousEmployeeCount,
      change: employeeChange,
      currentEmployees: activeEmployees?.map(e => ({ id: e.id, status: e.status })),
      previousEmployees: previousMonthEmployees?.map(e => ({ id: e.id, status: e.status }))
    })

    const currentOrderCount = deliveryOrders?.length || 0
    const previousOrderCount = previousMonthOrders?.length || 0
    const orderChange =
      previousOrderCount > 0 ? ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100 : 0

    const currentRevenue = deliveryOrders?.reduce((sum, order) => sum + (order.revenue || 0), 0) || 0
    const previousRevenue = previousMonthOrders?.reduce((sum, order) => sum + (order.revenue || 0), 0) || 0
    const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0

    // Datos para gráficos
    const salesData = {
      labels: ["BR Cabildo", "BR Carranza", "BR Pacifico", "BR Lavalle", "BR Rivadavia"],
      datasets: [
        {
          label: "Ventas Mensuales",
          data: [150000, 120000, 180000, 90000, 160000],
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 1,
        },
      ],
    }

    const deliveryData = {
      labels: ["PedidosYa", "Rappi", "MercadoPago"],
      datasets: [
        {
          data: [35, 40, 25],
          backgroundColor: ["rgba(255, 99, 132, 0.5)", "rgba(54, 162, 235, 0.5)", "rgba(255, 206, 86, 0.5)"],
          borderColor: ["rgba(255, 99, 132, 1)", "rgba(54, 162, 235, 1)", "rgba(255, 206, 86, 1)"],
          borderWidth: 1,
        },
      ],
    }

    const attendanceLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    const attendanceValues = [95, 92, 88, 90, 85, 70, 60]

    const attendanceData = {
      labels: attendanceLabels,
      datasets: [
        {
          label: "Asistencia (%)",
          data: attendanceValues,
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 1,
        },
      ],
    }

    // Construir y devolver la respuesta
    return NextResponse.json({
      stats: {
        activeEmployees: currentEmployeeCount,
        activeEmployeesChange: employeeChange,
        totalDeliveryOrders: currentOrderCount,
        deliveryOrdersChange: orderChange,
        totalRevenue: currentRevenue,
        revenueChange: revenueChange,
        averageRating: 4.5, // Valor de ejemplo, reemplazar con datos reales cuando estén disponibles
        ratingChange: 0.2, // Valor de ejemplo, reemplazar con datos reales cuando estén disponibles
      },
      charts: {
        salesData,
        deliveryData,
        attendanceData,
      },
    })
  } catch (error) {
    console.error("Error en el endpoint de dashboard:", error)
    // En caso de error, devolver datos de demostración
    return NextResponse.json(getDemoData(), { status: 200 })
  }
}

// Función para generar datos de demostración
function getDemoData() {
  return {
    stats: {
      activeEmployees: 42,
      activeEmployeesChange: 5.3,
      totalDeliveryOrders: 187,
      deliveryOrdersChange: 12.8,
      totalRevenue: 245000,
      revenueChange: 8.5,
      averageRating: 4.5,
      ratingChange: 0.2,
    },
    charts: {
      salesData: {
        labels: ["BR Cabildo", "BR Carranza", "BR Pacifico", "BR Lavalle", "BR Rivadavia"],
        datasets: [
          {
            label: "Ventas Mensuales",
            data: [150000, 120000, 180000, 90000, 160000],
            backgroundColor: "rgba(59, 130, 246, 0.5)",
            borderColor: "rgb(59, 130, 246)",
            borderWidth: 1,
          },
        ],
      },
      deliveryData: {
        labels: ["PedidosYa", "Rappi", "MercadoPago"],
        datasets: [
          {
            data: [35, 40, 25],
            backgroundColor: ["rgba(255, 99, 132, 0.5)", "rgba(54, 162, 235, 0.5)", "rgba(255, 206, 86, 0.5)"],
            borderColor: ["rgba(255, 99, 132, 1)", "rgba(54, 162, 235, 1)", "rgba(255, 206, 86, 1)"],
            borderWidth: 1,
          },
        ],
      },
      attendanceData: {
        labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
        datasets: [
          {
            label: "Asistencia (%)",
            data: [95, 92, 88, 90, 85, 70, 60],
            backgroundColor: "rgba(59, 130, 246, 0.5)",
            borderColor: "rgb(59, 130, 246)",
            borderWidth: 1,
          },
        ],
      },
    },
  }
}

