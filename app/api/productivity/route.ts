import { NextResponse } from "next/server"
import { mockEmployeeProductivityData, mockExternalFactors } from "@/lib/mock-productivity-data"

export async function GET(request: Request) {
  // Obtener parámetros de consulta
  const { searchParams } = new URL(request.url)
  const location = searchParams.get("location")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  // Filtrar datos según los parámetros
  let filteredData = [...mockEmployeeProductivityData]

  if (location && location !== "all") {
    filteredData = filteredData.filter((employee) => employee.location === location)
  }

  if (startDate) {
    const start = new Date(startDate)
    filteredData = filteredData.filter((employee) => new Date(employee.date) >= start)
  }

  if (endDate) {
    const end = new Date(endDate)
    filteredData = filteredData.filter((employee) => new Date(employee.date) <= end)
  }

  // Simular latencia de API
  await new Promise((resolve) => setTimeout(resolve, 500))

  return NextResponse.json({
    data: filteredData,
    externalFactors: mockExternalFactors,
    meta: {
      totalEmployees: filteredData.length,
      averageScore: Math.round(filteredData.reduce((sum, emp) => sum + emp.score, 0) / filteredData.length),
      dateRange: {
        from: startDate || "2023-01-01",
        to: endDate || "2023-12-31",
      },
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Aquí se procesarían los datos para actualizar la productividad
    // Por ahora, simplemente devolvemos un mensaje de éxito

    return NextResponse.json({
      success: true,
      message: "Datos de productividad actualizados correctamente",
      updatedData: body,
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error al procesar la solicitud" }, { status: 400 })
  }
}

