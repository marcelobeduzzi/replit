import { supabase } from './supabase/client'
import { payrollService as dbPayrollService } from './db/db-payroll'
import { DatabaseServiceBase } from './db/db-core'
import type { Employee, Payroll, Attendance } from '@/types'

interface PayrollCalculationResult {
  baseSalary: number
  bankSalary: number
  handSalary: number
  deductions: number
  additions: number
  finalHandSalary: number
  totalSalary: number
}

interface EmployeeCache {
  [key: string]: Employee & { lastFetch?: number }
}

interface PayrollCache {
  [key: string]: { data: Payroll[], lastFetch: number }
}

class PayrollService extends DatabaseServiceBase {
  private employeeCache: EmployeeCache = {}
  private payrollCache: PayrollCache = {}
  private cacheExpiry: number = 5 * 60 * 1000 // 5 minutos

  /**
   * Obtiene empleados con cache optimizado
   */
  async getEmployees(excludeIds: string[] = []): Promise<Employee[]> {
    try {
      console.log('PayrollService - Obteniendo empleados activos...')
      const cacheKey = 'all_employees'
      const now = Date.now()

      // Verificar cache
      if (this.employeeCache[cacheKey] && this.employeeCache[cacheKey].lastFetch && (now - this.employeeCache[cacheKey].lastFetch!) < this.cacheExpiry) {
        console.log('PayrollService - Usando empleados desde cache')
        const cachedEmployees = Object.values(this.employeeCache).filter(emp => 
          emp.id && !excludeIds.includes(emp.id)
        )
        console.log(`PayrollService - Empleados en cache: ${cachedEmployees.length}`)
        return cachedEmployees
      }

      // Obtener empleados frescos usando supabase directamente
      console.log('PayrollService - Consultando empleados desde la base de datos...')
      const { data: employees, error } = await this.supabase
        .from('employees')
        .select('*')
        .eq('status', 'active')

      if (error) {
        console.error('PayrollService - Error al obtener empleados:', error)
        throw error
      }

      console.log(`PayrollService - Empleados obtenidos de la DB: ${employees?.length || 0}`)
      
      if (employees && employees.length > 0) {
        console.log('PayrollService - Primeros empleados encontrados:', 
          employees.slice(0, 3).map(emp => ({ 
            id: emp.id, 
            name: `${emp.first_name} ${emp.last_name}`,
            status: emp.status 
          }))
        )
      } else {
        console.warn('PayrollService - No se encontraron empleados activos en la base de datos')
      }

      // Actualizar cache
      if (employees) {
        employees.forEach(emp => {
          this.employeeCache[emp.id] = { ...emp, lastFetch: now }
        })
      }

      const filteredEmployees = (employees || []).filter(emp => !excludeIds.includes(emp.id))
      console.log(`PayrollService - Empleados después de filtrar: ${filteredEmployees.length}`)
      
      return filteredEmployees
    } catch (error) {
      console.error('PayrollService - Error al obtener empleados:', error)
      throw error
    }
  }

  /**
   * Obtiene nóminas con cache optimizado
   */
  async getPayrolls(month: number, year: number, isPaid: boolean = false): Promise<Payroll[]> {
    try {
      const cacheKey = `payrolls_${month}_${year}_${isPaid}`
      const now = Date.now()

      // Verificar cache
      if (this.payrollCache[cacheKey] && (now - this.payrollCache[cacheKey].lastFetch) < this.cacheExpiry) {
        console.log(`Usando nóminas desde cache para ${month}/${year}`)
        return this.payrollCache[cacheKey].data
      }

      // Obtener nóminas frescas usando el servicio de db-payroll
      const payrolls = await dbPayrollService.getPayrollsByPeriod(month, year, isPaid)

      // Actualizar cache
      this.payrollCache[cacheKey] = { 
        data: payrolls, 
        lastFetch: now 
      }

      return payrolls
    } catch (error) {
      console.error('Error al obtener nóminas:', error)
      throw error
    }
  }

