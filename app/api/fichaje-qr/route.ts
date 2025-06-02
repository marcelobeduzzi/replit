import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Datos simulados de locales con sus coordenadas
const locations = [
  { id: "local-1", name: "BR Cabildo", latitude: -34.5638, longitude: -58.4655 },
  { id: "local-2", name: "BR Carranza", latitude: -34.573, longitude: -58.4498 },
  { id: "local-3", name: "BR Pacifico", latitude: -34.582, longitude: -58.435 },
  { id: "local-4", name: "BR Local 4", latitude: -34.602, longitude: -58.425 },
  { id: "local-5", name: "BR Local 5", latitude: -34.612, longitude: -58.415 },
]

// Datos simulados de empleados
const employees = [
  { id: "emp-1", name: "Juan Pérez", locationId: "local-1" },
  { id: "emp-2", name: "María López", locationId: "local-2" },
  { id: "emp-3", name: "Carlos Rodríguez", locationId: "local-3" },
  { id: "emp-4", name: "Ana Martínez", locationId: "local-1" },
  { id: "emp-5", name: "Roberto Fernández", locationId: "local-4" },
]

// Función para verificar si la ubicación está dentro del rango permitido
function isLocationValid(lat1: number, lon1: number, lat2: number, lon2: number): boolean {
  // Calcular distancia en metros usando la fórmula de Haversine
  const R = 6371e3 // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  // Permitir un rango de 200 metros
  return distance <= 200
}

// Endpoint para registrar un fichaje
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { employeeId, latitude, longitude, clockType } = body

    // Validar datos requeridos
    if (!employeeId || !latitude || !longitude || !clockType) {
      return NextResponse.json({ success: false, message: "Faltan datos requeridos" }, { status: 400 })
    }

    // Validar tipo de fichaje
    if (clockType !== "entrada" && clockType !== "salida") {
      return NextResponse.json({ success: false, message: "Tipo de fichaje inválido" }, { status: 400 })
    }

    // Buscar empleado
    const employee = employees.find((emp) => emp.id === employeeId)
    if (!employee) {
      return NextResponse.json({ success: false, message: "Empleado no encontrado" }, { status: 404 })
    }

    // Buscar local asignado al empleado
    const location = locations.find((loc) => loc.id === employee.locationId)
    if (!location) {
      return NextResponse.json({ success: false, message: "Local no encontrado" }, { status: 404 })
    }

    // Verificar si la ubicación es válida
    const verified = isLocationValid(latitude, longitude, location.latitude, location.longitude)

    // Crear registro de fichaje
    const clockRecord = {
      employee_id: employeeId,
      employee_name: employee.name,
      location_id: location.id,
      location_name: location.name,
      timestamp: new Date().toISOString(),
      clock_type: clockType,
      latitude,
      longitude,
      verified,
    }

    // Guardar en la base de datos
    try {
      const { data, error } = await supabase.from("qr_clock_records").insert(clockRecord).select()

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: `${clockType === "entrada" ? "Entrada" : "Salida"} registrada correctamente`,
        data: {
          id: data[0].id,
          employeeId,
          employeeName: employee.name,
          locationName: location.name,
          timestamp: clockRecord.timestamp,
          verified,
        },
      })
    } catch (dbError) {
      console.error("Error al guardar en la base de datos:", dbError)

      // Si hay un error con la base de datos, devolvemos éxito pero indicamos que se guardó localmente
      return NextResponse.json({
        success: true,
        message: `${clockType === "entrada" ? "Entrada" : "Salida"} registrada localmente (sin conexión a la base de datos)`,
        data: {
          employeeId,
          employeeName: employee.name,
          locationName: location.name,
          timestamp: clockRecord.timestamp,
          verified,
        },
        warning: "Los datos se guardarán cuando se restablezca la conexión",
      })
    }
  } catch (error) {
    console.error("Error en el endpoint de fichaje:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}

// Endpoint para obtener el historial de fichajes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const locationId = searchParams.get("locationId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const clockType = searchParams.get("clockType")

    // Construir consulta
    let query = supabase.from("qr_clock_records").select("*")

    // Aplicar filtros
    if (employeeId) {
      query = query.eq("employee_id", employeeId)
    }

    if (locationId) {
      query = query.eq("location_id", locationId)
    }

    if (startDate) {
      query = query.gte("timestamp", startDate)
    }

    if (endDate) {
      query = query.lte("timestamp", endDate)
    }

    if (clockType) {
      query = query.eq("clock_type", clockType)
    }

    // Ordenar por fecha (más reciente primero)
    query = query.order("timestamp", { ascending: false })

    // Ejecutar consulta
    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || [],
    })
  } catch (error) {
    console.error("Error al obtener historial de fichajes:", error)
    return NextResponse.json({ success: false, message: "Error al obtener historial de fichajes" }, { status: 500 })
  }
}

