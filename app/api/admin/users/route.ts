import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    // Verificar si el usuario está autenticado
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Error de sesión:", sessionError)
      return NextResponse.json({ error: "Error de sesión: " + sessionError.message }, { status: 500 })
    }

    if (!session) {
      console.error("No hay sesión activa")
      return NextResponse.json({ error: "No autorizado: No hay sesión activa" }, { status: 401 })
    }

    console.log("Usuario autenticado:", session.user.id)

    // Verificar si el usuario es admin
    const userRole = session.user.user_metadata?.role

    console.log("Rol del usuario:", userRole)

    if (userRole !== "admin") {
      return NextResponse.json({ error: "Acceso denegado: Se requieren privilegios de administrador" }, { status: 403 })
    }

    // Obtener usuarios directamente de la tabla auth.users
    // Esto no funcionará directamente, necesitamos usar un enfoque diferente
    // Vamos a usar el método auth.admin.listUsers() que es más seguro
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error("Error al obtener usuarios:", authError)
      
      // Si falla el método admin, intentamos con una consulta a la tabla de usuarios
      // Esto es un fallback y puede no funcionar dependiendo de los permisos
      const { data: users, error: usersError } = await supabase.from("auth.users").select("*")
      
      if (usersError) {
        console.error("Error al obtener usuarios (fallback):", usersError)
        
        // Como último recurso, devolvemos algunos usuarios de ejemplo
        // para que la interfaz no se rompa
        return NextResponse.json({ 
          users: [
            {
              id: session.user.id,
              email: session.user.email,
              role: "admin",
              created_at: new Date().toISOString(),
              name: session.user.user_metadata?.name || session.user.email?.split("@")[0],
              phone: session.user.user_metadata?.phone || "",
              position: session.user.user_metadata?.position || "",
              branch: session.user.user_metadata?.branch || "",
              hasPin: !!session.user.user_metadata?.pin,
              pin: session.user.user_metadata?.pin || null,
            }
          ],
          warning: "Solo se muestra el usuario actual debido a restricciones de permisos"
        })
      }
      
      // Procesar los usuarios para el formato que necesitamos
      const formattedUsers = users.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.raw_user_meta_data?.role || "encargado",
        created_at: user.created_at,
        name: user.raw_user_meta_data?.name || user.email?.split("@")[0],
        phone: user.raw_user_meta_data?.phone || "",
        position: user.raw_user_meta_data?.position || "",
        branch: user.raw_user_meta_data?.branch || "",
        hasPin: !!user.raw_user_meta_data?.pin,
        pin: user.raw_user_meta_data?.pin || null,
      }))
      
      return NextResponse.json({ users: formattedUsers })
    }

    // Procesar los usuarios para el formato que necesitamos
    const users = authUsers.users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || "encargado",
      created_at: user.created_at,
      name: user.user_metadata?.name || user.email?.split("@")[0],
      phone: user.user_metadata?.phone || "",
      position: user.user_metadata?.position || "",
      branch: user.user_metadata?.branch || "",
      hasPin: !!user.user_metadata?.pin,
      pin: user.user_metadata?.pin || null,
    }))

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error en API de usuarios:", error)
    return NextResponse.json({ error: "Error interno del servidor: " + error.message }, { status: 500 })
  }
}

// También implementamos el endpoint para actualizar usuarios
export async function PUT(request: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    // Verificar si el usuario está autenticado
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Error de sesión:", sessionError)
      return NextResponse.json({ error: "Error de sesión: " + sessionError.message }, { status: 500 })
    }

    if (!session) {
      console.error("No hay sesión activa")
      return NextResponse.json({ error: "No autorizado: No hay sesión activa" }, { status: 401 })
    }

    // Verificar si el usuario es admin
    const userRole = session.user.user_metadata?.role

    if (userRole !== "admin") {
      return NextResponse.json({ error: "Acceso denegado: Se requieren privilegios de administrador" }, { status: 403 })
    }

    // Obtener datos del cuerpo de la solicitud
    const { userId, userData } = await request.json()

    if (!userId || !userData) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    // Actualizar el usuario en Supabase Auth
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...userData,
      },
    })

    if (error) {
      console.error("Error al actualizar usuario:", error)
      return NextResponse.json({ error: "Error al actualizar usuario: " + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error en API de actualización de usuarios:", error)
    return NextResponse.json({ error: "Error interno del servidor: " + error.message }, { status: 500 })
  }
}

