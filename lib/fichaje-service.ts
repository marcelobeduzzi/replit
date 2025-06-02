// Servicio para manejar las operaciones de fichaje QR

export const fichajeService = {
  // Registrar un fichaje (entrada o salida)
  async registerClock(data: {
    employeeId: string
    latitude: number
    longitude: number
    clockType: "entrada" | "salida"
  }) {
    try {
      const response = await fetch("/api/fichaje-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al registrar fichaje")
      }

      return await response.json()
    } catch (error) {
      console.error("Error en registerClock:", error)
      throw error
    }
  },

  // Obtener el historial de fichajes
  async getClockHistory(
    filters: {
      employeeId?: string
      locationId?: string
      startDate?: string
      endDate?: string
      clockType?: "entrada" | "salida"
    } = {},
  ) {
    try {
      // Construir parámetros de consulta
      const params = new URLSearchParams()

      if (filters.employeeId) {
        params.append("employeeId", filters.employeeId)
      }

      if (filters.locationId) {
        params.append("locationId", filters.locationId)
      }

      if (filters.startDate) {
        params.append("startDate", filters.startDate)
      }

      if (filters.endDate) {
        params.append("endDate", filters.endDate)
      }

      if (filters.clockType) {
        params.append("clockType", filters.clockType)
      }

      const response = await fetch(`/api/fichaje-qr?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al obtener historial de fichajes")
      }

      return await response.json()
    } catch (error) {
      console.error("Error en getClockHistory:", error)
      throw error
    }
  },

  // Obtener el último fichaje de un empleado
  async getLastClockAction(employeeId: string) {
    try {
      const response = await this.getClockHistory({
        employeeId,
      })

      if (response.success && response.data.length > 0) {
        // Ordenar por fecha (más reciente primero)
        const sortedRecords = response.data.sort(
          (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )

        // Devolver el tipo del último fichaje
        return sortedRecords[0].clock_type as "entrada" | "salida"
      }

      // Si no hay registros, asumimos que la próxima acción es una entrada
      return "salida"
    } catch (error) {
      console.error("Error en getLastClockAction:", error)
      // En caso de error, asumimos que la próxima acción es una entrada
      return "salida"
    }
  },

  // Verificar si un empleado ya ha fichado entrada hoy
  async hasCheckedInToday(employeeId: string) {
    try {
      // Obtener la fecha de hoy (sin hora)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const response = await this.getClockHistory({
        employeeId,
        startDate: today.toISOString(),
        clockType: "entrada",
      })

      return response.success && response.data.length > 0
    } catch (error) {
      console.error("Error en hasCheckedInToday:", error)
      return false
    }
  },

  // Verificar si un empleado ya ha fichado salida hoy
  async hasCheckedOutToday(employeeId: string) {
    try {
      // Obtener la fecha de hoy (sin hora)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const response = await this.getClockHistory({
        employeeId,
        startDate: today.toISOString(),
        clockType: "salida",
      })

      return response.success && response.data.length > 0
    } catch (error) {
      console.error("Error en hasCheckedOutToday:", error)
      return false
    }
  },
}

