import { NextResponse } from "next/server"

// Lista de días festivos en Argentina para 2023
const holidays2023 = [
  { date: "2023-01-01", name: "Año Nuevo" },
  { date: "2023-02-20", name: "Carnaval" },
  { date: "2023-02-21", name: "Carnaval" },
  { date: "2023-03-24", name: "Día Nacional de la Memoria por la Verdad y la Justicia" },
  { date: "2023-04-02", name: "Día del Veterano y de los Caídos en la Guerra de Malvinas" },
  { date: "2023-04-07", name: "Viernes Santo" },
  { date: "2023-05-01", name: "Día del Trabajador" },
  { date: "2023-05-25", name: "Día de la Revolución de Mayo" },
  { date: "2023-06-17", name: "Paso a la Inmortalidad del General Martín Miguel de Güemes" },
  { date: "2023-06-20", name: "Paso a la Inmortalidad del General Manuel Belgrano" },
  { date: "2023-07-09", name: "Día de la Independencia" },
  { date: "2023-08-21", name: "Paso a la Inmortalidad del General José de San Martín" },
  { date: "2023-10-16", name: "Día del Respeto a la Diversidad Cultural" },
  { date: "2023-11-20", name: "Día de la Soberanía Nacional" },
  { date: "2023-12-08", name: "Inmaculada Concepción de María" },
  { date: "2023-12-25", name: "Navidad" },
]

export async function GET(request: Request) {
  // Obtener parámetros de consulta
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  let filteredHolidays = [...holidays2023]

  // Filtrar por rango de fechas si se proporcionan
  if (startDate) {
    const start = new Date(startDate)
    filteredHolidays = filteredHolidays.filter((holiday) => new Date(holiday.date) >= start)
  }

  if (endDate) {
    const end = new Date(endDate)
    filteredHolidays = filteredHolidays.filter((holiday) => new Date(holiday.date) <= end)
  }

  // Simular latencia de API
  await new Promise((resolve) => setTimeout(resolve, 200))

  return NextResponse.json({
    holidays: filteredHolidays,
    meta: {
      total: filteredHolidays.length,
      year: 2023,
    },
  })
}

