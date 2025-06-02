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

