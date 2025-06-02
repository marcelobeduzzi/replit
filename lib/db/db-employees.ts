// Log distintivo para verificar que se está cargando el módulo de empleados
console.log('👥 CARGANDO: Módulo de empleados (lib/db/db-employees.ts)');

import { DatabaseServiceBase } from "./db-core"
import { objectToCamelCase, objectToSnakeCase } from "../utils"
import type { Employee } from "@/types"

export class EmployeeService extends DatabaseServiceBase {
  // Lista de columnas conocidas en la tabla employees
  private employeeColumns = [
    "id",
    "first_name",
    "last_name",
    "email",
    "phone",
    "birth_date",
    "hire_date",
    "termination_date",
    "position",
    "department",
    "salary",
    "status",
    "address",
    "custom_schedule",
    "custom_days",
    "created_at",
    "updated_at",
    "base_salary",
    "bank_salary",
    "total_salary",
    "attendance_bonus",
    "has_attendance_bonus",
  ]

  // Método para actualizar la lista de columnas conocidas
  async updateEmployeeColumns() {
    try {
      // En lugar de usar RPC, simplemente consultamos una fila de la tabla
      // y extraemos los nombres de las columnas
      const { data, error } = await this.supabase.from("employees").select("*").limit(1)

      if (error) {
        console.error("Error al obtener columnas:", error)
        return
      }

      if (data && data.length > 0) {
        // Extraer los nombres de las columnas del primer registro
        this.employeeColumns = Object.keys(data[0])
        console.log("Columnas actualizadas:", this.employeeColumns)
      }
    } catch (error) {
      console.error("Error al actualizar columnas:", error)
    }
  }

  // Update the getEmployees method to use the retry mechanism
  async getEmployees() {
    return this.withRetry(async () => {
      const { data, error } = await this.supabase.from("employees").select("*").order("first_name")

      if (error) {
        console.error("Error fetching employees:", error)
        throw error
      }

      // Convertir automáticamente de snake_case a camelCase
      return (data || []).map((emp) => objectToCamelCase(emp))
    })
  }

  async getEmployeeById(id: string) {
    const { data, error } = await this.supabase.from("employees").select("*").eq("id", id).single()

    if (error) throw error

    // Convertir automáticamente de snake_case a camelCase
    return objectToCamelCase(data)
  }