  /**
   * Genera nóminas en batch optimizado
   */
  async generatePayrolls(employeeIds: string[], month: number, year: number): Promise<void> {
    try {
      console.log(`PayrollService - Iniciando generación de nóminas para ${employeeIds.length} empleados`)
      console.log(`PayrollService - IDs de empleados a procesar: ${employeeIds.slice(0, 5).join(', ')}${employeeIds.length > 5 ? '...' : ''}`)

      if (employeeIds.length === 0) {
        throw new Error('No se proporcionaron IDs de empleados para generar nóminas')
      }

      // Procesar en lotes de 5 empleados para evitar sobrecarga
      const batchSize = 5
      const batches = []

      for (let i = 0; i < employeeIds.length; i += batchSize) {
        batches.push(employeeIds.slice(i, i + batchSize))
      }

      console.log(`PayrollService - Procesando en ${batches.length} lotes de máximo ${batchSize} empleados`)

      let processedCount = 0
      let errorCount = 0

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        console.log(`PayrollService - Procesando lote ${i + 1}/${batches.length} con ${batch.length} empleados`)
        
        try {
          const results = await Promise.allSettled(
            batch.map(employeeId => this.generateSinglePayroll(employeeId, month, year))
          )

          // Contar resultados
          const successful = results.filter(r => r.status === 'fulfilled').length
          const failed = results.filter(r => r.status === 'rejected').length

          processedCount += successful
          errorCount += failed

          if (failed > 0) {
            console.warn(`PayrollService - Lote ${i + 1}: ${successful} exitosos, ${failed} fallidos`)
            results.forEach((result, index) => {
              if (result.status === 'rejected') {
                console.error(`PayrollService - Error en empleado ${batch[index]}:`, result.reason)
              }
            })
          } else {
            console.log(`PayrollService - Lote ${i + 1} procesado exitosamente`)
          }
        } catch (batchError) {
          console.error(`PayrollService - Error en el lote ${i + 1}:`, batchError)
          errorCount += batch.length
        }
      }

      // Limpiar cache para forzar recarga
      this.clearPayrollCache()

      console.log(`PayrollService - Generación completada: ${processedCount} exitosas, ${errorCount} fallidas`)
      
      if (errorCount > 0 && processedCount === 0) {
        throw new Error(`Falló la generación de todas las nóminas (${errorCount} errores)`)
      } else if (errorCount > 0) {
        console.warn(`PayrollService - Se completó con ${errorCount} errores de ${employeeIds.length} empleados`)
      }

    } catch (error) {
      console.error('PayrollService - Error en generación batch de nóminas:', error)
      throw error
    }
  }

  /**
   * Fuerza la regeneración de nóminas eliminando las existentes
   */
  async forceRegeneratePayrolls(employeeIds: string[], month: number, year: number): Promise<void> {
    try {
      console.log(`Regenerando nóminas para ${employeeIds.length} empleados`)

      // Eliminar nóminas existentes
      for (const employeeId of employeeIds) {
        await this.deleteExistingPayroll(employeeId, month, year)
      }

      // Generar nuevas nóminas
      await this.generatePayrolls(employeeIds, month, year)

      console.log('Regeneración de nóminas completada')
    } catch (error) {
      console.error('Error en regeneración de nóminas:', error)
      throw error
    }
  }

  /**
   * Elimina una nómina existente
   */
  private async deleteExistingPayroll(employeeId: string, month: number, year: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('payroll')
        .delete()
        .eq('employee_id', employeeId)
        .eq('month', month)
        .eq('year', year)

      if (error) {
        console.error(`Error al eliminar nómina existente para empleado ${employeeId}:`, error)
      }
    } catch (error) {
      console.error('Error al eliminar nómina:', error)
    }
  }

  /**
   * Genera una nómina individual
   */
  private async generateSinglePayroll(employeeId: string, month: number, year: number): Promise<void> {
    try {
      console.log(`PayrollService - Generando nómina individual para empleado ${employeeId}`)

      // Obtener empleado usando supabase directamente
      const { data: employee, error: empError } = await this.supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single()

      if (empError) {
        console.error(`PayrollService - Error al obtener empleado ${employeeId}:`, empError)
        throw new Error(`Error al obtener empleado ${employeeId}: ${empError.message}`)
      }

      if (!employee) {
        throw new Error(`Empleado ${employeeId} no encontrado`)
      }

      console.log(`PayrollService - Empleado obtenido: ${employee.first_name} ${employee.last_name}`)

      // Verificar si ya existe una nómina para este empleado en este período
      const existingPayrolls = await dbPayrollService.getPayrollsByEmployeeAndPeriod(employeeId, month, year)
      
      if (existingPayrolls && existingPayrolls.length > 0) {
        console.log(`PayrollService - Ya existe nómina para empleado ${employee.first_name} ${employee.last_name} en ${month}/${year}`)
        return // No generar duplicado
      }

      // Calcular nómina
      console.log(`PayrollService - Calculando nómina para ${employee.first_name} ${employee.last_name}`)
      const calculation = await this.calculatePayroll(employee, month, year)

      console.log(`PayrollService - Cálculos completados para ${employee.first_name}:`, {
        baseSalary: calculation.baseSalary,
        bankSalary: calculation.bankSalary,
        handSalary: calculation.handSalary,
        deductions: calculation.deductions,
        additions: calculation.additions,
        finalHandSalary: calculation.finalHandSalary,
        totalSalary: calculation.totalSalary
      })

      // Crear nómina usando el servicio de db-payroll
      const payrollData = {
        employeeId: employee.id,
        month,
        year,
        baseSalary: calculation.baseSalary,
        bankSalary: calculation.bankSalary,
        handSalary: calculation.handSalary,
        deductions: calculation.deductions,
        additions: calculation.additions,
        finalHandSalary: calculation.finalHandSalary,
        totalSalary: calculation.totalSalary,
        // No incluir isPaid - se manejará por is_paid_hand e is_paid_bank
      }

      console.log(`PayrollService - Creando nómina en la base de datos para ${employee.first_name}`)
      const createdPayroll = await dbPayrollService.createPayroll(payrollData)
      console.log(`PayrollService - Nómina generada exitosamente para empleado ${employee.first_name} ${employee.last_name} con ID: ${createdPayroll.id}`)

    } catch (error) {
      console.error(`PayrollService - Error al generar nómina para empleado ${employeeId}:`, error)
      throw error
    }
  }

  /**
   * Calcula la nómina de un empleado
   */
  private async calculatePayroll(employee: any, month: number, year: number): Promise<PayrollCalculationResult> {
    try {
      console.log(`Calculando nómina para ${employee.first_name} ${employee.last_name}`)

      // Obtener asistencias del período usando supabase directamente
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      const { data: attendances, error: attError } = await this.supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employee.id)
        .gte('date', startDateStr)
        .lte('date', endDateStr)

      if (attError) {
        console.error('Error al obtener asistencias:', attError)
      }

      // Valores base
      const baseSalary = Number(employee.base_salary || 0)
      const bankSalary = Number(employee.bank_salary || 0)
      const handSalary = baseSalary - bankSalary

      // Calcular ajustes basados en asistencias
      const adjustments = this.calculateAttendanceAdjustments(attendances || [], baseSalary)

      // Preparar resultado
      const result: PayrollCalculationResult = {
        baseSalary,
        bankSalary,
        handSalary,
        deductions: adjustments.deductions,
        additions: adjustments.additions,
        finalHandSalary: handSalary - adjustments.deductions + adjustments.additions,
        totalSalary: 0
      }

      // Calcular total
      result.totalSalary = result.finalHandSalary + result.bankSalary

      console.log(`Cálculo completado para ${employee.first_name}: Total ${result.totalSalary}`)
      return result

    } catch (error) {
      console.error('Error al calcular nómina:', error)
      throw error
    }
  }

  /**
   * Calcula ajustes basados en asistencias
   */
  private calculateAttendanceAdjustments(attendances: any[], baseSalary: number) {
    let totalDeductions = 0
    let totalAdditions = 0

    // Valor por minuto (salario mensual / 30 días / 8 horas / 60 minutos)
    const minuteValue = baseSalary / (30 * 8 * 60)

    // Procesar cada asistencia
    attendances.forEach(attendance => {
      // Ausencias injustificadas (descuento de día completo)
      if (attendance.is_absent && !attendance.is_justified) {
        const dailyDeduction = baseSalary / 30
        totalDeductions += dailyDeduction
      }

      // Llegadas tarde
      if (attendance.late_minutes > 0) {
        const lateDeduction = attendance.late_minutes * minuteValue
        totalDeductions += lateDeduction
      }

      // Salidas anticipadas
      if (attendance.early_departure_minutes > 0) {
        const earlyDeduction = attendance.early_departure_minutes * minuteValue
        totalDeductions += earlyDeduction
      }

      // Horas extra
      if (attendance.extra_minutes > 0) {
        const extraAddition = attendance.extra_minutes * minuteValue * 1.5 // 50% extra
        totalAdditions += extraAddition
      }

      // Feriados trabajados
      if (attendance.is_holiday && !attendance.is_absent) {
        const holidayAddition = baseSalary / 30 // Un día extra
        totalAdditions += holidayAddition
      }
    })

    return {
      deductions: Math.round(totalDeductions),
      additions: Math.round(totalAdditions)
    }
  }

  /**
   * Actualiza el estado de pago de una nómina
   */
  async updatePayrollStatus(payrollId: string, field: string, value: boolean): Promise<void> {
    try {
      const updateData: any = {
        [field]: value,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('payroll')
        .update(updateData)
        .eq('id', payrollId)

      if (error) {
        throw error
      }

      // Limpiar cache
      this.clearPayrollCache()

    } catch (error) {
      console.error('Error al actualizar estado de nómina:', error)
      throw error
    }
  }

  /**
   * Actualiza detalles de pago
   */
  async updatePaymentDetails(payrollId: string, method: string, reference: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('payroll')
        .update({
          payment_method: method,
          payment_reference: reference,
          payment_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', payrollId)

      if (error) {
        throw error
      }

      // Limpiar cache
      this.clearPayrollCache()

    } catch (error) {
      console.error('Error al actualizar detalles de pago:', error)
      throw error
    }
  }

  /**
   * Obtiene una nómina por ID
   */
  async getPayrollById(payrollId: string): Promise<Payroll | null> {
    try {
      return await dbPayrollService.getPayrollById(payrollId)
    } catch (error) {
      console.error('Error al obtener nómina por ID:', error)
      throw error
    }
  }

  /**
   * Limpia el cache de nóminas
   */
  private clearPayrollCache(): void {
    this.payrollCache = {}
    console.log('Cache de nóminas limpiado')
  }

  /**
   * Limpia el cache de empleados
   */
  private clearEmployeeCache(): void {
    this.employeeCache = {}
    console.log('Cache de empleados limpiado')
  }

  /**
   * Limpia todo el cache
   */
  clearCache(): void {
    this.clearPayrollCache()
    this.clearEmployeeCache()
  }
}

// Exportar instancia singleton
export const payrollService = new PayrollService()