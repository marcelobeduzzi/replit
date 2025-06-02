import { NextResponse } from "next/server"

// Simulación de API de clima
export async function GET(request: Request) {
  // Obtener parámetros de consulta
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0]
  const location = searchParams.get("location") || "Buenos Aires"

  // Generar datos de clima simulados
  const weatherData = generateWeatherData(date, location)

  // Simular latencia de API
  await new Promise((resolve) => setTimeout(resolve, 300))

  return NextResponse.json(weatherData)
}

// Función para generar datos de clima simulados
function generateWeatherData(dateStr: string, location: string) {
  const date = new Date(dateStr)
  const day = date.getDate()
  const month = date.getMonth()

  // Determinar si es un día lluvioso basado en el día del mes
  // Esto es solo para simulación, en una implementación real se usaría una API de clima
  const isRainy = day % 7 === 0 || day % 7 === 4 // Aproximadamente 2 días de lluvia por semana

  // Temperatura basada en el mes (simulando estaciones en Argentina)
  let tempMin, tempMax
  if (month >= 11 || month <= 2) {
    // Verano (Dic-Feb)
    tempMin = 20 + Math.random() * 5
    tempMax = 28 + Math.random() * 7
  } else if (month >= 3 && month <= 5) {
    // Otoño (Mar-May)
    tempMin = 12 + Math.random() * 5
    tempMax = 20 + Math.random() * 5
  } else if (month >= 6 && month <= 8) {
    // Invierno (Jun-Ago)
    tempMin = 5 + Math.random() * 5
    tempMax = 15 + Math.random() * 5
  } else {
    // Primavera (Sep-Nov)
    tempMin = 15 + Math.random() * 5
    tempMax = 25 + Math.random() * 5
  }

  return {
    date: dateStr,
    location,
    weather: isRainy ? "rainy" : "clear",
    temperature: {
      min: Math.round(tempMin * 10) / 10,
      max: Math.round(tempMax * 10) / 10,
      current: Math.round((tempMin + (tempMax - tempMin) * 0.7) * 10) / 10,
    },
    humidity: Math.round(isRainy ? 70 + Math.random() * 20 : 50 + Math.random() * 20),
    precipitation: isRainy ? Math.round(5 + Math.random() * 20) : 0,
    wind: Math.round(5 + Math.random() * 15),
    salesImpact: isRainy ? -0.25 : 0, // Impacto en ventas: -25% en días de lluvia
  }
}



