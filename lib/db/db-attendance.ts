// Log distintivo para verificar que se está cargando el módulo de asistencias
console.log('📅 CARGANDO: Módulo de asistencias (lib/db/db-attendance.ts)');

import { DatabaseServiceBase, calculateExpectedWorkday } from "./db-core"
import { objectToCamelCase, objectToSnakeCase } from "../utils"
import type { Attendance } from "@/types"

export class AttendanceService extends DatabaseServiceBase {
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
}

// Crear una instancia del servicio
export const attendanceService = new AttendanceService()