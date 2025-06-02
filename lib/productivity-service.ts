export const productivityService = {
  // Calcular puntuación de productividad
  calculateProductivityScore(employeeData: any): number {
    // Pesos de cada factor en la puntuación final
    const weights = {
      salesPerHour: 0.35, // 35% - Ventas por hora
      attendance: 0.25, // 25% - Asistencia
      cashAccuracy: 0.15, // 15% - Precisión en caja
      stockAccuracy: 0.15, // 15% - Precisión en stock
      decomisosRate: 0.1, // 10% - Tasa de decomisos
    }

    // Normalizar cada métrica a una escala de 0-100
    const normalizedSales = Math.min(100, (employeeData.salesPerHour / 2000) * 100)
    const normalizedAttendance = employeeData.attendance
    const normalizedCashAccuracy = (employeeData.cashAccuracy - 95) * 20 // 95% = 0, 100% = 100
    const normalizedStockAccuracy = (employeeData.stockAccuracy - 95) * 20

    // Calcular tasa de decomisos (inversa, menos es mejor)
    const decomisosRate = employeeData.decomisosRate || 0
    const normalizedDecomisos = Math.max(0, 100 - (decomisosRate / 0.02) * 100) // 2% = 0, 0% = 100

    // Calcular puntuación ponderada
    const score =
      normalizedSales * weights.salesPerHour +
      normalizedAttendance * weights.attendance +
      normalizedCashAccuracy * weights.cashAccuracy +
      normalizedStockAccuracy * weights.stockAccuracy +
      normalizedDecomisos * weights.decomisosRate

    // Aplicar penalizaciones por alertas
    const alertPenalty = (employeeData.alerts || 0) * 5 // Cada alerta resta 5 puntos

    // Aplicar ajustes por factores externos
    let externalFactorAdjustment = 0

    // Ajuste por clima (si hay datos disponibles)
    if (employeeData.weatherImpact) {
      externalFactorAdjustment += employeeData.weatherImpact
    }

    // Ajuste por días festivos (si hay datos disponibles)
    if (employeeData.holidayImpact) {
      externalFactorAdjustment += employeeData.holidayImpact
    }

    // Calcular puntuación final
    const finalScore = Math.max(0, Math.min(100, score - alertPenalty + externalFactorAdjustment))

    return Math.round(finalScore)
  },

  // Obtener datos de productividad de la base de datos
  async getProductivityData(filters: any = {}) {
    try {
      // En una implementación real, esto obtendría datos de Supabase
      // Por ahora, usamos la API simulada
      const queryParams = new URLSearchParams()

      if (filters.location) {
        queryParams.append("location", filters.location)
      }

      if (filters.startDate) {
        queryParams.append("startDate", filters.startDate)
      }

      if (filters.endDate) {
        queryParams.append("endDate", filters.endDate)
      }

      const response = await fetch(`/api/productivity?${queryParams.toString()}`)
      return await response.json()
    } catch (error) {
      console.error("Error fetching productivity data:", error)
      throw error
    }
  },

  // Obtener datos del clima
  async getWeatherData(date: string, location = "Buenos Aires") {
    try {
      const response = await fetch(`/api/weather?date=${date}&location=${location}`)
      return await response.json()
    } catch (error) {
      console.error("Error fetching weather data:", error)
      return null
    }
  },

  // Obtener días festivos
  async getHolidays(startDate: string, endDate: string) {
    try {
      const response = await fetch(`/api/holidays?startDate=${startDate}&endDate=${endDate}`)
      return await response.json()
    } catch (error) {
      console.error("Error fetching holidays data:", error)
      return { holidays: [] }
    }
  },
}

