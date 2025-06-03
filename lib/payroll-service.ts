
import { supabase } from './supabase/client'
import { payrollService as dbPayroll } from './db/db-payroll'
import { dbEmployees } from './db/db-employees'
import { dbAttendance } from './db/db-attendance'

export interface PayrollCalculation {
  employeeId: string
  baseSalary: number
  handSalary: number
  bankSalary: number
  additions: number
  deductions: number
  finalHandSalary: number
  finalBankSalary: number
  totalSalary: number
  presentismBonus: number
  attendanceData: any[]
}

export interface PayrollRecord {
  id: string
  employee_id: string
  period: string
  base_salary: number
  hand_salary: number
  bank_salary: number
  additions: number
  deductions: number
  final_hand_salary: number
  final_bank_salary: number
  total_salary: number
  presentism_bonus: number
  status: string
  created_at: string
  updated_at: string
}

class PayrollService {
  // Constantes para cálculos
  private readonly MINUTE_VALUE = 100 // Valor por minuto en pesos
  private readonly PRESENTISM_BONUS_RATE = 0.05 // 5% de bono por presentismo
  private readonly PRESENTISM_THRESHOLD = 0.95 // 95% de asistencia mínima

  /**
   * Genera nóminas para todos los empleados activos
   */
  async generatePayroll(period: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      console.log(`🔄 Iniciando generación de nóminas para el período: ${period}`)

      // 1. Obtener empleados activos
      const activeEmployees = await this.getActiveEmployees()
      if (!activeEmployees || activeEmployees.length === 0) {
        return { 
          success: false, 
          error: 'No se encontraron empleados activos para generar nóminas' 
        }
      }

      console.log(`👥 Empleados activos encontrados: ${activeEmployees.length}`)

      // 2. Verificar si ya existen nóminas para este período
      const existingPayroll = await dbPayroll.getPayrollByPeriod(period)
      if (existingPayroll && existingPayroll.length > 0) {
        return { 
          success: false, 
          error: `Ya existen nóminas generadas para el período ${period}. Use "Regenerar Nómina" si desea recrearlas.` 
        }
      }

      // 3. Calcular nóminas para cada empleado
      const payrollCalculations: PayrollCalculation[] = []
      
      for (const employee of activeEmployees) {
        try {
          const calculation = await this.calculateEmployeePayroll(employee, period)
          payrollCalculations.push(calculation)
          console.log(`✅ Nómina calculada para: ${employee.first_name} ${employee.last_name}`)
        } catch (error) {
          console.error(`❌ Error calculando nómina para empleado ${employee.id}:`, error)
          // Continuar con el siguiente empleado en lugar de fallar completamente
        }
      }

      if (payrollCalculations.length === 0) {
        return { 
          success: false, 
          error: 'No se pudieron calcular nóminas para ningún empleado' 
        }
      }

      // 4. Guardar nóminas en la base de datos
      const savedPayroll = await this.savePayrollRecords(payrollCalculations, period)

      console.log(`💾 Nóminas guardadas exitosamente: ${savedPayroll.length} registros`)

      return { 
        success: true, 
        data: savedPayroll 
      }

    } catch (error: any) {
      console.error('❌ Error en generatePayroll:', error)
      return { 
        success: false, 
        error: `Error interno: ${error.message}` 
      }
    }
  }

  /**
   * Regenera nóminas (elimina las existentes y crea nuevas)
   */
  async regeneratePayroll(period: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      console.log(`🔄 Regenerando nóminas para el período: ${period}`)

      // 1. Eliminar nóminas existentes del período
      await dbPayroll.deletePayrollByPeriod(period)
      console.log(`🗑️ Nóminas existentes eliminadas para el período: ${period}`)

      // 2. Generar nuevas nóminas
      return await this.generatePayroll(period)

    } catch (error: any) {
      console.error('❌ Error en regeneratePayroll:', error)
      return { 
        success: false, 
        error: `Error al regenerar nóminas: ${error.message}` 
      }
    }
  }

  /**
   * Obtiene empleados activos
   */
  private async getActiveEmployees() {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('status', 'active')

      if (error) {
        console.error('Error obteniendo empleados activos:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error en getActiveEmployees:', error)
      throw error
    }
  }

  /**
   * Calcula la nómina para un empleado específico
   */
  private async calculateEmployeePayroll(employee: any, period: string): Promise<PayrollCalculation> {
    try {
      // 1. Obtener datos de asistencia del período
      const attendanceData = await this.getEmployeeAttendance(employee.id, period)

      // 2. Calcular deducciones por faltas y llegadas tarde
      const deductions = this.calculateDeductions(attendanceData, employee.hand_salary)

      // 3. Calcular adiciones por feriados trabajados
      const additions = this.calculateAdditions(attendanceData, employee.hand_salary)

      // 4. Calcular bono por presentismo
      const presentismBonus = this.calculatePresentismBonus(attendanceData, employee.hand_salary)

      // 5. Calcular salarios finales
      const finalHandSalary = Math.max(0, employee.hand_salary + additions - deductions + presentismBonus)
      const finalBankSalary = employee.bank_salary || 0
      const totalSalary = finalHandSalary + finalBankSalary

      return {
        employeeId: employee.id,
        baseSalary: (employee.hand_salary || 0) + (employee.bank_salary || 0),
        handSalary: employee.hand_salary || 0,
        bankSalary: employee.bank_salary || 0,
        additions,
        deductions,
        finalHandSalary,
        finalBankSalary,
        totalSalary,
        presentismBonus,
        attendanceData
      }

    } catch (error) {
      console.error(`Error calculando nómina para empleado ${employee.id}:`, error)
      throw error
    }
  }

  /**
   * Obtiene registros de asistencia para un empleado en un período
   */
  private async getEmployeeAttendance(employeeId: string, period: string) {
    try {
      // Extraer año y mes del período (formato: YYYY-MM)
      const [year, month] = period.split('-')
      const startDate = `${year}-${month}-01`
      const endDate = `${year}-${month}-31`

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('date', startDate)
        .lte('date', endDate)

      if (error) {
        console.error('Error obteniendo asistencias:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error en getEmployeeAttendance:', error)
      return []
    }
  }

  /**
   * Calcula deducciones por faltas y llegadas tarde
   */
  private calculateDeductions(attendanceData: any[], handSalary: number): number {
    let totalDeductions = 0

    attendanceData.forEach(record => {
      // Deducción por llegadas tarde
      if (record.late_minutes && record.late_minutes > 0) {
        totalDeductions += record.late_minutes * this.MINUTE_VALUE
      }

      // Deducción por faltas (día completo)
      if (record.status === 'absent') {
        // Calcular deducción proporcional por día (asumiendo 8 horas = 480 minutos por día)
        const dailyDeduction = (handSalary / 30) // Deducción por día (salario mensual / 30 días)
        totalDeductions += dailyDeduction
      }
    })

    return Math.round(totalDeductions)
  }

  /**
   * Calcula adiciones por feriados trabajados
   */
  private calculateAdditions(attendanceData: any[], handSalary: number): number {
    let totalAdditions = 0

    attendanceData.forEach(record => {
      // Adición por trabajar en feriados
      if (record.is_holiday && record.status === 'present') {
        // Pago doble por trabajar en feriado
        const dailyRate = handSalary / 30
        totalAdditions += dailyRate
      }

      // Adiciones por horas extra si existen
      if (record.extra_hours && record.extra_hours > 0) {
        const hourlyRate = handSalary / (30 * 8) // Salario por hora
        totalAdditions += record.extra_hours * hourlyRate * 1.5 // 50% extra por horas adicionales
      }
    })

    return Math.round(totalAdditions)
  }

  /**
   * Calcula bono por presentismo
   */
  private calculatePresentismBonus(attendanceData: any[], handSalary: number): number {
    if (attendanceData.length === 0) return 0

    const totalWorkDays = attendanceData.length
    const presentDays = attendanceData.filter(record => record.status === 'present').length
    const attendanceRate = presentDays / totalWorkDays

    // Solo aplicar bono si la asistencia supera el umbral
    if (attendanceRate >= this.PRESENTISM_THRESHOLD) {
      return Math.round(handSalary * this.PRESENTISM_BONUS_RATE)
    }

    return 0
  }

  /**
   * Guarda los registros de nómina en la base de datos
   */
  private async savePayrollRecords(calculations: PayrollCalculation[], period: string) {
    const payrollRecords = calculations.map(calc => ({
      employee_id: calc.employeeId,
      period,
      base_salary: calc.baseSalary,
      hand_salary: calc.handSalary,
      bank_salary: calc.bankSalary,
      additions: calc.additions,
      deductions: calc.deductions,
      final_hand_salary: calc.finalHandSalary,
      final_bank_salary: calc.finalBankSalary,
      total_salary: calc.totalSalary,
      presentism_bonus: calc.presentismBonus,
      is_paid_hand: false,
      is_paid_bank: false,
      status: 'pending',
      payment_method: 'pending',
      payment_reference: null,
      paid_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('payroll')
      .insert(payrollRecords)
      .select()

    if (error) {
      console.error('Error guardando nóminas:', error)
      throw error
    }

    return data
  }

  /**
   * Confirma el pago de una nómina
   */
  async confirmPayment(
    payrollId: string, 
    paymentMethod: string, 
    paymentReference?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('payroll')
        .update({
          status: 'paid',
          payment_method: paymentMethod,
          payment_reference: paymentReference || null,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', payrollId)

      if (error) {
        console.error('Error confirmando pago:', error)
        return { success: false, error: error.message }
      }

      // Verificar si la nómina está completamente pagada después de la actualización
      const isFullyPaid = await dbPayroll.isPayrollFullyPaid(payrollId)
      
      if (isFullyPaid) {
        console.log(`✅ Nómina ${payrollId} completamente pagada, agregando al historial`)
        await this.addToPaymentHistory(payrollId, paymentMethod, paymentReference)
      } else {
        console.log(`⏳ Nómina ${payrollId} parcialmente pagada, aún pendiente`)
      }

      return { success: true }

    } catch (error: any) {
      console.error('Error en confirmPayment:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Agrega el pago al historial
   */
  private async addToPaymentHistory(payrollId: string, paymentMethod: string, paymentReference?: string) {
    try {
      // Obtener datos de la nómina
      const { data: payrollData, error } = await supabase
        .from('payroll')
        .select(`
          *,
          employees (
            first_name,
            last_name,
            document_number
          )
        `)
        .eq('id', payrollId)
        .single()

      if (error || !payrollData) {
        console.error('Error obteniendo datos de nómina para historial:', error)
        return
      }

      // Insertar en historial de pagos
      const historyRecord = {
        payroll_id: payrollId,
        employee_id: payrollData.employee_id,
        period: payrollData.period,
        amount: payrollData.total_salary,
        payment_method: paymentMethod,
        payment_reference: paymentReference || null,
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }

      const { error: historyError } = await supabase
        .from('payment_history')
        .insert(historyRecord)

      if (historyError) {
        console.error('Error guardando en historial de pagos:', historyError)
      }

    } catch (error) {
      console.error('Error en addToPaymentHistory:', error)
    }
  }

  /**
   * Obtiene nóminas por período
   */
  async getPayrollByPeriod(period: string) {
    return await dbPayroll.getPayrollByPeriod(period)
  }

  /**
   * Obtiene nóminas con datos de empleados
   */
  async getPayrollWithEmployees(period?: string) {
    try {
      let query = supabase
        .from('payroll')
        .select(`
          *,
          employees (
            first_name,
            last_name,
            document_number,
            position,
            hire_date
          )
        `)
        .order('created_at', { ascending: false })

      if (period) {
        query = query.eq('period', period)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error obteniendo nóminas con empleados:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error en getPayrollWithEmployees:', error)
      throw error
    }
  }

  /**
   * Obtiene empleados activos
   */
  async getEmployees(employeeIds?: string[]) {
    try {
      let query = supabase
        .from('employees')
        .select('*')
        .eq('status', 'active')
        .order('first_name')

      if (employeeIds && employeeIds.length > 0) {
        query = query.in('id', employeeIds)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error obteniendo empleados:', error)
        throw error
      }

      // Asegurar que los nombres estén mapeados correctamente para compatibilidad
      const mappedData = (data || []).map(employee => ({
        ...employee,
        firstName: employee.first_name,
        lastName: employee.last_name,
      }))

      return mappedData
    } catch (error) {
      console.error('Error en getEmployees:', error)
      throw error
    }
  }

  /**
   * Obtiene nóminas por período (wrapper para compatibilidad)
   */
  async getPayrolls(month: number, year: number, isPaid = false) {
    try {
      return await dbPayroll.getPayrollsByPeriod(month, year, isPaid)
    } catch (error) {
      console.error('Error en getPayrolls:', error)
      throw error
    }
  }

  /**
   * Genera nóminas para empleados en batch
   */
  async generatePayrolls(employeeIds: string[], month: number, year: number) {
    try {
      console.log(`Generando nóminas para ${employeeIds.length} empleados: ${month}/${year}`)
      
      const generatedPayrolls = []
      let successCount = 0
      let errorCount = 0

      for (const employeeId of employeeIds) {
        try {
          console.log(`Generando nómina para empleado: ${employeeId}`)
          
          // 1. Obtener datos del empleado
          const { data: employee, error: empError } = await supabase
            .from('employees')
            .select('*')
            .eq('id', employeeId)
            .single()

          if (empError || !employee) {
            console.error(`Error obteniendo empleado ${employeeId}:`, empError)
            errorCount++
            continue
          }

          // 2. Verificar si ya existe nómina para este período
          const { data: existingPayroll } = await supabase
            .from('payroll')
            .select('id')
            .eq('employee_id', employeeId)
            .eq('month', month)
            .eq('year', year)
            .single()

          if (existingPayroll) {
            console.log(`Nómina ya existe para empleado ${employeeId} en ${month}/${year}`)
            continue
          }

          // 3. Obtener asistencias del período
          const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
          const endDate = new Date(year, month, 0).toISOString().split('T')[0]

          const { data: attendances } = await supabase
            .from('attendance')
            .select('*')
            .eq('employee_id', employeeId)
            .gte('date', startDate)
            .lte('date', endDate)

          // 4. Calcular valores de nómina
          const handSalary = Number(employee.base_salary || 0)
          const bankSalary = Number(employee.bank_salary || 0)
          
          // Calcular deducciones y adiciones basadas en asistencias
          let deductions = 0
          let additions = 0
          
          if (attendances && attendances.length > 0) {
            // Calcular deducciones por faltas y llegadas tarde
            for (const attendance of attendances) {
              if (attendance.is_absent && !attendance.is_justified) {
                // Deducción por día completo
                deductions += handSalary / 30
              }
              if (attendance.late_minutes > 0) {
                // Deducción por minutos tarde (valor por minuto)
                deductions += attendance.late_minutes * 100
              }
              if (attendance.early_departure_minutes > 0) {
                // Deducción por salida anticipada
                deductions += attendance.early_departure_minutes * 100
              }
              if (attendance.extra_minutes > 0) {
                // Adición por horas extra
                const hourlyRate = handSalary / (30 * 8)
                additions += (attendance.extra_minutes / 60) * hourlyRate * 1.5
              }
              if (attendance.is_holiday && !attendance.is_absent) {
                // Adición por trabajar en feriado
                additions += handSalary / 30
              }
            }
          }

          // 5. Calcular salarios finales
          const finalHandSalary = Math.max(0, handSalary - deductions + additions)
          const totalSalary = finalHandSalary + bankSalary

          // 6. Crear registro de nómina
          const payrollData = {
            employee_id: employeeId,
            month: month,
            year: year,
            base_salary: handSalary,
            hand_salary: handSalary,
            bank_salary: bankSalary,
            deductions: Math.round(deductions),
            additions: Math.round(additions),
            final_hand_salary: Math.round(finalHandSalary),
            total_salary: Math.round(totalSalary),
            is_paid_hand: false,
            is_paid_bank: false,
            has_attendance_bonus: false,
            attendance_bonus: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          const { data: newPayroll, error: payrollError } = await supabase
            .from('payroll')
            .insert([payrollData])
            .select()
            .single()

          if (payrollError) {
            console.error(`Error creando nómina para empleado ${employeeId}:`, payrollError)
            errorCount++
            continue
          }

          generatedPayrolls.push(newPayroll)
          successCount++
          console.log(`✅ Nómina creada para empleado ${employeeId}: Total ${totalSalary}`)

        } catch (error) {
          console.error(`Error generando nómina para empleado ${employeeId}:`, error)
          errorCount++
        }
      }

      console.log(`Generación completada: ${successCount} exitosas, ${errorCount} errores`)
      return { 
        success: true, 
        generated: successCount, 
        errors: errorCount,
        payrolls: generatedPayrolls 
      }

    } catch (error) {
      console.error('Error en generatePayrolls:', error)
      throw error
    }
  }

  /**
   * Regenera nóminas (forzar recreación)
   */
  async forceRegeneratePayrolls(employeeIds: string[], month: number, year: number) {
    try {
      console.log(`Regenerando nóminas para ${employeeIds.length} empleados: ${month}/${year}`)
      
      // 1. Eliminar detalles de nómina existentes primero
      const { data: existingPayrolls } = await supabase
        .from('payroll')
        .select('id')
        .eq('month', month)
        .eq('year', year)
        .in('employee_id', employeeIds)

      if (existingPayrolls && existingPayrolls.length > 0) {
        const payrollIds = existingPayrolls.map(p => p.id)
        
        // Eliminar detalles de nómina
        const { error: detailsError } = await supabase
          .from('payroll_details')
          .delete()
          .in('payroll_id', payrollIds)

        if (detailsError) {
          console.error('Error eliminando detalles de nóminas:', detailsError)
        }

        console.log(`Eliminados detalles de ${payrollIds.length} nóminas existentes`)
      }

      // 2. Eliminar nóminas existentes para el período
      const { error: deleteError } = await supabase
        .from('payroll')
        .delete()
        .eq('month', month)
        .eq('year', year)
        .in('employee_id', employeeIds)

      if (deleteError) {
        console.error('Error eliminando nóminas existentes:', deleteError)
        throw deleteError
      }

      console.log(`Eliminadas nóminas existentes para ${employeeIds.length} empleados`)

      // 3. Generar nuevas nóminas
      return await this.generatePayrolls(employeeIds, month, year)
    } catch (error) {
      console.error('Error en forceRegeneratePayrolls:', error)
      throw error
    }
  }

  /**
   * Actualiza el estado de pago de una nómina
   */
  async updatePayrollStatus(payrollId: string, field: string, value: any) {
    try {
      const updateData = {
        [field]: value,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('payroll')
        .update(updateData)
        .eq('id', payrollId)
        .select()
        .single()

      if (error) {
        console.error('Error actualizando estado de pago:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error en updatePayrollStatus:', error)
      throw error
    }
  }

  /**
   * Actualiza los detalles de pago de una nómina
   */
  async updatePaymentDetails(payrollId: string, paymentMethod: string, paymentReference?: string) {
    try {
      const updateData = {
        payment_method: paymentMethod,
        payment_reference: paymentReference || null,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('payroll')
        .update(updateData)
        .eq('id', payrollId)
        .select()
        .single()

      if (error) {
        console.error('Error actualizando detalles de pago:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error en updatePaymentDetails:', error)
      throw error
    }
  }
}

export const payrollService = new PayrollService()
