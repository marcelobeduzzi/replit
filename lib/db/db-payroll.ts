// Log distintivo para verificar que se está cargando el módulo de nóminas
console.log('💰 CARGANDO: Módulo de nóminas (lib/db/db-payroll.ts)');

import { DatabaseServiceBase } from "./db-core"
import { objectToCamelCase, objectToSnakeCase } from "../utils"
import type { Payroll, PayrollDetail } from "@/types"

// Extender los tipos para incluir campos adicionales
interface ExtendedPayroll extends Payroll {
  hasAttendanceBonus?: boolean;
  paymentType?: 'hand' | 'bank' | 'both' | 'all';
  employee?: {
    id: string;
    firstName?: string;
    lastName?: string;
    baseSalary?: number;
  };
  employeeName?: string;
  details?: PayrollDetail[];
}

interface ExtendedPayrollDetail extends PayrollDetail {
  description?: string;
}

interface PayrollWithDetails extends ExtendedPayroll {
  details: PayrollDetail[];
}

export class PayrollService extends DatabaseServiceBase {
  // Payroll methods
  async getPayrollByEmployeeId(employeeId: string) {
    const { data, error } = await this.supabase
      .from("payroll")
      .select("*")
      .eq("employee_id", employeeId)
      .order("period_start", { ascending: false })

    if (error) throw error
    return data.map((item: any) => objectToCamelCase(item))
  }

