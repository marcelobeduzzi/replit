import type { Employee } from "@/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Función para obtener todos los empleados (cliente)
export async function getEmpleados() {
  try {
    const supabase = createClientComponentClient()
    
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("firstName", { ascending: true })
    
    if (error) throw error
    
    return data || []
  } catch (error) {
    console.error("Error al obtener empleados:", error)
    return []
  }
}

// Función para obtener un empleado por ID (cliente)
export async function getEmpleadoById(id: string): Promise<Employee | null> {
  try {
    const supabase = createClientComponentClient()
    
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .single()
    
    if (error) throw error
    
    return data
  } catch (error) {
    console.error("Error al obtener empleado por ID:", error)
    return null
  }
}

// Función para crear un nuevo empleado
export async function crearEmpleado(data: Omit<Employee, "id" | "createdAt" | "updatedAt">) {
  try {
    const supabase = createClientComponentClient()
    
    const now = new Date().toISOString()
    const empleadoData = {
      ...data,
      createdAt: now,
      updatedAt: now,
    }
    
    const { data: empleado, error } = await supabase
      .from("employees")
      .insert(empleadoData)
      .select()
      .single()
    
    if (error) throw error
    
    return empleado
  } catch (error) {
    console.error("Error al crear empleado:", error)
    throw new Error("No se pudo crear el empleado")
  }
}

// Función para actualizar un empleado
export async function actualizarEmpleado(id: string, data: Partial<Employee>) {
  try {
    const supabase = createClientComponentClient()
    
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    }
    
    const { error } = await supabase
      .from("employees")
      .update(updateData)
      .eq("id", id)
    
    if (error) throw error
    
    return true
  } catch (error) {
    console.error("Error al actualizar empleado:", error)
    throw new Error("No se pudo actualizar el empleado")
  }
}

// Función para eliminar un empleado
export async function eliminarEmpleado(id: string) {
  try {
    const supabase = createClientComponentClient()
    
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", id)
    
    if (error) throw error
    
    return true
  } catch (error) {
    console.error("Error al eliminar empleado:", error)
    throw new Error("No se pudo eliminar el empleado")
  }
}