  async createEmployee(employee: Omit<Employee, "id" | "createdAt" | "updatedAt">) {
    try {
      // Add timestamps
      const now = new Date().toISOString()

      // Convertir automáticamente de camelCase a snake_case
      const employeeData = objectToSnakeCase({
        ...employee,
        created_at: now,
        updated_at: now,
        // Asegurarse de que las fechas estén en formato ISO
        birth_date: new Date(employee.birthDate).toISOString(),
        hire_date: new Date(employee.hireDate).toISOString(),
      })

      console.log("Attempting to create employee with data:", employeeData)

      // Asegurarse de que los campos numéricos tengan valores numéricos válidos
      if (typeof employeeData.base_salary !== "number")
        employeeData.base_salary = Number.parseFloat(employeeData.base_salary) || 0
      if (typeof employeeData.bank_salary !== "number")
        employeeData.bank_salary = Number.parseFloat(employeeData.bank_salary) || 0
      if (typeof employeeData.total_salary !== "number")
        employeeData.total_salary = Number.parseFloat(employeeData.total_salary) || 0

      // Mantener los campos de bono de asistencia
      if (typeof employeeData.attendance_bonus !== "number")
        employeeData.attendance_bonus = Number.parseFloat(employeeData.attendance_bonus) || 0
      if (typeof employeeData.has_attendance_bonus !== "boolean")
        employeeData.has_attendance_bonus = Boolean(employeeData.has_attendance_bonus)

      console.log("Datos finales para crear empleado después de validación:", employeeData)

      const { data, error } = await this.supabase.from("employees").insert([employeeData]).select().single()

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw new Error(`Error creating employee: ${error.message}`)
      }

      // Convertir automáticamente de snake_case a camelCase
      return objectToCamelCase(data)
    } catch (error) {
      console.error("Error creating employee:", error)
      throw error
    }
  }

  // MÉTODO CORREGIDO: Ahora recibe el ID como parámetro separado y no filtra campos
  async updateEmployee(id: string, employee: Employee) {
    try {
      // Crear una copia del empleado para no modificar el original
      const employeeToUpdate = { ...employee }

      // Eliminar el id del objeto de datos para evitar conflictos
      if (employeeToUpdate.id) {
        delete employeeToUpdate.id
      }

      // Registrar los datos recibidos para depuración
      console.log("Datos originales del empleado a actualizar:", JSON.stringify(employeeToUpdate, null, 2))

      // Manejar específicamente el campo customSchedule
      if (employeeToUpdate.customSchedule !== undefined) {
        console.log("Tipo de customSchedule:", typeof employeeToUpdate.customSchedule)

        if (typeof employeeToUpdate.customSchedule === "object" && employeeToUpdate.customSchedule !== null) {
          // Si ya es un objeto, convertirlo a JSON string para almacenarlo
          try {
            console.log("customSchedule es un objeto, convirtiéndolo a string")
            employeeToUpdate.customSchedule = JSON.stringify(employeeToUpdate.customSchedule)
          } catch (e) {
            console.error("Error al convertir customSchedule a string:", e)
            employeeToUpdate.customSchedule = null
          }
        } else if (typeof employeeToUpdate.customSchedule === "string") {
          // Verificar que sea un JSON válido
          try {
            console.log("customSchedule es un string, verificando si es JSON válido")
            const parsed = JSON.parse(employeeToUpdate.customSchedule)
            // Volver a convertir a string para asegurar formato correcto
            employeeToUpdate.customSchedule = JSON.stringify(parsed)
          } catch (e) {
            console.error("Error al parsear customSchedule como JSON:", e)
            // Si no es un JSON válido, podría ser un string normal, lo dejamos como está
          }
        }
      }

      // Manejar el campo customDays si existe
      if (employeeToUpdate.customDays !== undefined) {
        console.log("Tipo de customDays:", typeof employeeToUpdate.customDays)

        if (typeof employeeToUpdate.customDays === "object" && employeeToUpdate.customDays !== null) {
          // Si ya es un objeto, convertirlo a JSON string para almacenarlo
          try {
            console.log("customDays es un objeto, convirtiéndolo a string")
            employeeToUpdate.customDays = JSON.stringify(employeeToUpdate.customDays)
          } catch (e) {
            console.error("Error al convertir customDays a string:", e)
            employeeToUpdate.customDays = null
          }
        } else if (typeof employeeToUpdate.customDays === "string") {
          // Verificar que sea un JSON válido
          try {
            console.log("customDays es un string, verificando si es JSON válido")
            const parsed = JSON.parse(employeeToUpdate.customDays)
            // Volver a convertir a string para asegurar formato correcto
            employeeToUpdate.customDays = JSON.stringify(parsed)
          } catch (e) {
            console.error("Error al parsear customDays como JSON:", e)
            // Si no es un JSON válido, podría ser un string normal, lo dejamos como está
          }
        }
      }

      // Convertir automáticamente de camelCase a snake_case
      const snakeCaseData = objectToSnakeCase({
        ...employeeToUpdate,
        updated_at: new Date().toISOString(),
      })

      // Asegurarse de que los campos numéricos tengan valores numéricos válidos
      if (typeof snakeCaseData.base_salary !== "number" && snakeCaseData.base_salary !== undefined)
        snakeCaseData.base_salary = Number.parseFloat(snakeCaseData.base_salary) || 0
      if (typeof snakeCaseData.bank_salary !== "number" && snakeCaseData.bank_salary !== undefined)
        snakeCaseData.bank_salary = Number.parseFloat(snakeCaseData.bank_salary) || 0
      if (typeof snakeCaseData.total_salary !== "number" && snakeCaseData.total_salary !== undefined)
        snakeCaseData.total_salary = Number.parseFloat(snakeCaseData.total_salary) || 0

      // Asegurarse de que el campo status se mantenga correctamente
      if (snakeCaseData.status) {
        console.log(`Estado del empleado a actualizar: ${snakeCaseData.status}`)
      }

      // IMPORTANTE: Ya no filtramos los campos, enviamos todos los datos recibidos
      console.log("Datos finales enviados a Supabase:", JSON.stringify(snakeCaseData, null, 2))

      // Intentar la actualización con todos los datos
      const { data, error } = await this.supabase.from("employees").update(snakeCaseData).eq("id", id).select().single()

      if (error) {
        console.error("Error detallado de Supabase:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw error
      }

      // Convertir automáticamente de snake_case a camelCase
      return objectToCamelCase(data)
    } catch (error) {
      console.error("Error updating employee:", error)
      throw error
    }
  }

  /**
   * Elimina un empleado por su ID y todos sus registros relacionados
   * @param id ID del empleado a eliminar
   * @returns true si se eliminó correctamente, false en caso contrario
   */
  async deleteEmployee(id: string): Promise<boolean> {
    try {
      console.log(`Iniciando eliminación del empleado con ID: ${id}`)

      // 1. Eliminar registros de asistencia relacionados con el empleado
      console.log("Eliminando registros de asistencia...")
      const { error: attendanceError } = await this.supabase.from("attendance").delete().eq("employee_id", id)

      if (attendanceError) {
        console.error("Error al eliminar asistencias del empleado:", attendanceError)
        // Continuamos con el proceso aunque haya error, para intentar eliminar lo más posible
      }

      // 2. Eliminar registros de nómina relacionados con el empleado
      // Primero obtenemos los IDs de las nóminas para eliminar los detalles
      console.log("Buscando nóminas del empleado...")
      const { data: payrolls, error: payrollsError } = await this.supabase
        .from("payroll")
        .select("id")
        .eq("employee_id", id)

      if (payrollsError) {
        console.error("Error al obtener nóminas del empleado:", payrollsError)
      } else if (payrolls && payrolls.length > 0) {
        // Eliminar detalles de nómina para cada nómina del empleado
        console.log(`Encontradas ${payrolls.length} nóminas. Eliminando detalles...`)
        const payrollIds = payrolls.map((p) => p.id)

        for (const payrollId of payrollIds) {
          const { error: detailsError } = await this.supabase
            .from("payroll_details")
            .delete()
            .eq("payroll_id", payrollId)

          if (detailsError) {
            console.error(`Error al eliminar detalles de nómina ${payrollId}:`, detailsError)
          }
        }

        // Ahora eliminamos las nóminas
        console.log("Eliminando nóminas...")
        const { error: payrollError } = await this.supabase.from("payroll").delete().eq("employee_id", id)

        if (payrollError) {
          console.error("Error al eliminar nóminas del empleado:", payrollError)
        }
      }

      // 3. Eliminar liquidaciones relacionadas con el empleado (si existen)
      console.log("Eliminando liquidaciones si existen...")
      try {
        const { error: liquidationError } = await this.supabase.from("liquidations").delete().eq("employee_id", id)

        if (liquidationError) {
          console.error("Error al eliminar liquidaciones del empleado:", liquidationError)
        }
      } catch (error) {
        // Si la tabla no existe, ignoramos el error
        console.log("No se encontró tabla de liquidaciones o no hay registros")
      }

      // 4. Finalmente, eliminar el empleado
      console.log("Eliminando el registro del empleado...")
      const { error } = await this.supabase.from("employees").delete().eq("id", id)

      if (error) {
        console.error("Error al eliminar empleado:", error)
        throw error
      }

      console.log(`Empleado ${id} y todos sus registros relacionados eliminados correctamente`)
      return true
    } catch (error) {
      console.error("Error en deleteEmployee:", error)
      throw error
    }
  }
}

// Crear una instancia del servicio
export const employeeService = new EmployeeService()