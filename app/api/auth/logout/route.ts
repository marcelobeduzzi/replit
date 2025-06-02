import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // In production, invalidate the session token
    // For now, we just return success
    return NextResponse.json({ message: "Sesión cerrada exitosamente" })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

