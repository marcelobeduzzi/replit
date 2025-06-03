
import { supabase } from './supabase/client'

export interface LiquidationPayment {
  id: string
  employee_id: string
  amount: number
  date: string
  concept: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface PendingLiquidation {
  id: string
  employee_id: string
  termination_date: string
  worked_days: number
  proportional_vacation: number
  proportional_bonus: number
  compensation_amount: number
  total_amount: number
  include_vacation: boolean
  include_bonus: boolean
  processed: boolean
  processed_at?: string
  created_at: string
  updated_at: string
}

class LiquidationPaymentsService {
  
  /**
   * Obtiene liquidaciones pendientes (processed = false)
   */
  async getPendingLiquidations(): Promise<PendingLiquidation[]> {
    try {
      const { data, error } = await supabase
        .from('liquidations')
        .select(`
          *,
          employees (
            first_name,
            last_name,
            document_number
          )
        `)
        .eq('is_paid', false)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error obteniendo liquidaciones pendientes:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error en getPendingLiquidations:', error)
      throw error
    }
  }

  /**
   * Confirma el pago de una liquidación
   */
  async confirmLiquidationPayment(
    liquidationId: string,
    paymentData: {
      amount: number
      date: string
      concept: string
      notes?: string
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Confirmando pago de liquidación: ${liquidationId}`)

      // 1. Obtener datos de la liquidación
      const { data: liquidation, error: liquidationError } = await supabase
        .from('liquidations')
        .select('employee_id, total_amount')
        .eq('id', liquidationId)
        .single()

      if (liquidationError || !liquidation) {
        console.error('Error obteniendo liquidación:', liquidationError)
        return { success: false, error: 'Liquidación no encontrada' }
      }

      // 2. Crear registro en liquidation_payments
      const { error: paymentError } = await supabase
        .from('liquidation_payments')
        .insert([{
          employee_id: liquidation.employee_id,
          amount: paymentData.amount,
          date: paymentData.date,
          concept: paymentData.concept,
          notes: paymentData.notes || null
        }])

      if (paymentError) {
        console.error('Error creando registro de pago:', paymentError)
        return { success: false, error: 'Error al registrar el pago' }
      }

      // 3. Marcar liquidación como pagada
      const { error: updateError } = await supabase
        .from('liquidations')
        .update({
          is_paid: true,
          payment_date: paymentData.date,
          payment_method: 'transferencia', // Por defecto para liquidaciones
          updated_at: new Date().toISOString()
        })
        .eq('id', liquidationId)

      if (updateError) {
        console.error('Error actualizando liquidación:', updateError)
        return { success: false, error: 'Error al actualizar liquidación' }
      }

      console.log('✅ Pago de liquidación confirmado exitosamente')
      return { success: true }

    } catch (error: any) {
      console.error('Error en confirmLiquidationPayment:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Obtiene historial de pagos de liquidaciones
   */
  async getLiquidationPaymentsHistory(): Promise<LiquidationPayment[]> {
    try {
      const { data, error } = await supabase
        .from('liquidation_payments')
        .select(`
          *,
          employees (
            first_name,
            last_name,
            document_number
          )
        `)
        .order('date', { ascending: false })

      if (error) {
        console.error('Error obteniendo historial de liquidaciones:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error en getLiquidationPaymentsHistory:', error)
      throw error
    }
  }

  /**
   * Genera liquidaciones automáticamente para empleados inactivos
   */
  async generateLiquidations(inactiveEmployees: any[]): Promise<{ generated: number; updated: number; skipped: number }> {
    try {
      let generated = 0
      let updated = 0
      let skipped = 0

      for (const employee of inactiveEmployees) {
        try {
          // Verificar si ya existe liquidación para este empleado
          const { data: existingLiquidation } = await supabase
            .from('liquidations')
            .select('id, is_paid')
            .eq('employee_id', employee.id)
            .single()

          if (existingLiquidation) {
            if (existingLiquidation.is_paid) {
              skipped++
              continue
            } else {
              // Actualizar liquidación existente no pagada
              await this.updateExistingLiquidation(existingLiquidation.id, employee)
              updated++
              continue
            }
          }

          // Crear nueva liquidación
          await this.createNewLiquidation(employee)
          generated++

        } catch (error) {
          console.error(`Error procesando liquidación para empleado ${employee.id}:`, error)
          skipped++
        }
      }

      return { generated, updated, skipped }
    } catch (error) {
      console.error('Error en generateLiquidations:', error)
      throw error
    }
  }

  private async createNewLiquidation(employee: any) {
    // Calcular valores de liquidación
    const terminationDate = new Date(employee.termination_date || employee.terminationDate)
    const hireDate = new Date(employee.hire_date || employee.hireDate)
    const baseSalary = Number(employee.base_salary || employee.baseSalary || 0)

    // Calcular días trabajados en el último mes
    const today = new Date()
    const daysInLastMonth = terminationDate.getDate()
    const workedDays = Math.min(daysInLastMonth, 30)

    // Calcular vacaciones proporcionales (días de vacaciones * salario diario)
    const vacationDays = this.calculateVacationDays(hireDate, terminationDate)
    const proportionalVacation = (baseSalary / 30) * vacationDays

    // Calcular aguinaldo proporcional
    const monthsWorked = this.calculateMonthsWorked(hireDate, terminationDate)
    const proportionalBonus = (baseSalary / 12) * monthsWorked

    // Calcular indemnización (1 mes por año trabajado)
    const yearsWorked = Math.floor(monthsWorked / 12)
    const compensationAmount = baseSalary * yearsWorked

    // Total inicial
    const totalAmount = proportionalVacation + proportionalBonus + compensationAmount

    const liquidationData = {
      employee_id: employee.id,
      termination_date: terminationDate.toISOString().split('T')[0],
      worked_days: workedDays,
      proportional_vacation: proportionalVacation,
      proportional_bonus: proportionalBonus,
      compensation_amount: compensationAmount,
      total_amount: totalAmount,
      include_vacation: true,
      include_bonus: true,
      is_paid: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('liquidations')
      .insert([liquidationData])

    if (error) {
      throw error
    }
  }

  private async updateExistingLiquidation(liquidationId: string, employee: any) {
    // Lógica similar a createNewLiquidation pero para actualizar
    const terminationDate = new Date(employee.termination_date || employee.terminationDate)
    const hireDate = new Date(employee.hire_date || employee.hireDate)
    const baseSalary = Number(employee.base_salary || employee.baseSalary || 0)

    const daysInLastMonth = terminationDate.getDate()
    const workedDays = Math.min(daysInLastMonth, 30)

    const vacationDays = this.calculateVacationDays(hireDate, terminationDate)
    const proportionalVacation = (baseSalary / 30) * vacationDays

    const monthsWorked = this.calculateMonthsWorked(hireDate, terminationDate)
    const proportionalBonus = (baseSalary / 12) * monthsWorked

    const yearsWorked = Math.floor(monthsWorked / 12)
    const compensationAmount = baseSalary * yearsWorked

    const totalAmount = proportionalVacation + proportionalBonus + compensationAmount

    const { error } = await supabase
      .from('liquidations')
      .update({
        termination_date: terminationDate.toISOString().split('T')[0],
        worked_days: workedDays,
        proportional_vacation: proportionalVacation,
        proportional_bonus: proportionalBonus,
        compensation_amount: compensationAmount,
        total_amount: totalAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', liquidationId)

    if (error) {
      throw error
    }
  }

  private calculateVacationDays(hireDate: Date, terminationDate: Date): number {
    const monthsWorked = this.calculateMonthsWorked(hireDate, terminationDate)
    return Math.floor((monthsWorked / 12) * 14) // 14 días de vacaciones por año
  }

  private calculateMonthsWorked(hireDate: Date, terminationDate: Date): number {
    const diffTime = Math.abs(terminationDate.getTime() - hireDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.floor(diffDays / 30) // Aproximación en meses
  }
}

export const liquidationPaymentsService = new LiquidationPaymentsService()