  // MODIFICADO: Método createPayroll para usar el salario base del empleado cuando no hay asistencias
  async createPayroll(payroll: Omit<ExtendedPayroll, "id">) {
    try {
      console.log("Datos originales recibidos en createPayroll:", payroll)

      // Si no se proporciona handSalary, obtener el salario base del empleado
      let handSalary = Number(payroll.handSalary || 0)
      const bankSalary = Number(payroll.bankSalary || 0)

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

      // IMPORTANTE: Asegurarse de que deductions y additions sean números
      const deductions = Number(payroll.deductions || 0)
      const additions = Number(payroll.additions || 0)
      const attendanceBonus = Number(payroll.attendanceBonus || 0)
      const hasAttendanceBonus = Boolean(payroll.hasAttendanceBonus)

      // Calcular el sueldo base como suma de handSalary y bankSalary
      const baseSalary = handSalary + bankSalary

      // Calcular el sueldo final en mano (handSalary - deductions + additions)
      // NOTA: El bono de asistencia se agrega después
      const finalHandSalary = handSalary - deductions + additions

      // Calcular el total a pagar (finalHandSalary + bankSalary + bono asistencia si aplica)
      const totalSalary = finalHandSalary + bankSalary + (hasAttendanceBonus ? attendanceBonus : 0)

      console.log("Valores calculados:", {
        handSalary,
        bankSalary,
        baseSalary,
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
        base_salary: baseSalary, // Usar el salario base calculado
        hand_salary: handSalary,
        bank_salary: bankSalary,
        deductions: deductions,
        additions: additions,
        attendance_bonus: attendanceBonus,
        has_attendance_bonus: hasAttendanceBonus,
        final_hand_salary: finalHandSalary,
        total_salary: totalSalary,
        // NO incluir is_paid ya que es columna generada
        is_paid_hand: false,
        is_paid_bank: false,
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

  async createPayrollDetail(detail: Omit<ExtendedPayrollDetail, "id">) {
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

  // MODIFICADO: Método getPayrollsByPeriod para asegurar cálculos correctos
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
        // Para nóminas pagadas, la base de datos calculará automáticamente is_paid=true
        // cuando tanto is_paid_hand como is_paid_bank sean true
        query = query.eq("is_paid", true)

        // Para nóminas pagadas, también filtramos por mes y año
        if (month && year) {
          query = query.eq("month", month).eq("year", year)
        }
      } else {
        // Para nóminas pendientes, buscamos donde is_paid=false
        // Esto será automáticamente false cuando al menos uno de is_paid_hand o is_paid_bank sea false
        query = query.eq("is_paid", false)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error al obtener nóminas:", error)
        throw error
      }

      console.log(`Total nóminas encontradas: ${data?.length || 0}`)

      // Convertir de snake_case a camelCase
      const payrolls = (data || []).map((item: any) => {
        const payroll = objectToCamelCase(item) as PayrollWithDetails

        // Obtener el salario base del empleado si está disponible
        const employeeBaseSalary = payroll.employee?.baseSalary ? Number(payroll.employee.baseSalary) : 0

        // Asegurarse de que los campos de salario tengan valores numéricos
        payroll.handSalary = Number(payroll.handSalary || 0)
        payroll.bankSalary = Number(payroll.bankSalary || 0)
        payroll.deductions = Number(payroll.deductions || 0)
        payroll.additions = Number(payroll.additions || 0)
        payroll.attendanceBonus = Number(payroll.attendanceBonus || 0)
        payroll.hasAttendanceBonus = Boolean(payroll.hasAttendanceBonus || false)

        // Si handSalary es 0, usar el salario base del empleado
        if (payroll.handSalary === 0 && employeeBaseSalary > 0) {
          payroll.handSalary = employeeBaseSalary
          console.log(`Usando salario base del empleado (${employeeBaseSalary}) para nómina ${payroll.id}`)
        }

        // Calcular el sueldo base como suma de handSalary y bankSalary
        payroll.baseSalary = payroll.handSalary + payroll.bankSalary

        // Calcular finalHandSalary sin incluir el bono de asistencia
        payroll.finalHandSalary = payroll.handSalary - payroll.deductions + payroll.additions

        // Calcular totalSalary incluyendo el bono de asistencia si aplica
        const bonusAmount = payroll.hasAttendanceBonus ? (payroll.attendanceBonus || 0) : 0
        payroll.totalSalary = payroll.finalHandSalary + payroll.bankSalary + bonusAmount

        // Convertir también los detalles
        if (payroll.details && Array.isArray(payroll.details)) {
          payroll.details = payroll.details.map((detail: any) => objectToCamelCase(detail) as PayrollDetail)
        }

        // Añadir nombre completo del empleado para facilitar la visualización
        if (payroll.employee) {
          // Corregir el mapeo: usar first_name y last_name de la base de datos
          const firstName = payroll.employee.firstName || payroll.employee.first_name || ""
          const lastName = payroll.employee.lastName || payroll.employee.last_name || ""
          payroll.employeeName = `${firstName} ${lastName}`.trim()
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

  // MODIFICADO: Método updatePayroll para asegurar cálculos correctos
  async updatePayroll(id: string, payroll: Partial<ExtendedPayroll>) {
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

      // Asegurarse de que los campos de salario tengan valores numéricos
      const handSalary = Number(payroll.handSalary || current.hand_salary || 0)
      const bankSalary = Number(payroll.bankSalary || current.bank_salary || 0)
      const deductions = Number(payroll.deductions || current.deductions || 0)
      const additions = Number(payroll.additions || current.additions || 0)
      const attendanceBonus = Number(payroll.attendanceBonus || current.attendance_bonus || 0)
      const hasAttendanceBonus = Boolean(payroll.hasAttendanceBonus ?? current.has_attendance_bonus)

      // Calcular el sueldo base como suma de handSalary y bankSalary
      const baseSalary = handSalary + bankSalary

      // Calcular finalHandSalary sin incluir el bono de asistencia
      const finalHandSalary = handSalary - deductions + additions

      // Calcular totalSalary incluyendo el bono de asistencia si aplica
      const totalSalary = finalHandSalary + bankSalary + (hasAttendanceBonus ? attendanceBonus : 0)

      // Crear objeto de actualización con los valores actuales
      const updateData: any = {
        updated_at: new Date().toISOString(),
      }

      // Si se proporciona un objeto de pago, procesar los campos relacionados con el pago
      if (payroll.paymentType === "bank" || payroll.bankSalaryPaid) {
        // Pago de banco
        updateData.is_paid_bank = true
        updateData.bank_payment_date = new Date().toISOString()
        console.log("Marcando pago de banco como completado")
      }

      if (payroll.paymentType === "hand" || payroll.handSalaryPaid) {
        // Pago en mano
        updateData.is_paid_hand = true
        updateData.hand_payment_date = new Date().toISOString()
        console.log("Marcando pago en mano como completado")
      }

      if (payroll.paymentType === "all" || payroll.paymentType === "both") {
        // Pago total (banco y mano)
        updateData.is_paid_bank = true
        updateData.is_paid_hand = true
        updateData.bank_payment_date = new Date().toISOString()
        updateData.hand_payment_date = new Date().toISOString()
        console.log("Marcando ambos pagos como completados")
      }

      // IMPORTANTE: Nunca tocar is_paid ya que es una columna generada
      // La base de datos calculará automáticamente is_paid = (is_paid_hand AND is_paid_bank)

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
      const payroll = objectToCamelCase(data) as PayrollWithDetails
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
   * Verifica si una nómina está completamente pagada
   * Este método verifica el estado calculado de is_paid
   * @param payrollId ID de la nómina
   * @returns true si está completamente pagada
   */
  async isPayrollFullyPaid(payrollId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from("payroll")
        .select("is_paid, is_paid_hand, is_paid_bank")
        .eq("id", payrollId)
        .single()

      if (error) {
        console.error("Error al verificar estado de pago:", error)
        return false
      }

      // Verificar tanto el valor calculado como los componentes individuales
      const isFullyPaid = data.is_paid && data.is_paid_hand && data.is_paid_bank
      
      console.log(`Nómina ${payrollId} - Estado de pago:`, {
        is_paid: data.is_paid,
        is_paid_hand: data.is_paid_hand,
        is_paid_bank: data.is_paid_bank,
        fully_paid: isFullyPaid
      })

      return isFullyPaid
    } catch (error) {
      console.error("Error al verificar estado de pago:", error)
      return false
    }
  }
}

// Crear una instancia del servicio
export const payrollService = new PayrollService()