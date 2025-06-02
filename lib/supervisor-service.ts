import { supabase } from "./supabase-client"

// Tipo para los datos de supervisor con PIN
export interface SupervisorWithPin {
  id: string
  name: string
  email: string
  role: string
  pin: string
}

// Servicio para gestionar los PINs de supervisores en Supabase
export const supervisorService = {
  // Obtener todos los supervisores con sus PINs
  async getAllSupervisors(): Promise<SupervisorWithPin[]> {
    try {
      const { data, error } = await supabase.from("supervisor_pins").select("*").order("user_name", { ascending: true })

      if (error) {
        console.error("Error al obtener supervisores:", error)
        throw error
      }

      // Transformar los datos al formato esperado
      return data.map((item) => ({
        id: item.user_id,
        name: item.user_name,
        email: item.user_email || "",
        role: item.user_role,
        pin: item.pin,
      }))
    } catch (error) {
      console.error("Error en getAllSupervisors:", error)
      // En caso de error, devolver una lista vacía
      return []
    }
  },

  // Obtener un supervisor específico por ID
  async getSupervisorById(userId: string): Promise<SupervisorWithPin | null> {
    try {
      const { data, error } = await supabase.from("supervisor_pins").select("*").eq("user_id", userId).single()

      if (error) {
        if (error.code === "PGRST116") {
          // No se encontró el supervisor
          return null
        }
        console.error("Error al obtener supervisor:", error)
        throw error
      }

      return {
        id: data.user_id,
        name: data.user_name,
        email: data.user_email || "",
        role: data.user_role,
        pin: data.pin,
      }
    } catch (error) {
      console.error("Error en getSupervisorById:", error)
      return null
    }
  },

  // Actualizar o crear un PIN de supervisor
  async updateSupervisorPin(supervisor: SupervisorWithPin): Promise<boolean> {
    try {
      const now = new Date().toISOString()

      const { error } = await supabase.from("supervisor_pins").upsert(
        {
          user_id: supervisor.id,
          user_name: supervisor.name,
          user_email: supervisor.email,
          user_role: supervisor.role,
          pin: supervisor.pin,
          updated_at: now,
        },
        {
          onConflict: "user_id",
        },
      )

      if (error) {
        console.error("Error al actualizar PIN de supervisor:", error)
        throw error
      }

      return true
    } catch (error) {
      console.error("Error en updateSupervisorPin:", error)
      return false
    }
  },

  // Validar si un PIN existe en la base de datos
  async validatePin(pin: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.from("supervisor_pins").select("id").eq("pin", pin).limit(1)

      if (error) {
        console.error("Error al validar PIN:", error)
        throw error
      }

      return data.length > 0
    } catch (error) {
      console.error("Error en validatePin:", error)
      return false
    }
  },
}

