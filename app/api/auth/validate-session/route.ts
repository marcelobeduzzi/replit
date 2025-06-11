import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: "No hay sesión activa" }, { status: 401 })
    }

    // Get user data from our users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single()

    if (userError) {
      return NextResponse.json({ error: "Error al obtener datos del usuario" }, { status: 500 })
    }

    // Return user data without sensitive information
    return NextResponse.json({
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
      },
    })
  } catch (error) {
    console.error("Session validation error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    console.log("=== VALIDATE SESSION ENDPOINT ===")
    
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Intentar refrescar la sesión
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.error("Error al refrescar sesión:", error)
      return NextResponse.json({ error: "No se pudo refrescar la sesión" }, { status: 401 })
    }

    if (data.session) {
      console.log("Sesión refrescada exitosamente para:", data.session.user.email)
      return NextResponse.json({ 
        success: true, 
        user: data.session.user,
        message: "Sesión refrescada" 
      })
    }

    return NextResponse.json({ error: "No hay sesión para refrescar" }, { status: 401 })
  } catch (error: any) {
    console.error("Error en validate-session:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Función auxiliar para nombres de meses
function getMonthName(month: number) {
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]
  return months[month - 1] || "Mes desconocido"
}
