import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log("=== VALIDATING SESSION ===")

    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Verificar sesión actual
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    console.log("Session validation result:")
    console.log("- User:", user ? { id: user.id, email: user.email } : null)
    console.log("- Error:", userError)

    if (userError || !user) {
      console.log("❌ No valid session found")
      return NextResponse.json({ 
        success: false, 
        error: "No valid session" 
      }, { status: 401 })
    }

    // Intentar refrescar la sesión
    const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()

    if (refreshError) {
      console.log("❌ Session refresh failed:", refreshError)
      return NextResponse.json({ 
        success: false, 
        error: "Session refresh failed" 
      }, { status: 401 })
    }

    console.log("✅ Session validated and refreshed successfully")
    return NextResponse.json({ 
      success: true, 
      message: "Session refreshed successfully" 
    })

  } catch (error: any) {
    console.error("❌ Error validating session:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}