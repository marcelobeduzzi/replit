import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { objectToCamelCase, objectToSnakeCase } from "./utils" // Import utility functions
import type { Employee, Attendance, Payroll, PayrollDetail } from "@/types"
import type { Liquidation } from "@/types"
import { supabase as supabaseClient } from "./supabase/client" // Importar el cliente de Supabase

// Exportar supabase directamente para mantener compatibilidad con el código existente
export { supabaseClient as supabase }

interface AttendanceType {
  [key: string]: any // Define the Attendance interface
}

// Clase principal que contiene toda la funcionalidad original
class DatabaseService {
  private supabase = createClientComponentClient()
  // Actualizar la lista de columnas conocidas en la tabla employees para eliminar las referencias a las columnas de bono
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
    "attendance_bonus", // Mantener el bono de asistencia
    "has_attendance_bonus", // Mantener el indicador de bono de asistencia
    // Agregar aquí todas las columnas que existen en la tabla
  ]

  // Método para obtener el cliente de Supabase (AÑADIDO)
  getSupabase() {
    return this.supabase
  }

  // User methods
  async getUserByEmail(email: string) {
    const { data, error } = await this.supabase.from("users").select("*").eq("email", email).single()

    if (error) throw error
    return objectToCamelCase(data)
  }

  async getUserById(id: string) {
    const { data, error } = await this.supabase.from("users").select("*").eq("id", id).single()

    if (error) throw error
    return objectToCamelCase(data)
  }

  // Add a retry mechanism for database operations
  async withRetry<T>(operation: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
    let lastError: any

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        console.warn(`Operation failed (attempt ${attempt}/${maxRetries}):`, error)

        if (attempt < maxRetries) {
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, delay * attempt))
        }
      }
    }

    throw lastError
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

  // Attendance methods
  // NUEVO: Obtener todas las asistencias con información del empleado
  async getAttendances({ date, employeeId }: { date: string; employeeId?: string }) {
    try {
      console.log("Consultando asistencias para fecha exacta:", date)

      // Construir la consulta base
      let query = this.supabase.from("attendance").select(`
 *,
 employees (id, first_name, last_name)
`)

      // Filtrar por fecha exacta (sin manipulación)
      if (date) {
        query = query.eq("date", date)
      }

      // Filtrar por empleado si se proporciona
      if (employeeId && employeeId !== "all") {
        query = query.eq("employee_id", employeeId)
      }

      // Ordenar por fecha descendente
      query = query.order("date", { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error("Error en consulta de asistencias:", error)
        throw error
      }

      console.log("Datos recibidos de asistencias:", data)

      // Asegurarse de que las fechas se mantengan como strings
      const attendances = (data || []).map((item) => {
        const attendance = objectToCamelCase(item)
        // Asegurarse de que la fecha se mantenga como string
        if (typeof attendance.date === "string") {
          attendance.date = attendance.date.split("T")[0] // Eliminar la parte de tiempo si existe
        }
        return attendance
      })

      return attendances
    } catch (error) {
      console.error("Error al obtener asistencias:", error)
      throw error
    }
  }

  /**
   * Obtiene las asistencias más recientes
   * @param limit Número máximo de asistencias a obtener
   * @returns Lista de asistencias ordenadas por fecha descendente
   */
  async getRecentAttendances(limit = 100): Promise<Attendance[]> {
    try {
      // Aquí iría la lógica para obtener las asistencias de la base de datos
      // Ordenadas por fecha descendente y limitadas a la cantidad especificada
      const { data, error } = await this.supabase
        .from("attendance")
        .select(`
     *,
     employees (id, first_name, last_name)
   `)
        .order("date", { ascending: false })
        .limit(limit)

      if (error) {
        console.error("Error en getRecentAttendances:", error)
        throw error
      }

      // Convertir de snake_case a camelCase
      const attendances = (data || []).map((item) => {
        const attendance = objectToCamelCase(item)
        // Asegurarse de que la fecha se mantenga como string
        if (typeof attendance.date === "string") {
          attendance.date = attendance.date.split("T")[0] // Eliminar la parte de tiempo si existe
        }
        return attendance
      })

      return attendances
    } catch (error) {
      console.error("Error en getRecentAttendances:", error)
      return []
    }
  }

  // ACTUALIZADO: Método mejorado para obtener asistencias por rango de fechas
  async getAttendancesByDateRange(employeeId: string, startDate: string, endDate: string) {
    try {
      console.log(`Consultando asistencias para empleado ${employeeId} desde ${startDate} hasta ${endDate}`)

      // Construir la consulta
      const query = this.supabase
        .from("attendance")
        .select(`
   *,
   employees (id, first_name, last_name)
 `)
        .eq("employee_id", employeeId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true })

      const { data, error } = await query

      if (error) {
        console.error("Error en consulta de asistencias por rango:", error)
        throw error
      }

      console.log(`Se encontraron ${data?.length || 0} registros de asistencia`)

      // Convertir de snake_case a camelCase
      const attendances = (data || []).map((item) => {
        const attendance = objectToCamelCase(item)
        // Asegurarse de que la fecha se mantenga como string
        if (typeof attendance.date === "string") {
          attendance.date = attendance.date.split("T")[0] // Eliminar la parte de tiempo si existe
        }
        return attendance
      })

      return attendances
    } catch (error) {
      console.error("Error al obtener asistencias por rango de fechas:", error)
      throw error
    }
  }

  // NUEVO: Obtener una asistencia específica por ID
  async getAttendanceById(id: string) {
    try {
      const { data, error } = await this.supabase
        .from("attendance")
        .select(`
 *,
 employees (id, first_name, last_name)
`)
        .eq("id", id)
        .single()

      if (error) throw error
      return objectToCamelCase(data)
    } catch (error) {
      console.error("Error al obtener asistencia por ID:", error)
      throw error
    }
  }

  async getAttendanceByEmployeeId(employeeId: string) {
    const { data, error } = await this.supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", employeeId)
      .order("date", { ascending: false })

    if (error) throw error
    return data.map((item) => objectToCamelCase(item))
  }

  async createAttendance(attendance: Omit<Attendance, "id">) {
    try {
      // Calcular minutos tarde y salida anticipada
      let lateMinutes = attendance.lateMinutes || 0
      let earlyDepartureMinutes = attendance.earlyDepartureMinutes || 0
      let totalMinutesWorked = 0
      let totalMinutesBalance = 0
      let extraMinutes = 0

      // Si es ausente, establecer valores predeterminados
      if (attendance.isAbsent) {
        // Ausencia: solo descuento si no está justificada
        if (!attendance.isJustified) {
          // Ausencia injustificada: descuento de una jornada completa (480 minutos)
          totalMinutesBalance = -480
        } else {
          // Ausencia justificada: no hay descuento
          totalMinutesBalance = 0
        }

        totalMinutesWorked = 0
        lateMinutes = 0
        earlyDepartureMinutes = 0
        extraMinutes = 0

        // Asegurarse de que checkIn y checkOut sean null para ausencias
        attendance = {
          ...attendance,
          checkIn: null,
          checkOut: null,
        }
      } else {
        // Solo calcular estos valores si no es ausente
        if (attendance.expectedCheckIn && attendance.checkIn) {
          const expectedCheckIn = new Date(`2000-01-01T${attendance.expectedCheckIn}`)
          const actualCheckIn = new Date(`2000-01-01T${attendance.checkIn}`)

          if (actualCheckIn > expectedCheckIn) {
            lateMinutes = Math.floor((actualCheckIn.getTime() - expectedCheckIn.getTime()) / 60000)
          }
        }

        if (attendance.expectedCheckOut && attendance.checkOut) {
          const expectedCheckOut = new Date(`2000-01-01T${attendance.expectedCheckOut}`)
          const actualCheckOut = new Date(`2000-01-01T${attendance.checkOut}`)

          if (actualCheckOut < expectedCheckOut) {
            earlyDepartureMinutes = Math.floor((expectedCheckOut.getTime() - actualCheckOut.getTime()) / 60000)
          } else if (actualCheckOut > expectedCheckOut) {
            // Si salió más tarde, calcular minutos extra
            extraMinutes = Math.floor((actualCheckOut.getTime() - expectedCheckOut.getTime()) / 60000)
          }
        }

        // Calcular minutos trabajados
        if (attendance.checkIn && attendance.checkOut) {
          const checkIn = new Date(`2000-01-01T${attendance.checkIn}`)
          const checkOut = new Date(`2000-01-01T${attendance.checkOut}`)
          totalMinutesWorked = Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000)
        }

        // Calcular la jornada laboral esperada
        const expectedWorkday =
          attendance.expectedCheckIn && attendance.expectedCheckOut
            ? calculateExpectedWorkday(attendance.expectedCheckIn, attendance.expectedCheckOut)
            : 480 // 8 horas por defecto

        // Aplicar reglas para días feriados o normales
        if (attendance.isHoliday) {
          // Trabajo en día feriado: adición de una jornada completa (480 minutos) más los minutos trabajados
          totalMinutesBalance = expectedWorkday + totalMinutesWorked
        } else {
          // Día normal: balance es minutos trabajados menos minutos tarde y salida anticipada, más minutos extra
          totalMinutesBalance = totalMinutesWorked - lateMinutes - earlyDepartureMinutes + extraMinutes
        }
      }

      // Añadir los cálculos y timestamps a los datos
      const now = new Date().toISOString()
      const attendanceWithCalculations = {
        ...attendance,
        lateMinutes,
        earlyDepartureMinutes,
        totalMinutesWorked,
        totalMinutesBalance,
        extraMinutes, // Nuevo campo para minutos extra
        createdAt: now,
        updatedAt: now,
      }

      // Convertir automáticamente de camelCase a snake_case
      const attendanceData = objectToSnakeCase(attendanceWithCalculations)

      // Registrar los datos exactos que se están enviando
      console.log("Datos enviados a Supabase:", attendanceData)

      const { data, error } = await this.supabase.from("attendance").insert([attendanceData]).select().single()

      if (error) {
        console.error("Error detallado de Supabase:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw error
      }

      return objectToCamelCase(data)
    } catch (error) {
      console.error("Error al crear asistencia:", error)
      throw error
    }
  }

  // NUEVO: Actualizar una asistencia existente
  async updateAttendance(id: string, attendance: Partial<Attendance>) {
    try {
      // Obtener la asistencia actual para tener todos los datos necesarios
      const { data: currentAttendance, error: fetchError } = await this.supabase
        .from("attendance")
        .select("*")
        .eq("id", id)
        .single()

      if (fetchError) throw fetchError

      // Combinar los datos actuales con las actualizaciones
      let updatedAttendance = { ...objectToCamelCase(currentAttendance), ...attendance }

      // Si es ausente, establecer valores predeterminados
      if (updatedAttendance.isAbsent) {
        // Ausencia: solo descuento si no está justificada
        if (!updatedAttendance.isJustified) {
          // Ausencia injustificada: descuento de una jornada completa (480 minutos)
          updatedAttendance.totalMinutesBalance = -480
        } else {
          // Ausencia justificada: no hay descuento
          updatedAttendance.totalMinutesBalance = 0
        }

        updatedAttendance = {
          ...updatedAttendance,
          checkIn: null,
          checkOut: null,
          lateMinutes: 0,
          earlyDepartureMinutes: 0,
          extraMinutes: 0,
          totalMinutesWorked: 0,
        }
      } else {
        // Realizar los cálculos solo si no es ausente
        let lateMinutes = updatedAttendance.lateMinutes || 0
        let earlyDepartureMinutes = updatedAttendance.earlyDepartureMinutes || 0
        let totalMinutesWorked = 0
        let totalMinutesBalance = 0
        let extraMinutes = 0

        if (updatedAttendance.expectedCheckIn && updatedAttendance.checkIn) {
          const expectedCheckIn = new Date(`2000-01-01T${updatedAttendance.expectedCheckIn}`)
          const actualCheckIn = new Date(`2000-01-01T${updatedAttendance.checkIn}`)

          if (actualCheckIn > expectedCheckIn) {
            lateMinutes = Math.floor((actualCheckIn.getTime() - expectedCheckIn.getTime()) / 60000)
          } else {
            lateMinutes = 0
          }
        }

        if (updatedAttendance.expectedCheckOut && updatedAttendance.checkOut) {
          const expectedCheckOut = new Date(`2000-01-01T${updatedAttendance.expectedCheckOut}`)
          const actualCheckOut = new Date(`2000-01-01T${updatedAttendance.checkOut}`)

          if (actualCheckOut < expectedCheckOut) {
            earlyDepartureMinutes = Math.floor((expectedCheckOut.getTime() - actualCheckOut.getTime()) / 60000)
            extraMinutes = 0
          } else if (actualCheckOut > expectedCheckOut) {
            // Si salió más tarde, calcular minutos extra
            earlyDepartureMinutes = 0
            extraMinutes = Math.floor((actualCheckOut.getTime() - expectedCheckOut.getTime()) / 60000)
          } else {
            earlyDepartureMinutes = 0
            extraMinutes = 0
          }
        }

        // Calcular minutos trabajados
        if (updatedAttendance.checkIn && updatedAttendance.checkOut) {
          const checkIn = new Date(`2000-01-01T${updatedAttendance.checkIn}`)
          const checkOut = new Date(`2000-01-01T${updatedAttendance.checkOut}`)
          totalMinutesWorked = Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000)
        }

        // Calcular la jornada laboral esperada
        const expectedWorkday =
          updatedAttendance.expectedCheckIn && updatedAttendance.expectedCheckOut
            ? calculateExpectedWorkday(updatedAttendance.expectedCheckIn, updatedAttendance.expectedCheckOut)
            : 480 // 8 horas por defecto

        // Aplicar reglas para días feriados o normales
        if (updatedAttendance.isHoliday) {
          // Trabajo en día feriado: adición de una jornada completa más los minutos trabajados
          totalMinutesBalance = expectedWorkday + totalMinutesWorked
        } else {
          // Día normal: balance es minutos trabajados menos minutos tarde y salida anticipada, más minutos extra
          totalMinutesBalance = totalMinutesWorked - lateMinutes - earlyDepartureMinutes + extraMinutes
        }

        // Actualizar los cálculos
        updatedAttendance = {
          ...updatedAttendance,
          lateMinutes,
          earlyDepartureMinutes,
          extraMinutes,
          totalMinutesWorked,
          totalMinutesBalance,
        }
      }

      // Añadir timestamp de actualización
      updatedAttendance.updatedAt = new Date().toISOString()

      // IMPORTANTE: Eliminar cualquier propiedad 'employees' que pueda estar causando el problema
      const cleanedAttendance = { ...updatedAttendance }
      if ("employees" in cleanedAttendance) {
        delete cleanedAttendance.employees
      }

      // Convertir automáticamente de camelCase a snake_case
      const snakeCaseData = objectToSnakeCase(cleanedAttendance)

      // Registrar los datos exactos que se están enviando
      console.log("Datos enviados a Supabase para actualización:", snakeCaseData)

      // Crear un objeto con solo los campos que queremos actualizar
      // Esto evita enviar campos que podrían causar problemas
      const updateFields = {
        employee_id: snakeCaseData.employee_id,
        date: snakeCaseData.date,
        check_in: snakeCaseData.check_in,
        check_out: snakeCaseData.check_out,
        expected_check_in: snakeCaseData.expected_check_in,
        expected_check_out: snakeCaseData.expected_check_out,
        late_minutes: snakeCaseData.late_minutes,
        early_departure_minutes: snakeCaseData.early_departure_minutes,
        extra_minutes: snakeCaseData.extra_minutes,
        total_minutes_worked: snakeCaseData.total_minutes_worked,
        total_minutes_balance: snakeCaseData.total_minutes_balance,
        is_holiday: snakeCaseData.is_holiday,
        is_absent: snakeCaseData.is_absent,
        is_justified: snakeCaseData.is_justified,
        notes: snakeCaseData.notes,
        updated_at: snakeCaseData.updated_at,
      }

      // Realizar la actualización con los campos específicos
      const { error } = await this.supabase.from("attendance").update(updateFields).eq("id", id)

      if (error) {
        console.error("Error detallado de Supabase:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw error
      }

      // Hacer una consulta separada para obtener los datos actualizados
      const { data: updatedData, error: fetchUpdatedError } = await this.supabase
        .from("attendance")
        .select("*")
        .eq("id", id)
        .single()

      if (fetchUpdatedError) {
        console.error("Error al obtener datos actualizados:", fetchUpdatedError)
        throw fetchUpdatedError
      }

      return objectToCamelCase(updatedData)
    } catch (error) {
      console.error("Error al actualizar asistencia:", error)
      throw error
    }
  }

  // NUEVO: Eliminar una asistencia
  async deleteAttendance(id: string) {
    try {
      const { error } = await this.supabase.from("attendance").delete().eq("id", id)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error al eliminar asistencia:", error)
      throw error
    }
  }

  // Payroll methods
  async getPayrollByEmployeeId(employeeId: string) {
    const { data, error } = await this.supabase
      .from("payroll")
      .select("*")
      .eq("employee_id", employeeId)
      .order("period_start", { ascending: false })

    if (error) throw error
    return data.map((item) => objectToCamelCase(item))
  }

  // MODIFICADO: Método createPayroll para usar el salario base del empleado cuando no hay asistencias
  async createPayroll(payroll: Omit<Payroll, "id">) {
    try {
      console.log("Datos originales recibidos en createPayroll:", payroll)

      // Si no se proporciona handSalary, obtener el salario base del empleado
      let handSalary = Number(payroll.handSalary || 0)

      // Si handSalary es 0, intentar obtener el salario base del empleado
      if (handSalary === 0 && payroll.employeeId) {
        try {
          const { data: employee, error } = await this.supabase
            .from("employees")
            .select("base_salary")
            .eq("id", payroll.employeeId)
            .single()

          if (!error && employee && employee.base_salary) {
            console.log(`Usando salario base del empleado: ${employee.base_salary}`)
            handSalary = Number(employee.base_salary)
          }
        } catch (err) {
          console.error("Error al obtener salario base del empleado:", err)
        }
      }

      const bankSalary = Number(payroll.bankSalary || 0)
      // IMPORTANTE: Asegurarse de que deductions y additions sean números
      const deductions = Number(payroll.deductions || 0)
      const additions = Number(payroll.additions || 0)
      const attendanceBonus = Number(payroll.attendanceBonus || 0)
      const hasAttendanceBonus = Boolean(payroll.hasAttendanceBonus)

      // Calcular el sueldo final en mano (handSalary - deductions + additions + attendanceBonus)
      const finalHandSalary = handSalary - deductions + additions + (hasAttendanceBonus ? attendanceBonus : 0)

      // Calcular el total a pagar (finalHandSalary + bankSalary)
      const totalSalary = finalHandSalary + bankSalary

      console.log("Valores calculados:", {
        handSalary,
        bankSalary,
        deductions,
        additions,
        attendanceBonus,
        hasAttendanceBonus,
        finalHandSalary,
        totalSalary,
      })

      // Crear el objeto de datos para la nómina
      const payrollData = objectToSnakeCase({
        ...payroll,
        base_salary: payroll.baseSalary || handSalary, // Usar el salario base proporcionado o el handSalary como fallback
        hand_salary: handSalary,
        bank_salary: bankSalary,
        deductions: deductions,
        additions: additions,
        attendance_bonus: attendanceBonus,
        has_attendance_bonus: hasAttendanceBonus,
        final_hand_salary: finalHandSalary,
        total_salary: totalSalary,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      console.log("Datos procesados para crear nómina:", payrollData)

      const { data, error } = await this.supabase.from("payroll").insert([payrollData]).select().single()

      if (error) {
        console.error("Error al crear nómina:", error)
        throw error
      }

      console.log("Nómina creada exitosamente:", data)
      return objectToCamelCase(data)
    } catch (error) {
      console.error("Error al crear nómina:", error)
      throw error
    }
  }

  async createPayrollDetail(detail: Omit<PayrollDetail, "id">) {
    try {
      // CORRECCIÓN: Asegurarse de que se use el campo 'notes' en lugar de 'description'
      const detailData = {
        ...objectToSnakeCase(detail),
        // Si se proporciona 'description', usarlo como 'notes'
        notes: detail.notes || detail.description || "",
        // IMPORTANTE: Asegurarse de que amount sea un número
        amount: Number(detail.amount || 0),
      }

      console.log("Creando detalle de nómina con datos:", detailData)

      const { data, error } = await this.supabase.from("payroll_details").insert([detailData]).select().single()

      if (error) {
        console.error("Error al crear detalle de nómina:", error)
        throw error
      }

      console.log("Detalle de nómina creado exitosamente:", data)
      return objectToCamelCase(data)
    } catch (error) {
      console.error("Error en createPayrollDetail:", error)
      throw error
    }
  }

  // MODIFICADO: Método getPayrollsByPeriod para incluir información del empleado y asegurar valores correctos
  async getPayrollsByPeriod(month: number, year: number, isPaid = false) {
    try {
      console.log(`Consultando nóminas con isPaid=${isPaid}, month=${month}, year=${year}`)

      // Construir la consulta base
      let query = this.supabase
        .from("payroll")
        .select(`
          *,
          employee:employees(id, first_name, last_name, base_salary),
          details:payroll_details(*)
        `)
        .order("created_at", { ascending: false })

      // Si estamos buscando nóminas pagadas, filtrar por is_paid=true y por mes/año
      if (isPaid) {
        query = query.eq("is_paid", true)

        // Para nóminas pagadas, también filtramos por mes y año
        if (month && year) {
          query = query.eq("month", month).eq("year", year)
        }
      } else {
        // Para nóminas pendientes, solo filtramos por is_paid=false
        // No filtramos por mes/año para mostrar todas las pendientes
        query = query.eq("is_paid", false)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error al obtener nóminas:", error)
        throw error
      }

      console.log(`Total nóminas encontradas: ${data?.length || 0}`)

      // Convertir de snake_case a camelCase
      const payrolls = (data || []).map((item) => {
        const payroll = objectToCamelCase(item)

        // Obtener el salario base del empleado si está disponible
        const employeeBaseSalary = payroll.employee?.baseSalary ? Number(payroll.employee.baseSalary) : 0

        // Asegurarse de que los campos de salario tengan valores numéricos
        payroll.handSalary = Number(payroll.handSalary || 0)
        payroll.bankSalary = Number(payroll.bankSalary || 0)
        payroll.baseSalary = Number(payroll.baseSalary || 0)
        payroll.deductions = Number(payroll.deductions || 0)
        payroll.additions = Number(payroll.additions || 0)
        payroll.attendanceBonus = Number(payroll.attendanceBonus || 0)

        // Si handSalary es 0, usar el salario base del empleado
        if (payroll.handSalary === 0 && employeeBaseSalary > 0) {
          payroll.handSalary = employeeBaseSalary
          console.log(`Usando salario base del empleado (${employeeBaseSalary}) para nómina ${payroll.id}`)
        }

        // Si finalHandSalary es 0 o no existe, calcularlo
        payroll.finalHandSalary = Number(payroll.finalHandSalary || 0)
        if (payroll.finalHandSalary === 0) {
          payroll.finalHandSalary =
            payroll.handSalary -
            payroll.deductions +
            payroll.additions +
            (payroll.hasAttendanceBonus ? payroll.attendanceBonus : 0)
        }

        // Si totalSalary es 0 o no existe, calcularlo
        payroll.totalSalary = Number(payroll.totalSalary || 0)
        if (payroll.totalSalary === 0) {
          payroll.totalSalary = payroll.finalHandSalary + payroll.bankSalary
        }

        // Convertir también los detalles
        if (payroll.details && Array.isArray(payroll.details)) {
          payroll.details = payroll.details.map((detail: any) => objectToCamelCase(detail))
        }

        // Añadir nombre completo del empleado para facilitar la visualización
        if (payroll.employee) {
          payroll.employeeName = `${payroll.employee.firstName || ""} ${payroll.employee.lastName || ""}`.trim()
        }

        console.log("Nómina procesada:", {
          id: payroll.id,
          employeeName: payroll.employeeName,
          handSalary: payroll.handSalary,
          bankSalary: payroll.bankSalary,
          finalHandSalary: payroll.finalHandSalary,
          totalSalary: payroll.totalSalary,
        })

        return payroll
      })

      return payrolls
    } catch (error) {
      console.error("Error al obtener nóminas:", error)
      throw error
    }
  }

  // Método para obtener liquidaciones
  async getLiquidations(isPaid = false) {
    try {
      const { data, error } = await this.supabase
        .from("liquidations")
        .select("*")
        .eq("is_paid", isPaid)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Convertir de snake_case a camelCase
      return (data || []).map((item) => objectToCamelCase(item))
    } catch (error) {
      console.error("Error al obtener liquidaciones:", error)
      throw error
    }
  }

  // Método para crear una liquidación
  async createLiquidation(liquidation: Omit<Liquidation, "id">) {
    try {
      // Convertir de camelCase a snake_case
      const liquidationData = objectToSnakeCase({
        ...liquidation,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const { data, error } = await this.supabase.from("liquidations").insert([liquidationData]).select().single()

      if (error) throw error

      // Convertir de snake_case a camelCase
      return objectToCamelCase(data)
    } catch (error) {
      console.error("Error al crear liquidación:", error)
      throw error
    }
  }

  // MODIFICADO: Método updatePayroll para asegurar cálculos correctos y usar el salario base del empleado
  async updatePayroll(id: string, payroll: Partial<Payroll>) {
    try {
      console.log("Actualizando nómina con ID:", id, "Datos:", payroll)

      // Obtener la nómina actual para tener todos los datos necesarios
      const { data: currentPayroll, error: fetchError } = await this.supabase
        .from("payroll")
        .select("*, employee:employees(base_salary)")
        .eq("id", id)
        .single()

      if (fetchError) {
        console.error("Error al obtener nómina actual:", fetchError)
        throw fetchError
      }

      // Convertir a camelCase para facilitar el trabajo
      const current = objectToCamelCase(currentPayroll)

      // Obtener el salario base del empleado si está disponible
      const employeeBaseSalary = current.employee?.baseSalary ? Number(current.employee.baseSalary) : 0

      // Crear objeto de actualización con los valores actuales
      const updateData: any = {
        updated_at: new Date().toISOString(),
      }

      // Si se proporciona un objeto de pago, procesar los campos relacionados con el pago
      if (payroll.paymentType === "bank" || payroll.bankSalaryPaid) {
        // Pago de banco
        updateData.is_paid_bank = true
        updateData.bank_payment_date = new Date().toISOString()
      }

      if (payroll.paymentType === "hand" || payroll.handSalaryPaid) {
        // Pago en mano
        updateData.is_paid_hand = true
        updateData.hand_payment_date = new Date().toISOString()
      }

      if (payroll.paymentType === "all") {
        // Pago total (banco y mano)
        updateData.is_paid_bank = true
        updateData.is_paid_hand = true
        updateData.bank_payment_date = new Date().toISOString()
        updateData.hand_payment_date = new Date().toISOString()
      }

      // Procesar campos de salario si se proporcionan
      if (payroll.handSalary !== undefined) {
        updateData.hand_salary = Number(payroll.handSalary)
      } else {
        // Si no se proporciona handSalary, usar el valor actual o el salario base del empleado
        updateData.hand_salary = Number(current.handSalary || 0)

        // Si handSalary es 0, usar el salario base del empleado
        if (updateData.hand_salary === 0 && employeeBaseSalary > 0) {
          updateData.hand_salary = employeeBaseSalary
          console.log(`Usando salario base del empleado (${employeeBaseSalary}) para nómina ${id}`)
        }
      }

      if (payroll.bankSalary !== undefined) {
        updateData.bank_salary = Number(payroll.bankSalary)
      } else {
        updateData.bank_salary = Number(current.bankSalary || 0)
      }

      // IMPORTANTE: Procesar explícitamente los campos de deducciones y adiciones
      if (payroll.deductions !== undefined) {
        updateData.deductions = Number(payroll.deductions)
        console.log(`Actualizando deductions a: ${updateData.deductions} (valor original: ${payroll.deductions})`)
      } else {
        updateData.deductions = Number(current.deductions || 0)
      }

      if (payroll.additions !== undefined) {
        updateData.additions = Number(payroll.additions)
        console.log(`Actualizando additions a: ${updateData.additions} (valor original: ${payroll.additions})`)
      } else {
        updateData.additions = Number(current.additions || 0)
      }

      // Manejar explícitamente los campos del bono de presentismo
      if (payroll.hasAttendanceBonus !== undefined) {
        updateData.has_attendance_bonus = Boolean(payroll.hasAttendanceBonus)
      } else {
        updateData.has_attendance_bonus = Boolean(current.hasAttendanceBonus)
      }

      if (payroll.attendanceBonus !== undefined) {
        updateData.attendance_bonus = Number(payroll.attendanceBonus)
      } else {
        updateData.attendance_bonus = Number(current.attendanceBonus || 0)
      }

      // Calcular el sueldo final en mano si no se proporciona
      if (payroll.finalHandSalary !== undefined) {
        updateData.final_hand_salary = Number(payroll.finalHandSalary)
      } else if (payroll.deductions !== undefined || payroll.additions !== undefined) {
        // Recalcular solo si se actualizaron deducciones o adiciones
        updateData.final_hand_salary =
          updateData.hand_salary -
          updateData.deductions +
          updateData.additions +
          (updateData.has_attendance_bonus ? updateData.attendance_bonus : 0)
      } else {
        updateData.final_hand_salary = Number(current.finalHandSalary || 0)
      }

      // Calcular el total a pagar si no se proporciona
      if (payroll.totalSalary !== undefined) {
        updateData.total_salary = Number(payroll.totalSalary)
      } else if (
        payroll.finalHandSalary !== undefined ||
        payroll.bankSalary !== undefined ||
        payroll.deductions !== undefined ||
        payroll.additions !== undefined
      ) {
        // Recalcular solo si se actualizaron valores relacionados
        updateData.total_salary = updateData.final_hand_salary + updateData.bank_salary
      } else {
        updateData.total_salary = Number(current.totalSalary || 0)
      }

      console.log("Datos para actualización:", updateData)

      // IMPORTANTE: Asegurarse de que todos los valores numéricos sean realmente números
      Object.keys(updateData).forEach((key) => {
        if (typeof updateData[key] === "number") {
          // Convertir explícitamente a número para asegurar que se guarde correctamente
          updateData[key] = Number(updateData[key])
        }
      })

      // Realizar la actualización
      const { data, error } = await this.supabase.from("payroll").update(updateData).eq("id", id).select().single()

      if (error) {
        console.error("Error detallado al actualizar nómina:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw error
      }

      console.log("Nómina actualizada correctamente:", data)
      return objectToCamelCase(data)
    } catch (error) {
      console.error("Error al actualizar nómina:", error)
      throw error
    }
  }

  // Método para actualizar una liquidación
  async updateLiquidation(liquidation: Liquidation) {
    try {
      // Convertir de camelCase a snake_case
      const liquidationData = objectToSnakeCase({
        ...liquidation,
        updated_at: new Date().toISOString(),
      })

      const { data, error } = await this.supabase
        .from("liquidations")
        .update(liquidationData)
        .eq("id", liquidation.id)
        .select()
        .single()

      if (error) throw error

      // Convertir de snake_case a camelCase
      return objectToCamelCase(data)
    } catch (error) {
      console.error("Error al actualizar liquidación:", error)
      throw error
    }
  }

  // Método para generar liquidaciones para empleados inactivos
  async generateLiquidations(inactiveEmployees: Employee[]) {
    try {
      let generated = 0
      let updated = 0
      let skipped = 0

      console.log("Iniciando generación de liquidaciones para", inactiveEmployees.length, "empleados inactivos")

      // Obtener liquidaciones existentes
      const { data: existingLiquidations, error: fetchError } = await this.supabase
        .from("liquidations")
        .select("id, employee_id")

      if (fetchError) {
        console.error("Error al obtener liquidaciones existentes:", fetchError)
        throw fetchError
      }

      console.log("Liquidaciones existentes encontradas:", existingLiquidations?.length || 0)

      // Crear un mapa de IDs de empleados que ya tienen liquidación para facilitar la búsqueda
      const employeesWithLiquidation = new Map(existingLiquidations?.map((liq) => [liq.employee_id, liq.id]) || [])

      // Procesar cada empleado inactivo
      for (const employee of inactiveEmployees) {
        console.log(`Procesando empleado ${employee.id}: ${employee.firstName} ${employee.lastName}`)

        // Verificar que tenga fecha de egreso
        if (!employee.terminationDate) {
          console.log(`Empleado ${employee.id} no tiene fecha de egreso, omitiendo...`)
          skipped++
          continue
        }

        // Calcular días trabajados
        const hireDate = new Date(employee.hireDate)
        const terminationDate = new Date(employee.terminationDate)
        const diffTime = Math.abs(terminationDate.getTime() - hireDate.getTime())
        const workedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        console.log(`Empleado ${employee.id} trabajó ${workedDays} días`)

        // Calcular meses trabajados
        const workedMonths = Math.floor(workedDays / 30)

        // Calcular días a pagar en el último mes
        // Si trabajó más de 30 días, solo se pagan los días adicionales al último mes completo
        const daysToPayInLastMonth = workedDays % 30

        console.log(`Días a pagar en el último mes: ${daysToPayInLastMonth}`)

        // Obtener último salario
        const { data: latestPayroll, error: payrollError } = await this.supabase
          .from("payroll")
          .select("base_salary")
          .eq("employee_id", employee.id)
          .order("year", { ascending: false })
          .order("month", { ascending: false })
          .limit(1)

        if (payrollError) {
          console.error(`Error al obtener salario para empleado ${employee.id}:`, payrollError)
          skipped++
          continue
        }

        // Usar salario base de la última nómina o del empleado como fallback
        let baseSalary = 0
        if (latestPayroll && latestPayroll.length > 0 && latestPayroll[0].base_salary) {
          baseSalary = Number(latestPayroll[0].base_salary)
        } else if (employee.baseSalary) {
          baseSalary = Number(employee.baseSalary)
        }

        console.log(`Salario base: ${baseSalary}`)

        // Valor diario del salario
        const dailyRate = baseSalary / 30

        // Calcular monto a pagar por días trabajados en el último mes
        const lastMonthPayment = dailyRate * daysToPayInLastMonth
        console.log(`Monto a pagar por último mes: ${lastMonthPayment}`)

        // Calcular vacaciones proporcionales (siempre calculadas, pero solo se pagan si trabajó más de 20 días)
        // 1 día por mes trabajado
        const proportionalVacation = (workedMonths % 12) * (baseSalary / 30)
        console.log(`Vacaciones proporcionales: ${proportionalVacation}`)

        // Calcular aguinaldo proporcional (siempre calculado, pero solo se paga si trabajó más de 20 días)
        // 1/12 del salario por mes trabajado en el año actual
        const currentYear = terminationDate.getFullYear()
        const startOfYear = new Date(currentYear, 0, 1)
        const monthsInCurrentYear =
          hireDate > startOfYear
            ? workedMonths
            : Math.floor((terminationDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24 * 30))

        const proportionalBonus = (baseSalary / 12) * (monthsInCurrentYear % 12)
        console.log(`Aguinaldo proporcional: ${proportionalBonus}`)

        // Determinar si se incluyen vacaciones y aguinaldo por defecto (si trabajó más de 20 días)
        const includeByDefault = workedDays >= 20
        console.log(`Incluir por defecto (>= 20 días): ${includeByDefault}`)

        // Calcular indemnización (1 mes de salario por año trabajado, si corresponde)
        // Solo si trabajó más de 3 meses y no renunció voluntariamente
        const yearsWorked = Math.floor(workedMonths / 12)
        const compensationAmount = yearsWorked > 0 ? baseSalary * yearsWorked : 0
        console.log(`Indemnización: ${compensationAmount}`)

        // Calcular monto total (incluyendo o no vacaciones y aguinaldo según corresponda)
        const totalAmount =
          lastMonthPayment +
          (includeByDefault ? proportionalVacation : 0) +
          (includeByDefault ? proportionalBonus : 0) +
          compensationAmount

        console.log(`Monto total: ${totalAmount}`)

        // Datos de la liquidación
        const liquidationData = {
          employee_id: employee.id,
          termination_date: employee.terminationDate,
          worked_days: workedDays,
          worked_months: workedMonths,
          days_to_pay_in_last_month: daysToPayInLastMonth, // Fixed field name
          base_salary: baseSalary,
          proportional_vacation: proportionalVacation,
          proportional_bonus: proportionalBonus,
          compensation_amount: lastMonthPayment, // Usar lastMonthPayment en lugar de lastMonthSalary
          total_amount: totalAmount,
          is_paid: false,
          include_vacation: includeByDefault,
          include_bonus: includeByDefault,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        // Verificar si ya existe una liquidación para este empleado
        if (employeesWithLiquidation.has(employee.id)) {
          const liquidationId = employeesWithLiquidation.get(employee.id)
          console.log(`Actualizando liquidación existente con ID ${liquidationId} para empleado ${employee.id}`)

          // Obtener la liquidación existente para preservar algunos campos
          const { data: existingLiquidation, error: getLiquidationError } = await this.supabase
            .from("liquidations")
            .select("*")
            .eq("id", liquidationId)
            .single()

          if (getLiquidationError) {
            console.error(`Error al obtener liquidación existente para empleado ${employee.id}:`, getLiquidationError)
            skipped++
            continue
          }

          // Preservar los valores de include_vacation e include_bonus si ya existen
          if (existingLiquidation) {
            liquidationData.include_vacation =
              existingLiquidation.include_vacation !== undefined
                ? existingLiquidation.include_vacation
                : includeByDefault

            liquidationData.include_bonus =
              existingLiquidation.include_bonus !== undefined ? existingLiquidation.include_bonus : includeByDefault

            // Recalcular el monto total basado en las inclusiones existentes
            liquidationData.total_amount =
              lastMonthPayment +
              (liquidationData.include_vacation ? proportionalVacation : 0) +
              (liquidationData.include_bonus ? proportionalBonus : 0) +
              compensationAmount

            console.log(
              `Valores preservados: include_vacation=${liquidationData.include_vacation}, include_bonus=${liquidationData.include_bonus}`,
            )
            console.log(`Monto total recalculado: ${liquidationData.total_amount}`)
          }

          // Actualizar liquidación existente
          const { error: updateError } = await this.supabase
            .from("liquidations")
            .update(liquidationData)
            .eq("id", liquidationId)

          if (updateError) {
            console.error(`Error al actualizar liquidación para empleado ${employee.id}:`, updateError)
            skipped++
            continue
          }

          updated++
          console.log(`Liquidación actualizada exitosamente para empleado ${employee.id}`)
        } else {
          console.log(`Creando nueva liquidación para empleado ${employee.id}`)
          // Crear nueva liquidación
          const { error: insertError } = await this.supabase.from("liquidations").insert(liquidationData)

          if (insertError) {
            console.error(`Error al crear liquidación para empleado ${employee.id}:`, insertError)
            skipped++
            continue
          }

          generated++
          console.log(`Liquidación creada exitosamente para empleado ${employee.id}`)
        }
      }

      console.log(`Proceso completado: ${generated} generadas, ${updated} actualizadas, ${skipped} omitidas`)
      return { generated, updated, skipped }
    } catch (error) {
      console.error("Error al generar liquidaciones:", error)
      throw new Error("No se pudieron generar las liquidaciones")
    }
  }

  /**
   * Actualiza los días a pagar del último mes en las liquidaciones existentes
   * @returns Resultado de la operación
   */
  async updateLiquidationDaysToPayInLastMonth() {
    try {
      console.log("Iniciando actualización de días a pagar en liquidaciones...")

      // Obtener todas las liquidaciones
      const { data: liquidations, error: fetchError } = await this.supabase
        .from("liquidations")
        .select(
          "id, employee_id, termination_date, include_vacation, include_bonus, proportional_vacation, proportional_bonus",
        )

      if (fetchError) throw fetchError

      if (!liquidations || liquidations.length === 0) {
        console.log("No hay liquidaciones para actualizar")
        return { updated: 0, failed: 0, skipped: 0 }
      }

      console.log(`Se encontraron ${liquidations.length} liquidaciones para procesar`)

      let updated = 0
      let failed = 0
      const skipped = 0

      // Procesar cada liquidación
      for (const liquidation of liquidations) {
        try {
          console.log(`Procesando liquidación ID: ${liquidation.id} para empleado: ${liquidation.employee_id}`)

          // Obtener información del empleado
          const { data: employee, error: employeeError } = await this.supabase
            .from("employees")
            .select("hire_date, salary, base_salary")
            .eq("id", liquidation.employee_id)
            .single()

          if (employeeError) {
            console.error(`Error al obtener empleado para liquidación ${liquidation.id}:`, employeeError)
            failed++
            continue
          }

          if (!employee) {
            console.log(`No se encontró el empleado ${liquidation.employee_id} para la liquidación ${liquidation.id}`)
            failed++
            continue
          }

          // Usar base_salary si está disponible, de lo contrario usar salary
          const employeeSalary = employee.base_salary || employee.salary || 0
          console.log(`Empleado encontrado - Fecha contratación: ${employee.hire_date}, Salario: ${employeeSalary}`)

          // Calcular los días a pagar del último mes
          const terminationDate = new Date(liquidation.termination_date)

          // Obtener el último día del mes
          const lastDayOfMonth = new Date(terminationDate.getFullYear(), terminationDate.getMonth() + 1, 0).getDate()

          // Calcular días trabajados en el último mes (hasta la fecha de terminación)
          const daysInLastMonth = Math.min(terminationDate.getDate(), lastDayOfMonth)

          console.log(`Días trabajados en el último mes: ${daysInLastMonth}`)

          // Calcular el valor diario del salario
          const dailySalary = employeeSalary / 30
          console.log(`Salario diario: ${dailySalary}`)

          // Calcular el monto de compensación (pago por días trabajados en el último mes)
          const compensationAmount = dailySalary * daysInLastMonth
          console.log(`Monto de compensación calculado: ${compensationAmount}`)

          // Calcular el nuevo monto total
          let totalAmount = compensationAmount

          // Agregar vacaciones proporcionales si se incluyen
          if (liquidation.include_vacation) {
            totalAmount += liquidation.proportional_vacation || 0
            console.log(`Incluyendo vacaciones proporcionales: ${liquidation.proportional_vacation}`)
          }

          // Agregar aguinaldo proporcional si se incluye
          if (liquidation.include_bonus) {
            totalAmount += liquidation.proportional_bonus || 0
            console.log(`Incluyendo aguinaldo proporcional: ${liquidation.proportional_bonus}`)
          }

          console.log(`Nuevo monto total calculado: ${totalAmount}`)

          // Actualizar la liquidación
          const { error: updateError } = await this.supabase
            .from("liquidations")
            .update({
              days_to_pay_in_last_month: daysInLastMonth,
              compensation_amount: compensationAmount,
              total_amount: totalAmount,
            })
            .eq("id", liquidation.id)

          if (updateError) {
            console.error(`Error al actualizar liquidación ${liquidation.id}:`, updateError)
            failed++
          } else {
            console.log(`Liquidación ${liquidation.id} actualizada correctamente`)
            updated++
          }
        } catch (error) {
          console.error(`Error al procesar liquidación ${liquidation.id}:`, error)
          failed++
        }
      }

      console.log(`Actualización completada: ${updated} actualizadas, ${failed} fallidas, ${skipped} omitidas`)
      return { updated, failed, skipped }
    } catch (error) {
      console.error("Error al actualizar días a pagar en liquidaciones:", error)
      throw error
    }
  }

  // Delivery stats methods
  async getDeliveryStats(startDate: Date, endDate: Date) {
    const { data, error } = await this.supabase
      .from("delivery_stats")
      .select("*")
      .gte("date", startDate.toISOString())
      .lte("date", endDate.toISOString())
      .order("date")

    if (error) throw error
    return data.map((item) => objectToCamelCase(item))
  }

  // Audit methods
  async getAudits(startDate?: Date, endDate?: Date) {
    try {
      let query = this.supabase.from("audits").select("*").order("date", { ascending: false })

      if (startDate) {
        query = query.gte("date", startDate.toISOString())
      }
      
      if (endDate) {
        query = query.lte("date", endDate.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      // Convertir de snake_case a camelCase y asegurar que localName esté disponible
      return (data || []).map((item) => {
        const audit = objectToCamelCase(item)

        // Si no hay localName pero hay local_name, usar ese valor
        if (!audit.localName && item.local_name) {
          audit.localName = item.local_name
        }

        // Si no hay auditorName pero hay auditor_name, usar ese valor
        if (!audit.auditorName && item.auditor_name) {
          audit.auditorName = item.auditor_name
        }

        console.log("Audit después de procesamiento:", audit)
        return audit
      })
    } catch (error) {
      console.error("Error en getAudits:", error)
      return []
    }
  }

  // Actualización de la función createAudit en la clase DatabaseService
  async createAudit(auditData: any): Promise<Audit> {
    try {
      console.log("Datos recibidos en createAudit:", auditData)

      // Asegurarse de que categories sea un array
      if (!auditData.categories || !Array.isArray(auditData.categories)) {
        console.error("Error: categories no es un array o está vacío")
        throw new Error("Las categorías de la auditoría deben ser un array")
      }

      // Mapear los campos para que coincidan con lo que espera la base de datos
      // Usar auditor_name como nombre de la columna y notes en lugar de general_observations
      const dataToSave = {
        local_id: auditData.localId || "",
        local_name: auditData.localName || "",
        auditor_name: auditData.auditor || "", // Cambiado a auditor_name
        date: auditData.date ? new Date(auditData.date).toISOString() : new Date().toISOString(),
        notes: auditData.generalObservations || "", // Cambiado a notes que es el nombre correcto en la base de datos
        categories: auditData.categories,
        total_score: auditData.totalScore || 0,
        max_score: auditData.maxScore || 0,
        percentage: auditData.percentage || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("Datos de auditoría a insertar:", dataToSave)

      const { data, error } = await this.supabase.from("audits").insert([dataToSave]).select().single()

      if (error) {
        console.error("Error en createAudit:", error)
        throw error
      }

      console.log("Auditoría creada con éxito:", data)
      return objectToCamelCase(data)
    } catch (error) {
      console.error("Error en createAudit:", error)
      throw error
    }
  }

  /**
   * Obtiene una auditoría por su ID
   * @param id ID de la auditoría
   * @returns La auditoría encontrada o null si no existe
   */
  async getAuditById(id: string): Promise<Audit | null> {
    try {
      const { data, error } = await this.supabase.from("audits").select("*").eq("id", id).single()

      if (error) {
        console.error("Error en getAuditById:", error)
        throw error
      }
      
      // Convertir de snake_case a camelCase y asegurar que localName y auditorName estén disponibles
      const audit = objectToCamelCase(data)

      // Si no hay localName pero hay local_name, usar ese valor
      if (!audit.localName && data.local_name) {
        audit.localName = data.local_name
      }

      // Si no hay auditorName pero hay auditor_name, usar ese valor
      if (!audit.auditorName && data.auditor_name) {
        audit.auditorName = data.auditor_name
      }

      console.log("Audit por ID después de procesamiento:", audit)
      return audit
    } catch (error) {
      console.error("Error en getAuditById:", error)
      return null
    }
  }

  // Billing methods
  async getBilling(startDate: Date, endDate: Date) {
    const { data, error } = await this.supabase
      .from("billing")
      .select("*")
      .gte("date", startDate.toISOString())
      .lte("date", endDate.toISOString())
      .order("date", { ascending: false })

    if (error) throw error
    return data.map((item) => objectToCamelCase(item))
  }

  async createBilling(billing: Omit<Billing, "id">) {
    const billingData = objectToSnakeCase(billing)
    const { data, error } = await this.supabase.from("billing").insert([billingData]).select().single()

    if (error) throw error
    return objectToCamelCase(data)
  }

  // Balance methods
  async getBalance(startDate: Date, endDate: Date) {
    const { data, error } = await this.supabase
      .from("balance")
      .select("*")
      .gte("date", startDate.toISOString())
      .lte("date", endDate.toISOString())
      .order("date")

    if (error) throw error
    return data.map((item) => objectToCamelCase(item))
  }

  async createBalance(balance: Omit<Balance, "id">) {
    const balanceData = objectToSnakeCase(balance)
    const { data, error } = await this.supabase.from("balance").insert([balanceData]).select().single()

    if (error) throw error
    return objectToCamelCase(data)
  }

  /**
   * Obtiene el promedio de ventas para un local
   * @param localId ID del local
   * @returns Objeto con los promedios de ventas por producto
   */
  async getAverageSales(localId: string): Promise<Record<string, number>> {
    try {
      const { data, error } = await this.supabase.from("sales_average").select("*").eq("local_id", localId).single()

      if (error) {
        console.error("Error en getAverageSales:", error)
        throw error
      }

      return objectToCamelCase(data.averages || {})
    } catch (error) {
      console.error("Error en getAverageSales:", error)
      return {}
    }
  }

  /**
   * Obtiene el stock actual para un local
   * @param localId ID del local
   * @returns Objeto con el stock actual por producto
   */
  async getCurrentStock(localId: string): Promise<Record<string, number>> {
    try {
      const { data, error } = await this.supabase
        .from("stock")
        .select("*")
        .eq("local_id", localId)
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) {
        console.error("Error en getCurrentStock:", error)
        throw error
      }

      return objectToCamelCase(data[0]?.items || {})
    } catch (error) {
      console.error("Error en getCurrentStock:", error)
      return {}
    }
  }

  /**
   * Guarda un pedido
   * @param orderData Datos del pedido
   * @returns El pedido guardado
   */
  async saveOrder(orderData: any): Promise<Order> {
    try {
      // Convertir de camelCase a snake_case
      const snakeCaseData = objectToSnakeCase(orderData)

      const { data, error } = await this.supabase.from("orders").insert([snakeCaseData]).select().single()

      if (error) {
        console.error("Error en saveOrder:", error)
        throw error
      }

      return objectToCamelCase(data)
    } catch (error) {
      console.error("Error en saveOrder:", error)
      throw error
    }
  }

  /**
   * Obtiene un pedido por su ID
   * @param id ID del pedido
   * @returns El pedido encontrado o null si no existe
   */
  async getOrderById(id: string): Promise<Order | null> {
    try {
      const { data, error } = await this.supabase.from("orders").select("*").eq("id", id).single()

      if (error) {
        console.error("Error en getOrderById:", error)
        throw error
      }

      return objectToCamelCase(data)
    } catch (error) {
      console.error("Error en getOrderById:", error)
      return null
    }
  }

  async getAllOrders() {
    try {
      const { data, error } = await this.supabase.from("orders").select("*")

      if (error) {
        console.error("Error en getAllOrders:", error)
        throw error
      }

      return data.map((item) => objectToCamelCase(item))
    } catch (error) {
      console.error("Error en getAllOrders:", error)
      return []
    }
  }
  
  // UPDATED: Simplified getDashboardStats method to fix the error
  async getDashboardStats() {
    try {
      // Simplificamos para evitar el error
      const { data: activeEmployees, error: employeesError } = await this.supabase
        .from("employees")
        .select("id")
        .eq("status", "active")

      if (employeesError) {
        console.error("Error fetching employees:", employeesError)
        throw employeesError
      }

      // Devolvemos datos básicos sin intentar obtener delivery_stats por ahora
      return {
        activeEmployees: Array.isArray(activeEmployees) ? activeEmployees.length : 0,
        activeEmployeesChange: 0,
        totalDeliveryOrders: 0,
        deliveryOrdersChange: 0,
        totalRevenue: 0,
        revenueChange: 0,
        averageRating: 0,
        ratingChange: 0,
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      // Return default values instead of throwing to prevent UI crashes
      return {
        activeEmployees: 0,
        activeEmployeesChange: 0,
        totalDeliveryOrders: 0,
        deliveryOrdersChange: 0,
        totalRevenue: 0,
        revenueChange: 0,
        averageRating: 0,
        ratingChange: 0,
      }
    }
  }

  async generateReports() {
    try {
      // Mock data for reports
      return [
        {
          name: "Facturación por Local",
          data: {
            labels: ["BR Cabildo", "BR Carranza", "BR Pacifico", "BR Lavalle", "BR Rivadavia"],
            datasets: [
              {
                label: "Ventas Mensuales",
                data: [150000, 120000, 180000, 90000, 160000],
                backgroundColor: "rgba(59, 130, 246, 0.5)",
                borderColor: "rgb(59, 130, 246)",
                borderWidth: 1,
              },
            ],
          },
        },
        {
          name: "Evolución de Pedidos por Plataforma",
          data: {
            labels: ["PedidosYa", "Rappi", "MercadoPago"],
            datasets: [
              {
                data: [35, 40, 25],
                backgroundColor: ["rgba(255, 99, 132, 0.5)", "rgba(54, 162, 235, 0.5)", "rgba(255, 206, 86, 0.5)"],
                borderColor: ["rgba(255, 99, 132, 1)", "rgba(54, 162, 235, 1)", "rgba(255, 206, 86, 1)"],
                borderWidth: 1,
              },
            ],
          },
        },
      ]
    } catch (error) {
      console.error("Error generating reports:", error)
      throw error
    }
  }

  // Método para verificar la estructura de la tabla
  async checkTableStructure(tableName: string) {
    try {
      // Consultar una fila para ver la estructura
      const { data, error } = await this.supabase.from(tableName).select("*").limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        console.log(`Estructura de la tabla ${tableName}:`, Object.keys(data[0]))
        return Object.keys(data[0])
      } else {
        console.log(`La tabla ${tableName} está vacía o no existe`)
        return []
      }
    } catch (error) {
      console.error(`Error al verificar la estructura de la tabla ${tableName}:`, error)
      throw error
    }
  }

  // Añadir el método getAuditConfig mejorado en la clase DatabaseService

  /**
   * Obtiene la configuración de auditorías
   * @param type Tipo de auditoría ('rapida' o 'completa')
   * @returns Configuración de categorías e ítems para auditorías
   */
  async getAuditConfig(type = "completa") {
    try {
      console.log(`Obteniendo configuración de auditorías tipo: ${type}`)
      const { data, error } = await this.supabase.from("audit_config").select("*").eq("type", type).single()

      if (error) {
        console.error(`Error al obtener configuración de auditorías tipo ${type}:`, error)

        // Si el error es porque no existe la tabla o no hay registros, devolver configuración por defecto
        if (error.code === "PGRST116" || error.code === "22P02") {
          console.log("No se encontró configuración, devolviendo valores por defecto")

          // Configuración por defecto según el tipo
          if (type === "rapida") {
            return {
              type: "rapida",
              categories: [
                {
                  id: "limpieza",
                  name: "Limpieza",
                  maxScore: 20,
                  items: [
                    {
                      id: "limpieza_pisos",
                      name: "Pisos limpios",
                      maxScore: 5,
                      description: "Los pisos están limpios y sin residuos",
                    },
                    {
                      id: "limpieza_mesas",
                      name: "Mesas y sillas",
                      maxScore: 5,
                      description: "Mesas y sillas limpias y en buen estado",
                    },
                    {
                      id: "limpieza_banos",
                      name: "Baños",
                      maxScore: 5,
                      description: "Baños limpios y con insumos completos",
                    },
                    {
                      id: "limpieza_cocina",
                      name: "Cocina",
                      maxScore: 5,
                      description: "Área de cocina limpia y ordenada",
                    },
                  ],
                },
                {
                  id: "presentacion",
                  name: "Presentación",
                  maxScore: 15,
                  items: [
                    {
                      id: "uniforme",
                      name: "Uniforme del personal",
                      maxScore: 5,
                      description: "Personal con uniforme completo y en buen estado",
                    },
                    {
                      id: "higiene_personal",
                      name: "Higiene personal",
                      maxScore: 5,
                      description: "Personal con buena higiene y presentación",
                    },
                    {
                      id: "presentacion_productos",
                      name: "Presentación de productos",
                      maxScore: 5,
                      description: "Productos bien presentados y etiquetados",
                    },
                  ],
                },
                {
                  id: "atencion",
                  name: "Atención al Cliente",
                  maxScore: 15,
                  items: [
                    {
                      id: "saludo",
                      name: "Saludo y bienvenida",
                      maxScore: 5,
                      description: "Se saluda correctamente a los clientes",
                    },
                    {
                      id: "tiempo_atencion",
                      name: "Tiempo de atención",
                      maxScore: 5,
                      description: "Tiempo de espera adecuado",
                    },
                    {
                      id: "resolucion_problemas",
                      name: "Resolución de problemas",
                      maxScore: 5,
                      description: "Se resuelven adecuadamente los problemas",
                    },
                  ],
                },
                {
                  id: "procesos",
                  name: "Procesos",
                  maxScore: 15,
                  items: [
                    {
                      id: "preparacion",
                      name: "Preparación de alimentos",
                      maxScore: 5,
                      description: "Se siguen los procedimientos de preparación",
                    },
                    {
                      id: "manejo_caja",
                      name: "Manejo de caja",
                      maxScore: 5,
                      description: "Procedimientos de caja correctos",
                    },
                    {
                      id: "control_stock",
                      name: "Control de stock",
                      maxScore: 5,
                      description: "Inventario actualizado y controlado",
                    },
                  ],
                },
                {
                  id: "seguridad",
                  name: "Seguridad",
                  maxScore: 15,
                  items: [
                    {
                      id: "extintores",
                      name: "Extintores",
                      maxScore: 5,
                      description: "Extintores en buen estado y accesibles",
                    },
                    {
                      id: "salidas_emergencia",
                      name: "Salidas de emergencia",
                      maxScore: 5,
                      description: "Salidas de emergencia señalizadas y despejadas",
                    },
                    {
                      id: "elementos_seguridad",
                      name: "Elementos de seguridad",
                      maxScore: 5,
                      description: "Elementos de seguridad en buen estado",
                    },
                  ],
                },
              ],
            }
          } else {
            return {
              type: "completa",
              categories: [
                {
                  id: "limpieza",
                  name: "Limpieza y Orden",
                  maxScore: 25,
                  items: [
                    { id: "limpieza_general", name: "Limpieza general del local", maxScore: 5 },
                    { id: "orden_cocina", name: "Orden en la cocina", maxScore: 5 },
                    { id: "limpieza_banos", name: "Limpieza de baños", maxScore: 5 },
                    { id: "manejo_residuos", name: "Manejo de residuos", maxScore: 5 },
                    { id: "orden_almacen", name: "Orden en almacén", maxScore: 5 },
                  ],
                },
                {
                  id: "seguridad_alimentaria",
                  name: "Seguridad Alimentaria",
                  maxScore: 25,
                  items: [
                    { id: "control_temperatura", name: "Control de temperatura de alimentos", maxScore: 5 },
                    { id: "almacenamiento", name: "Almacenamiento adecuado", maxScore: 5 },
                    { id: "fechas_vencimiento", name: "Control de fechas de vencimiento", maxScore: 5 },
                    { id: "manipulacion", name: "Manipulación de alimentos", maxScore: 5 },
                    { id: "contaminacion_cruzada", name: "Prevención de contaminación cruzada", maxScore: 5 },
                  ],
                },
                {
                  id: "atencion_cliente",
                  name: "Atención al Cliente",
                  maxScore: 20,
                  items: [
                    { id: "presentacion_personal", name: "Presentación del personal", maxScore: 5 },
                    { id: "amabilidad", name: "Amabilidad y cortesía", maxScore: 5 },
                    { id: "rapidez", name: "Rapidez en el servicio", maxScore: 5 },
                    { id: "conocimiento_menu", name: "Conocimiento del menú", maxScore: 5 },
                  ],
                },
                {
                  id: "calidad_producto",
                  name: "Calidad del Producto",
                  maxScore: 20,
                  items: [
                    { id: "presentacion_platos", name: "Presentación de platos", maxScore: 5 },
                    { id: "sabor", name: "Sabor y temperatura adecuados", maxScore: 5 },
                    { id: "consistencia", name: "Consistencia en la calidad", maxScore: 5 },
                    { id: "frescura", name: "Frescura de ingredientes", maxScore: 5 },
                  ],
                },
                {
                  id: "procesos_operativos",
                  name: "Procesos Operativos",
                  maxScore: 10,
                  items: [
                    { id: "seguimiento_recetas", name: "Seguimiento de recetas estándar", maxScore: 5 },
                    { id: "eficiencia", name: "Eficiencia en procesos", maxScore: 5 },
                  ],
                },
              ],
            }
          }
        }

        throw error
      }

      console.log(`Configuración de auditoría ${type} obtenida:`, data)
      return data
    } catch (error) {
      console.error(`Error en getAuditConfig para tipo ${type}:`, error)
      throw error
    }
  }

  /**
   * Guarda la configuración de auditorías
   * @param config Configuración de categorías e ítems para auditorías
   * @returns Resultado de la operación
   */
  async saveAuditConfig(config: any) {
    try {
      const type = config.type || "completa"

      // Verificar si ya existe una configuración para este tipo
      const { data: existingConfig, error: checkError } = await this.supabase
        .from("audit_config")
        .select("id")
        .eq("type", type)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        console.error(`Error al verificar configuración existente para tipo ${type}:`, checkError)
        throw checkError
      }

      if (existingConfig) {
        // Actualizar configuración existente
        console.log(`Actualizando configuración existente para tipo ${type}:`, existingConfig.id)
        const { data, error } = await this.supabase
          .from("audit_config")
          .update(config)
          .eq("id", existingConfig.id)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // Crear nueva configuración
        console.log(`Creando nueva configuración para tipo ${type}`)
        const { data, error } = await this.supabase.from("audit_config").insert([config]).select().single()

        if (error) throw error
        return data
      }
    } catch (error) {
      console.error("Error en saveAuditConfig:", error)
      throw error
    }
  }

  // NUEVAS FUNCIONES PARA SOLUCIONAR LOS ERRORES

  /**
   * Obtiene una nómina por su ID
   * @param payrollId ID de la nómina
   * @returns La nómina encontrada o null si no existe
   */
  async getPayrollById(payrollId: string) {
    try {
      console.log(`Obteniendo nómina con ID: ${payrollId}`)

      // Consulta directa a la tabla payroll con join a employees
      const { data, error } = await this.supabase
        .from("payroll")
        .select(`
          *,
          employee:employees(*)
        `)
        .eq("id", payrollId)
        .single()

      if (error) {
        console.error("Error al obtener nómina por ID:", error)
        throw error
      }

      if (!data) {
        console.log(`No se encontró nómina con ID: ${payrollId}`)
        return null
      }

      // Convertir a camelCase para uso en el frontend
      const payroll = objectToCamelCase(data)
      console.log("Nómina obtenida:", payroll)

      // Obtener detalles de la nómina si existen
      try {
        const { data: detailsData, error: detailsError } = await this.supabase
          .from("payroll_details")
          .select("*")
          .eq("payroll_id", payrollId)
          .order("type", { ascending: true })

        if (detailsError) {
          console.error("Error al obtener detalles de nómina:", detailsError)
        } else if (detailsData && detailsData.length > 0) {
          payroll.details = detailsData.map((row) => objectToCamelCase(row))
          console.log(`Se encontraron ${detailsData.length} detalles para la nómina`)
        } else {
          payroll.details = []
          console.log("No se encontraron detalles para la nómina")
        }
      } catch (detailsError) {
        console.error("Error al consultar detalles de nómina:", detailsError)
        payroll.details = []
      }

      return payroll
    } catch (error) {
      console.error("Error al obtener nómina por ID:", error)
      throw new Error("Error al obtener nómina por ID")
    }
  }

  /**
   * Elimina los detalles de una nómina
   * @param payrollId ID de la nómina
   * @returns true si se eliminaron correctamente
   */
  async deletePayrollDetails(payrollId: string) {
    try {
      const { error } = await this.supabase.from("payroll_details").delete().eq("payroll_id", payrollId)

      if (error) {
        console.error("Error al eliminar detalles de nómina:", error)
        throw error
      }

      return true
    } catch (error) {
      console.error("Error al eliminar detalles de nómina:", error)
      throw new Error("Error al eliminar detalles de nómina")
    }
  }

  /**
   * Obtiene nóminas por empleado y período
   * @param employeeId ID del empleado
   * @param month Mes
   * @param year Año
   * @returns Lista de nóminas
   */
  async getPayrollsByEmployeeAndPeriod(employeeId: string, month: number, year: number) {
    try {
      const { data, error } = await this.supabase
        .from("payroll")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("month", month)
        .eq("year", year)

      if (error) {
        console.error("Error al obtener nóminas por empleado y período:", error)
        throw error
      }

      return data.map((item) => objectToCamelCase(item))
    } catch (error) {
      console.error("Error al obtener nóminas por empleado y período:", error)
      throw new Error("Error al obtener nóminas por empleado y período")
    }
  }

  /**
   * Obtiene estadísticas de ventas
   * @param startDate Fecha de inicio
   * @param endDate Fecha de fin
   * @returns Estadísticas de ventas
   */
  async getSalesStats(startDate?: Date, endDate?: Date) {
    try {
      console.log("Obteniendo estadísticas de ventas", { startDate, endDate })

      // Construir la consulta base
      let query = this.supabase.from("sales_stats").select("*")

      // Aplicar filtros de fecha si se proporcionan
      if (startDate) {
        query = query.gte("date", startDate.toISOString())
      }

      if (endDate) {
        query = query.lte("date", endDate.toISOString())
      }

      // Ordenar por fecha
      query = query.order("date", { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error("Error al obtener estadísticas de ventas:", error)
        // Devolver datos vacíos en caso de error para evitar que la aplicación falle
        return {
          totalSales: 0,
          averageTicket: 0,
          salesByPlatform: {},
          salesByPaymentMethod: {},
          salesByDay: [],
        }
      }

      // Si no hay datos, devolver estructura vacía
      if (!data || data.length === 0) {
        console.log("No se encontraron estadísticas de ventas")
        return {
          totalSales: 0,
          averageTicket: 0,
          salesByPlatform: {},
          salesByPaymentMethod: {},
          salesByDay: [],
        }
      }

      // Procesar los datos para el formato esperado
      // Esto es una implementación básica, ajustar según la estructura real de los datos
      const result = {
        totalSales: data.reduce((sum, item) => sum + (item.total_amount || 0), 0),
        averageTicket: data.reduce((sum, item) => sum + (item.average_ticket || 0), 0) / data.length,
        salesByPlatform: {},
        salesByPaymentMethod: {},
        salesByDay: data.map((item) => ({
          date: item.date,
          amount: item.total_amount || 0,
        })),
      }

      // Agrupar por plataforma si existe
      if (data[0].platform) {
        const platforms = {}
        data.forEach((item) => {
          if (item.platform) {
            platforms[item.platform] = (platforms[item.platform] || 0) + (item.total_amount || 0)
          }
        })
        result.salesByPlatform = platforms
      }

      // Agrupar por método de pago si existe
      if (data[0].payment_method) {
        const methods = {}
        data.forEach((item) => {
          if (item.payment_method) {
            methods[item.payment_method] = (methods[item.payment_method] || 0) + (item.total_amount || 0)
          }
        })
        result.salesByPaymentMethod = methods
      }

      return result
    } catch (error) {
      console.error("Error en getSalesStats:", error)
      // Devolver datos vacíos en caso de error para evitar que la aplicación falle
      return {
        totalSales: 0,
        averageTicket: 0,
        salesByPlatform: {},
        salesByPaymentMethod: {},
        salesByDay: [],
      }
    }
  }

  /**
   * Obtiene los productos más vendidos
   * @param limit Límite de productos a obtener
   * @param startDate Fecha de inicio
   * @param endDate Fecha de fin
   * @returns Lista de productos más vendidos
   */
  async getTopSellingProducts(limit = 10, startDate?: Date, endDate?: Date) {
    try {
      console.log("Obteniendo productos más vendidos", { limit, startDate, endDate })

      // Construir la consulta base
      // Asumimos que existe una tabla o vista que contiene esta información
      let query = this.supabase.from("product_sales").select("*")

      // Aplicar filtros de fecha si se proporcionan
      if (startDate) {
        query = query.gte("date", startDate.toISOString())
      }

      if (endDate) {
        query = query.lte("date", endDate.toISOString())
      }

      // Ordenar por cantidad vendida descendente y limitar resultados
      query = query.order("quantity", { ascending: false }).limit(limit)

      const { data, error } = await query

      if (error) {
        console.error("Error al obtener productos más vendidos:", error)
        // Devolver array vacío en caso de error para evitar que la aplicación falle
        return []
      }

      // Si no hay datos, devolver array vacío
      if (!data || data.length === 0) {
        console.log("No se encontraron datos de productos más vendidos")
        return []
      }

      // Convertir de snake_case a camelCase
      return data.map((item) => objectToCamelCase(item))
    } catch (error) {
      console.error("Error en getTopSellingProducts:", error)
      // Devolver array vacío en caso de error para evitar que la aplicación falle
      return []
    }
  }
}

// Función auxiliar para calcular la jornada laboral esperada en minutos
function calculateExpectedWorkday(expectedCheckIn: string, expectedCheckOut: string): number {
  const checkIn = new Date(`2000-01-01T${expectedCheckIn}`)
  const checkOut = new Date(`2000-01-01T${expectedCheckOut}`)
  return Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000)
}

// Crear una instancia del servicio
const dbService = new DatabaseService()

// Intentar actualizar las columnas conocidas al iniciar
dbService.updateEmployeeColumns().catch(console.error)

// Exportar la función getSupabase (AÑADIDO)
export const getSupabase = () => dbService.getSupabase()

// Crear un objeto que imita la estructura de Prisma pero usa dbService internamente
export const db = {
  // Adaptador para attendance
  attendance: {
    findMany: async ({ take, orderBy }: { take?: number; orderBy?: any } = {}) => {
      // Convertir los parámetros de Prisma a los que espera dbService
      const limit = take || 100
      return await dbService.getRecentAttendances(limit)
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      return await dbService.getAttendanceById(where.id)
    },
    create: async ({ data }: { data: any }) => {
      return await dbService.createAttendance(data)
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      return await dbService.updateAttendance(where.id, data)
    },
    delete: async ({ where }: { where: { id: string } }) => {
      return await dbService.deleteAttendance(where.id)
    },
  },

  // Adaptador para employees
  employees: {
    findMany: async () => {
      return await dbService.getEmployees()
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      return await dbService.getEmployeeById(where.id)
    },
    create: async ({ data }: { data: any }) => {
      return await dbService.createEmployee(data)
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      return await dbService.updateEmployee(where.id, data)
    },
    delete: async ({ where }: { where: { id: string } }) => {
      return await dbService.deleteEmployee(where.id)
    },
  },

  // Adaptador para audits
  audits: {
    findMany: async () => {
      return await dbService.getAudits()
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      return await dbService.getAuditById(where.id)
    },
    create: async ({ data }: { data: any }) => {
      return await dbService.createAudit(data)
    },
  },

  // Adaptador para orders
  orders: {
    findMany: async () => {
      return await dbService.getAllOrders()
    },
    create: async ({ data }: { data: any }) => {
      return await dbService.saveOrder(data)
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      return await dbService.getOrderById(where.id)
    },
  },
  auditConfig: {
    get: async (type = "completa") => {
      return await dbService.getAuditConfig(type)
    },
    save: async (data: any) => {
      return await dbService.saveAuditConfig(data)
    },
  },
}

// Exportar también el servicio original para mantener compatibilidad
export { dbService }