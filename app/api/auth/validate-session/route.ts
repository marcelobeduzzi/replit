
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log("=== VALIDATING SESSION ===")

    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Verificar usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    console.log("Session validation result:")
    console.log("- User:", user ? { id: user.id, email: user.email } : null)
    console.log("- Error:", userError)

    if (userError || !user) {
      console.log("❌ No valid session found")
      return NextResponse.json({ 
        valid: false, 
        error: "No valid session" 
      }, { status: 401 })
    }

    // Construir datos de usuario
    const userData = {
      id: user.id,
      email: user.email || '',
      name: user.email?.split('@')[0] || 'Usuario',
      role: 'admin',
      isActive: true,
      createdAt: user.created_at,
      updatedAt: user.updated_at || user.created_at
    }

    console.log("✅ Session validated successfully")
    return NextResponse.json({ 
      valid: true,
      user: userData
    })

  } catch (error: any) {
    console.error("❌ Error validating session:", error)
    return NextResponse.json({ 
      valid: false, 
      error: error.message 
    }, { status: 500 })
  }
}
