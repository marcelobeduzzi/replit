import { supabase } from "./supabase/client"

export type SupervisorWithPin = {
  id: string
  name: string
  email: string
  role: string
  pin: string
}

export const supervisorService = {
  async getAllSupervisors() {
    const { data, error } = await supabase
      .from("supervisors")
      .select("*")
      .order("name")

    if (error) {
      console.error("Error fetching supervisors:", error)
      throw error
    }

    return data as SupervisorWithPin[]
  },

  async validatePin(pin: string) {
    const { data, error } = await supabase
      .from("supervisors")
      .select("*")
      .eq("pin", pin)
      .single()

    if (error) {
      console.error("Error validating pin:", error)
      return false
    }

    return !!data
  },

  async updateSupervisorPin(supervisor: SupervisorWithPin) {
    const { data, error } = await supabase
      .from("supervisors")
      .upsert(supervisor)
      .select()
      .single()

    if (error) {
      console.error("Error updating supervisor pin:", error)
      return false
    }

    return !!data
  }
}

