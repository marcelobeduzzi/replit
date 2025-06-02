// Importar los servicios necesarios
import { dbService } from "@/lib/db-service"
import { supabase } from './supabase/client'
import type { Employee, Payroll } from '@/types'

// Sistema de logging seguro para navegador y servidor
const logger = {
  log: (...args: any[]) => {
    if (typeof console !== 'undefined' && console.log) {
      console.log(...args)
    }
  },
  error: (...args: any[]) => {
    if (typeof console !== 'undefined' && console.error) {
      console.error(...args)
    }
  },
  warn: (...args: any[]) => {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(...args)
    }
  }
}

// Cache para almacenar datos frecuentemente accedidos
const cache = {
  employees: new Map<string, Employee>(),
  payrolls: new Map<string, any[]>(),
  lastFetch: new Map<string, number>(),
  // Tiempo de expiración del cache (5 minutos)
  CACHE_TTL: 5 * 60 * 1000
}

// Limpiar cache expirado
const cleanExpiredCache = () => {
  const now = Date.now()
  for (const [key, timestamp] of cache.lastFetch.entries()) {
    if (now - timestamp > cache.CACHE_TTL) {
      cache.employees.delete(key)
      cache.payrolls.delete(key)
      cache.lastFetch.delete(key)
    }
  }
}

// Obtener empleados en batch
const getEmployeesBatch = async (employeeIds: string[]): Promise<Employee[]> => {
  const now = Date.now()
  const missingIds = employeeIds.filter(id => {
    const lastFetch = cache.lastFetch.get(id)
    return !lastFetch || now - lastFetch > cache.CACHE_TTL
  })

  if (missingIds.length > 0) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .in('id', missingIds)

    if (error) throw error

    // Actualizar cache
    (data as Employee[]).forEach((employee: Employee) => {
      cache.employees.set(employee.id, employee)
      cache.lastFetch.set(employee.id, now)
    })
  }

  return employeeIds.map(id => cache.employees.get(id)).filter(Boolean) as Employee[]
}

// Generar nóminas en batch
export const generatePayrollsBatch = async (
  employeeIds: string[],
  month: number,
  year: number
): Promise<void> => {
  // Limpiar cache expirado
  cleanExpiredCache()

  // Obtener empleados en batch
  const employees = await getEmployeesBatch(employeeIds)

  // Preparar datos para inserción en batch
  const payrollsToInsert = employees.map((employee: any) => ({
    employee_id: employee.id,
    month,
    year,
    base_salary: employee.base_salary || 0,
    bank_salary: employee.bank_salary || 0,
    hand_salary: (employee.base_salary || 0) - (employee.bank_salary || 0),
    final_hand_salary: (employee.base_salary || 0) - (employee.bank_salary || 0),
    total_salary: employee.base_salary || 0,
    deductions: 0,
    additions: 0,
    has_attendance_bonus: false,
    attendance_bonus: 0,
    is_paid: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))

  // Insertar nóminas en batch
  const { error } = await supabase
    .from('payrolls')
    .upsert(payrollsToInsert, {
      onConflict: 'employee_id,month,year',
      ignoreDuplicates: false
    })

  if (error) throw error

  // Actualizar cache de nóminas
  const cacheKey = `${month}-${year}`
  cache.payrolls.set(cacheKey, payrollsToInsert as any)
  cache.lastFetch.set(cacheKey, Date.now())
}

// Regenerar nóminas en batch (versión forzada)
export const forceRegeneratePayrollsBatch = async (
  employeeIds: string[],
  month: number,
  year: number
): Promise<void> => {
  // Primero eliminar nóminas existentes en batch
  const { error: deleteError } = await supabase
    .from('payrolls')
    .delete()
    .in('employee_id', employeeIds)
    .eq('month', month)
    .eq('year', year)

  if (deleteError) throw deleteError

  // Luego generar nuevas nóminas
  await generatePayrollsBatch(employeeIds, month, year)
}

// Obtener nóminas con cache
export const getPayrollsWithCache = async (
  month: number,
  year: number,
  includePaid: boolean = false
): Promise<any[]> => {
  const cacheKey = `${month}-${year}-${includePaid}`
  const now = Date.now()

  // Verificar cache
  if (cache.payrolls.has(cacheKey) && 
      cache.lastFetch.has(cacheKey) && 
      now - cache.lastFetch.get(cacheKey)! < cache.CACHE_TTL) {
    return cache.payrolls.get(cacheKey)!
  }

  // Si no está en cache, obtener de la base de datos
  const { data, error } = await supabase
    .from('payrolls')
    .select('*')
    .eq('month', month)
    .eq('year', year)
    .eq('is_paid', includePaid)

  if (error) throw error

  // Actualizar cache
  cache.payrolls.set(cacheKey, data)
  cache.lastFetch.set(cacheKey, now)

  return data
}

// Clase PayrollService
export class PayrollService {
  // Método para obtener una nómina por su ID
  async getPayrollById(payrollId: string) {
    try {
      logger.log(`Obteniendo nómina con ID: ${payrollId}`)

      // Obtener la nómina
      const payroll = await dbService.getPayrollById(payrollId)

      if (!payroll) {
        throw new Error(`No se encontró la nómina con ID: ${payrollId}`)
      }

      // Intentar obtener los detalles de la nómina
      try {
        // Verificar si ya tiene detalles cargados
        if (!payroll.details || !Array.isArray(payroll.details)) {
          logger.log(`Cargando detalles para nómina ${payrollId}`)

          // Obtener detalles desde la base de datos
          const { data: detailsData, error } = await dbService
            .getSupabase()
            .from("payroll_details")
            .select("*")
            .eq("payroll_id", payrollId)
            .order("type", { ascending: false })

          if (error) {
            logger.error("Error al obtener detalles de nómina:", error)
            payroll.details = []
          } else {
            payroll.details = detailsData || []
            logger.log(`Se encontraron ${payroll.details.length} detalles para la nómina`)
          }
        }
      } catch (error) {
        logger.error("Error al cargar detalles de nómina:", error)
        payroll.details = []
      }

      return payroll
    } catch (error) {
      logger.error(`Error al obtener nómina con ID ${payrollId}:`, error)
      throw new Error(`Error al obtener nómina con ID ${payrollId}`)
    }
  }

  async getPayrollsByPeriod(month: number, year: number, isPaid = false) {
    try {
      return await dbService.getPayrollsByPeriod(month, year, isPaid)
    } catch (error) {
      logger.error(`Error al obtener nóminas para el período ${month}/${year}:`, error)
      throw new Error(`Error al obtener nóminas para el período ${month}/${year}`)
    }
  }

  async getPayrollsByEmployeeId(employeeId: string) {
    try {
      return await dbService.getPayrollByEmployeeId(employeeId)
    } catch (error) {
      logger.error(`Error al obtener nóminas para el empleado ${employeeId}:`, error)
      throw new Error(`Error al obtener nóminas para el empleado ${employeeId}`)
    }
  }

  /**
   * Calcula deducciones y adiciones basadas en asistencias.
   * Esta función es interna y no modifica la base de datos.
   */
  private calculateAdjustmentsFromAttendances(attendances: any[], baseSalary: number) {
    logger.log("Calculando ajustes a partir de asistencias")
    logger.log("Salario base:", baseSalary)
    logger.log("Número de asistencias:", attendances.length)

    // Inspeccionar los datos de asistencia
    if (attendances.length > 0) {
      logger.log("Campos disponibles en el primer registro:", Object.keys(attendances[0]))
      logger.log("Muestra de la primera asistencia:", JSON.stringify(attendances[0], null, 2))
    }

    let deductions = 0
    let additions = 0
    const details = []

    // Valor del minuto (basado en el salario base)
    const dailySalary = baseSalary / 30 // Salario diario
    const hourSalary = dailySalary / 8 // Salario por hora (asumiendo 8 horas por día)
    const minuteSalary = hourSalary / 60 // Salario por minuto

    logger.log(`Valores para cálculos - Diario: ${dailySalary}, Hora: ${hourSalary}, Minuto: ${minuteSalary}`)

    // Procesar cada asistencia
    for (const attendance of attendances) {
      logger.log(`Procesando asistencia del día ${attendance.date}`)

      // Verificar si hay datos relevantes para cálculos
      logger.log(
        `Datos de asistencia - isAbsent: ${attendance.isAbsent}, isJustified: ${attendance.isJustified}, isHoliday: ${attendance.isHoliday}`,
      )
      logger.log(
        `Minutos - lateMinutes: ${attendance.lateMinutes}, earlyDepartureMinutes: ${attendance.earlyDepartureMinutes}, extraMinutes: ${attendance.extraMinutes}`,
      )

      // IMPORTANTE: Verificar si los campos existen y tienen valores numéricos
      const lateMinutes = typeof attendance.lateMinutes === "number" ? attendance.lateMinutes : 0
      const earlyDepartureMinutes =
        typeof attendance.earlyDepartureMinutes === "number" ? attendance.earlyDepartureMinutes : 0
      const extraMinutes = typeof attendance.extraMinutes === "number" ? attendance.extraMinutes : 0
      const isAbsent = Boolean(attendance.isAbsent)
      const isJustified = Boolean(attendance.isJustified)
      const isHoliday = Boolean(attendance.isHoliday)

      // Ausencias injustificadas
      if (isAbsent && !isJustified && !isHoliday) {
        const absenceDeduction = dailySalary
        deductions += absenceDeduction
        details.push({
          concept: "Ausencia Injustificada",
          type: "deduction",
          amount: absenceDeduction,
          notes: `Ausencia el día ${attendance.date}`,
          date: attendance.date,
        })
        logger.log(`Ausencia injustificada. Deducción: ${absenceDeduction}`)
      }

      // Llegadas tarde
      if (lateMinutes > 0) {
        const lateDeduction = minuteSalary * lateMinutes
        deductions += lateDeduction
        details.push({
          concept: "Llegada Tarde",
          type: "deduction",
          amount: lateDeduction,
          notes: `${lateMinutes} minutos tarde el día ${attendance.date}`,
          date: attendance.date,
        })
        logger.log(`Llegada tarde: ${lateMinutes} min. Deducción: ${lateDeduction}`)
      }

      // Salidas anticipadas
      if (earlyDepartureMinutes > 0) {
        const earlyDeduction = minuteSalary * earlyDepartureMinutes
        deductions += earlyDeduction
        details.push({
          concept: "Salida Anticipada",
          type: "deduction",
          amount: earlyDeduction,
          notes: `${earlyDepartureMinutes} minutos antes el día ${attendance.date}`,
          date: attendance.date,
        })
        logger.log(`Salida anticipada: ${earlyDepartureMinutes} min. Deducción: ${earlyDeduction}`)
      }

      // Horas extra
      if (extraMinutes > 0) {
        // Las horas extra se pagan a 1.5x el valor normal
        const extraAddition = minuteSalary * extraMinutes * 1.5
        additions += extraAddition
        details.push({
          concept: "Horas Extra",
          type: "addition",
          amount: extraAddition,
          notes: `${extraMinutes} minutos extra el día ${attendance.date}`,
          date: attendance.date,
        })
        logger.log(`Horas extra: ${extraMinutes} min. Adición: ${extraAddition}`)
      }

      // Feriados trabajados
      if (isHoliday && !isAbsent) {
        // Los feriados se pagan doble
        const holidayAddition = dailySalary
        additions += holidayAddition
        details.push({
          concept: "Feriado Trabajado",
          type: "addition",
          amount: holidayAddition,
          notes: `Trabajo en día feriado ${attendance.date}`,
          date: attendance.date,
        })
        logger.log(`Feriado trabajado. Adición: ${holidayAddition}`)
      }
    }

    // IMPORTANTE: Asegurarse de que los valores sean números y estén redondeados
    deductions = Number(Math.round(deductions * 100) / 100)
    additions = Number(Math.round(additions * 100) / 100)

    logger.log(
      `RESUMEN - Total deducciones: ${deductions}, Total adiciones: ${additions}, Detalles: ${details.length}`,
    )

    return { deductions, additions, details }
  }

  /**
   * Genera nóminas para los empleados especificados en un período determinado.
   * Esta función integrada realiza todos los cálculos necesarios en un solo paso.
   */
  async generatePayrolls(employeeIds: string[], month: number, year: number) {
    try {
      console.log(`Generando nóminas para ${employeeIds.length} empleados en período ${month}/${year}`)
      const results = []

      for (const employeeId of employeeIds) {
        // Obtener información del empleado
        const employee = await dbService.getEmployeeById(employeeId)

        if (!employee) {
          console.error(`Empleado con ID ${employeeId} no encontrado`)
          continue
        }

        console.log(`Procesando empleado: ${employee.firstName} ${employee.lastName} (ID: ${employeeId})`)

        // Verificar si ya existe una nómina para este empleado en el mes/año especificado
        const allPayrolls = await dbService.getPayrollsByPeriod(month, year, false)
        const existingPayrolls = allPayrolls.filter((p) => p.employeeId === employeeId || p.employee_id === employeeId)

        if (existingPayrolls.length > 0) {
          console.log(`La nómina para el empleado ${employeeId} en ${month}/${year} ya existe`)
          results.push(existingPayrolls[0])
          continue
        }

        // Calcular el rango de fechas para el mes
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0)
        const startDateStr = startDate.toISOString().split("T")[0]
        const endDateStr = endDate.toISOString().split("T")[0]

        console.log(`Obteniendo asistencias desde ${startDateStr} hasta ${endDateStr}`)

        // Obtener asistencias del empleado para el período
        const attendances = await dbService.getAttendancesByDateRange(employeeId, startDateStr, endDateStr)
        console.log(`Se encontraron ${attendances.length} registros de asistencia`)

        // Calcular los valores base de la nómina
        const baseSalary = Number(employee.base_salary || 0)
        const bankSalary = Number(employee.bank_salary || 0)
        let handSalary = Number(employee.hand_salary || 0)

        // REGLA: Si no hay salario en mano ni en banco, el salario base se convierte en salario en mano
        if (handSalary === 0 && bankSalary === 0 && baseSalary > 0) {
          handSalary = baseSalary
          console.log(`Aplicando regla: Sueldo Base (${baseSalary}) se convierte en Sueldo en Mano`)
        }

        // Calcular bonificación por asistencia si aplica
        const hasAttendanceBonus = Boolean(employee.has_attendance_bonus || false)
        const attendanceBonus = hasAttendanceBonus
          ? Number(employee.attendance_bonus || 0)
          : 0

        console.log(`Valores base: Salario Base=${baseSalary}, Banco=${bankSalary}, Mano=${handSalary}, Bono=${attendanceBonus}`)

        // Calcular deducciones y adiciones basadas en asistencias
        const { deductions, additions, details } = this.calculateAdjustmentsFromAttendances(attendances, baseSalary)

        console.log(`Cálculos realizados: Deducciones=${deductions}, Adiciones=${additions}, Detalles=${details.length}`)

        // NUEVA LÓGICA: Calcular salarios finales según la fórmula correcta
        // final_hand_salary = hand_salary + additions - deductions + bono_presentismo
        const calculatedFinalHandSalary =
          handSalary + additions - deductions + (hasAttendanceBonus ? attendanceBonus : 0)

        // total_salary = final_hand_salary + bank_salary
        const totalSalary = calculatedFinalHandSalary + bankSalary

        console.log(`Valores finales: Final Mano=${calculatedFinalHandSalary}, Total=${totalSalary}`)

        // Crear la nueva nómina con TODOS los valores ya calculados
        const payrollData: any = {
          employee_id: employeeId,
          month,
          year,
          base_salary: baseSalary,
          bank_salary: bankSalary,
          hand_salary: calculatedFinalHandSalary, // CAMBIO: Guardar el valor calculado
          deductions: Number(deductions), // Asegurar que sea número
          additions: Number(additions), // Asegurar que sea número
          final_hand_salary: calculatedFinalHandSalary,
          total_salary: totalSalary,
          is_paid_hand: existingPayrolls.length > 0 ? existingPayrolls[0].is_paid_hand || false : false,
          is_paid_bank: existingPayrolls.length > 0 ? existingPayrolls[0].is_paid_bank || false : false,
          has_attendance_bonus: hasAttendanceBonus,
          attendance_bonus: attendanceBonus,
        }

        console.log("Creando nómina con datos completos:", payrollData)

        // Tipar key explícitamente
        (Object.keys(payrollData) as string[]).forEach((key: string) => {
          if (typeof payrollData[key] === "number") {
            payrollData[key] = Number(payrollData[key].toString())
            console.log(`Campo ${key} convertido a número: ${payrollData[key]}`)
          }
        })

        // Crear la nómina en la base de datos - Usar directamente la API de Supabase para mayor control
        const { data: insertedData, error: insertError } = await dbService
          .getSupabase()
          .from("payrolls")
          .insert(payrollData)
          .select()

        if (insertError) {
          console.error("Error al crear nómina:", insertError)
          throw insertError
        }

        const createdPayroll = insertedData[0]
        console.log(`Nómina creada con ID: ${createdPayroll.id}`)

        // Guardar los detalles de la nómina
        if (details.length > 0) {
          console.log(`Guardando ${details.length} detalles para la nómina`)

          for (const detail of details) {
            try {
              const detailData = {
                payrollId: createdPayroll.id,
                concept: detail.concept,
                type: detail.type === "deduction" ? "deduction" : "addition",
                amount: Number(detail.amount),
                date: detail.date,
                notes: detail.notes,
              }

              const { data: insertedDetail, error: detailError } = await dbService
                .getSupabase()
                .from("payroll_details")
                .insert(detailData)
                .select()

              if (detailError) {
                console.error("Error al guardar detalle:", detailError)
              } else {
                console.log("Detalle guardado:", insertedDetail)
              }
            } catch (detailError) {
              console.error("Error al guardar detalle:", detailError)
            }
          }

          console.log("Detalles guardados correctamente")
        }

        results.push(createdPayroll)
      }

      return results
    } catch (error) {
      console.error("Error al generar nóminas:", error)
      throw new Error("Error al generar nóminas")
    }
  }

  async getPayrollsByMonthYear(month: number, year: number) {
    try {
      return await dbService.getPayrollsByPeriod(month, year, false)
    } catch (error) {
      logger.error("Error al obtener nóminas:", error)
      throw new Error("Error al obtener nóminas")
    }
  }

  async updatePayrollStatus(payrollId: string, field: string, value: boolean) {
    try {
      const validFields = ["is_paid_hand", "is_paid_bank", "is_paid"]
      if (!validFields.includes(field)) {
        throw new Error("Campo inválido para actualizar")
      }

      // No actualizamos is_paid directamente ya que es una columna generada
      if (field === "is_paid") {
        // Si queremos marcar como pagado, actualizamos tanto is_paid_hand como is_paid_bank
        const updateData = {
          is_paid_hand: value,
          is_paid_bank: value,
        }

        if (value) {
          (updateData as any).hand_payment_date = new Date().toISOString()
          (updateData as any).bank_payment_date = new Date().toISOString()
          (updateData as any).payment_date = new Date().toISOString()
        }

        const updatedPayroll = await dbService.updatePayroll(payrollId, updateData as Partial<Payroll>)
        return updatedPayroll
      } else {
        // Usamos directamente el nombre del campo en snake_case
        const updateData: any = {
          [field]: value,
        }

        // Si estamos marcando como pagado, actualizar la fecha de pago correspondiente
        if (field === "is_paid_hand" && value) {
          updateData.hand_payment_date = new Date().toISOString()
        } else if (field === "is_paid_bank" && value) {
          updateData.bank_payment_date = new Date().toISOString()
        }

        // Usar dbService para actualizar la nómina
        const updatedPayroll = await dbService.updatePayroll(payrollId, updateData)
        return updatedPayroll
      }
    } catch (error) {
      logger.error("Error al actualizar estado de nómina:", error)
      throw new Error("Error al actualizar estado de nómina")
    }
  }

  async updatePaymentDetails(payrollId: string, paymentMethod: string, paymentReference: string) {
    try {
      // Usar dbService para actualizar los detalles de pago
      // Usamos los nombres de columnas correctos según la base de datos
      const updateData = {
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        payment_date: new Date().toISOString(),
      }

      const updatedPayroll = await dbService.updatePayroll(payrollId, updateData)
      return updatedPayroll
    } catch (error) {
      logger.error("Error al actualizar detalles de pago:", error)
      throw new Error("Error al actualizar detalles de pago")
    }
  }

  async updatePayroll(payrollId: string, updateData: any) {
    try {
      // IMPORTANTE: Asegurarse de que deductions y additions sean números
      if (updateData.deductions !== undefined) {
        updateData.deductions = Number(updateData.deductions)
      }
      if (updateData.additions !== undefined) {
        updateData.additions = Number(updateData.additions)
      }

      return await dbService.updatePayroll(payrollId, updateData)
    } catch (error) {
      logger.error("Error al actualizar nómina:", error)
      throw new Error("Error al actualizar nómina")
    }
  }

  async deletePayroll(payrollId: string) {
    try {
      // return await dbService.deletePayroll(payrollId)
      throw new Error("Función de eliminación de nómina no implementada en dbService.")
    } catch (error) {
      logger.error("Error al eliminar nómina:", error)
      throw new Error("Error al eliminar nómina")
    }
  }

  /**
   * Regenera nóminas para los empleados especificados en un período determinado.
   * Esta función integrada realiza todos los cálculos necesarios en un solo paso.
   */
  async forceRegeneratePayrolls(employeeIds: string[], month: number, year: number) {
    try {
      logger.log(`Forzando regeneración de nóminas para ${employeeIds.length} empleados en período ${month}/${year}`)
      const results = []

      // Obtener todas las nóminas existentes para este período
      const existingPayrolls = await dbService.getPayrollsByPeriod(month, year, false)
      logger.log(`Se encontraron ${existingPayrolls.length} nóminas existentes para el período ${month}/${year}`)

      for (const employeeId of employeeIds) {
        logger.log(`Procesando empleado ID: ${employeeId}`)

        // Buscar si ya existe una nómina para este empleado
        const existingPayroll = existingPayrolls.find(
          (p) => p.employeeId === employeeId || p.employee_id === employeeId,
        )

        // Obtener información del empleado
        const employee = await dbService.getEmployeeById(employeeId)

        if (!employee) {
          logger.error(`Empleado con ID ${employeeId} no encontrado`)
          continue
        }

        logger.log(`Datos del empleado: ${employee.firstName} ${employee.lastName}`)

        // Calcular el rango de fechas para el mes
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0)
        const startDateStr = startDate.toISOString().split("T")[0]
        const endDateStr = endDate.toISOString().split("T")[0]

        logger.log(`Obteniendo asistencias desde ${startDateStr} hasta ${endDateStr}`)

        // Obtener asistencias del empleado para el período
        const attendances = await dbService.getAttendancesByDateRange(employeeId, startDateStr, endDateStr)
        logger.log(`Se encontraron ${attendances.length} registros de asistencia`)

        // Calcular los valores base de la nómina
        const baseSalary = Number(employee.base_salary || 0)
        const bankSalary = Number(employee.bank_salary || 0)
        let handSalary = Number(employee.hand_salary || 0)

        // REGLA: Si no hay salario en mano ni en banco, el salario base se convierte en salario en mano
        if (handSalary === 0 && bankSalary === 0 && baseSalary > 0) {
          handSalary = baseSalary
          logger.log(`Aplicando regla: Sueldo Base (${baseSalary}) se convierte en Sueldo en Mano`)
        }

        // Calcular bonificación por asistencia si aplica
        const hasAttendanceBonus = Boolean(employee.has_attendance_bonus || false)
        const attendanceBonus = hasAttendanceBonus
          ? Number(employee.attendance_bonus || 0)
          : 0

        logger.log(`Valores base: Salario Base=${baseSalary}, Banco=${bankSalary}, Mano=${handSalary}, Bono=${attendanceBonus}`)

        // Calcular deducciones y adiciones basadas en asistencias
        const { deductions, additions, details } = this.calculateAdjustmentsFromAttendances(attendances, baseSalary)

        logger.log(`Cálculos realizados: Deducciones=${deductions}, Adiciones=${additions}, Detalles=${details.length}`)

        // NUEVA LÓGICA: Calcular salarios finales según la fórmula correcta
        // final_hand_salary = hand_salary + additions - deductions + bono_presentismo
        const calculatedFinalHandSalary =
          handSalary + additions - deductions + (hasAttendanceBonus ? attendanceBonus : 0)

        // total_salary = final_hand_salary + bank_salary
        const totalSalary = calculatedFinalHandSalary + bankSalary

        logger.log(`Valores finales: Final Mano=${calculatedFinalHandSalary}, Total=${totalSalary}`)

        // Preparar los datos de la nómina
        const payrollData: any = {
          employee_id: employeeId,
          month,
          year,
          base_salary: baseSalary,
          bank_salary: bankSalary,
          hand_salary: calculatedFinalHandSalary, // CAMBIO: Guardar el valor calculado
          deductions: Number(deductions), // Asegurar que sea número
          additions: Number(additions), // Asegurar que sea número
          final_hand_salary: calculatedFinalHandSalary,
          total_salary: totalSalary,
          is_paid_hand: existingPayroll ? existingPayroll.is_paid_hand || false : false,
          is_paid_bank: existingPayroll ? existingPayroll.is_paid_bank || false : false,
          has_attendance_bonus: hasAttendanceBonus,
          attendance_bonus: attendanceBonus,
        }

        // Tipar key explícitamente
        (Object.keys(payrollData) as string[]).forEach((key: string) => {
          if (typeof payrollData[key] === "number") {
            payrollData[key] = Number(payrollData[key].toString())
            logger.log(`Campo ${key} convertido a número: ${payrollData[key]}`)
          }
        })

        // Verificar que los valores de deducciones y adiciones estén presentes
        logger.log(`VERIFICACIÓN DE DATOS A GUARDAR:
- Deducciones: ${deductions} (tipo: ${typeof deductions})
- Adiciones: ${additions} (tipo: ${typeof additions})
- Datos completos: ${JSON.stringify(payrollData, null, 2)}
`)

        let payrollId: string

        if (existingPayroll) {
          logger.log(`Actualizando nómina existente con ID: ${existingPayroll.id}`)

          // Actualizar la nómina existente - Usar directamente la API de Supabase para mayor control
          const { data: updatedData, error: updateError } = await dbService
            .getSupabase()
            .from("payrolls")
            .update(payrollData)
            .eq("id", existingPayroll.id)
            .select()

          if (updateError) {
            logger.error("Error al actualizar nómina:", updateError)
            throw updateError
          }

          logger.log("Nómina actualizada:", updatedData)
          payrollId = existingPayroll.id

          // Eliminar detalles existentes
          await dbService.deletePayrollDetails(existingPayroll.id)
          logger.log(`Detalles anteriores eliminados para nómina ${existingPayroll.id}`)
        } else {
          logger.log(`Creando nueva nómina para empleado ${employeeId}`)

          // Crear nueva nómina - Usar directamente la API de Supabase para mayor control
          const { data: insertedData, error: insertError } = await dbService
            .getSupabase()
            .from("payrolls")
            .insert(payrollData)
            .select()

          if (insertError) {
            logger.error("Error al crear nómina:", insertError)
            throw insertError
          }

          logger.log("Nómina creada:", insertedData)
          payrollId = insertedData[0].id

          logger.log(`Nueva nómina creada con ID: ${payrollId}`)
        }

        // Verificar que la nómina se haya guardado correctamente
        const { data: payrollAfterSave, error: fetchError } = await dbService
          .getSupabase()
          .from("payrolls")
          .select("*")
          .eq("id", payrollId)
          .single()

        if (fetchError) {
          logger.error("Error al verificar nómina guardada:", fetchError)
        } else {
          logger.log(`NÓMINA DESPUÉS DE GUARDAR:
- ID: ${payrollId}
- Deducciones: ${payrollAfterSave.deductions !== null ? payrollAfterSave.deductions : "NO PRESENTE"}
- Adiciones: ${payrollAfterSave.additions !== null ? payrollAfterSave.additions : "NO PRESENTE"}
`)
        }

        // Guardar los detalles de la nómina
        if (details.length > 0) {
          logger.log(`Guardando ${details.length} detalles para la nómina ${payrollId}`)

          for (const detail of details) {
            try {
              const detailData = {
                payrollId: payrollId,
                concept: detail.concept,
                type: detail.type === "deduction" ? "deduction" : "addition",
                amount: Number(detail.amount),
                date: detail.date,
                notes: detail.notes,
              }

              const { data: insertedDetail, error: detailError } = await dbService
                .getSupabase()
                .from("payroll_details")
                .insert(detailData)
                .select()

              if (detailError) {
                logger.error("Error al guardar detalle:", detailError)
              } else {
                logger.log("Detalle guardado:", insertedDetail)
              }
            } catch (detailError) {
              logger.error("Error al guardar detalle:", detailError)
            }
          }

          logger.log("Detalles guardados correctamente")
        }

        // Obtener la nómina actualizada para devolverla
        const updatedPayroll = await this.getPayrollById(payrollId)
        results.push(updatedPayroll)
      }

      return results
    } catch (error) {
      logger.error("Error al regenerar nóminas:", error)
      throw new Error("Error al regenerar nóminas")
    }
  }

  // Añadir un nuevo método de diagnóstico para el cálculo de ajustes
  async calculatePayrollAdjustmentsDebug(payrollId: string, attendances: any[]) {
    try {
      logger.log(`INICIO: Calculando ajustes para nómina ID: ${payrollId}`)

      // Obtener la nómina actual
      const payroll = await this.getPayrollById(payrollId)
      if (!payroll) {
        throw new Error("Nómina no encontrada")
      }

      logger.log("Datos de la nómina antes de ajustes:", JSON.stringify(payroll, null, 2))

      // Obtener información del empleado
      const employeeId = payroll.employeeId || payroll.employee_id
      const employee = await dbService.getEmployeeById(employeeId)
      if (!employee) {
        throw new Error("Empleado no encontrado")
      }

      logger.log("Datos del empleado:", JSON.stringify(employee, null, 2))

      // Calcular deducciones y adiciones
      const baseSalary = Number(payroll.base_salary || 0)
      const { deductions, additions, details } = this.calculateAdjustmentsFromAttendances(attendances, baseSalary)

      // Obtener valores actuales del empleado (no de la nómina)
      const handSalary = Number(employee.hand_salary || 0)
      const bankSalary = Number(employee.bank_salary || 0)
      const attendanceBonus = Number(employee.attendance_bonus || 0)
      const hasAttendanceBonus = Boolean(employee.has_attendance_bonus || false)

      logger.log(
        `Valores del empleado - Sueldo en mano: ${handSalary}, Sueldo banco: ${bankSalary}, Bono: ${attendanceBonus}`,
      )

      // NUEVA LÓGICA: Calcular según la fórmula correcta
      // final_hand_salary = hand_salary + additions - deductions + bono_presentismo
      const calculatedFinalHandSalary = handSalary + additions - deductions + (hasAttendanceBonus ? attendanceBonus : 0)

      // total_salary = final_hand_salary + bank_salary
      const totalSalary = calculatedFinalHandSalary + bankSalary

      logger.log(`Nuevos valores calculados - Final Mano: ${calculatedFinalHandSalary}, Total: ${totalSalary}`)

      // Actualizar la nómina
      const updateData: any = {
        deductions: Number(deductions),
        additions: Number(additions),
        hand_salary: calculatedFinalHandSalary,
        final_hand_salary: calculatedFinalHandSalary,
        total_salary: totalSalary,
      }

      logger.log("Actualizando nómina con ajustes:", JSON.stringify(updateData, null, 2))

      // Actualizar la nómina
      try {
        const updatedPayroll = await dbService.updatePayroll(payrollId, updateData)
        logger.log("Nómina actualizada con ajustes:", JSON.stringify(updatedPayroll, null, 2))
      } catch (error) {
        logger.error("Error al actualizar nómina con ajustes:", error)
        throw error
      }

      // Guardar los detalles en la tabla payroll_details
      if (details.length > 0) {
        try {
          // Eliminar detalles existentes si los hay
          await dbService.deletePayrollDetails(payrollId)
          logger.log(`Detalles de nómina eliminados para ID: ${payrollId}`)

          // Insertar nuevos detalles
          logger.log(`Guardando ${details.length} detalles para la nómina ${payrollId}`)

          for (const detail of details) {
            logger.log("Guardando detalle:", JSON.stringify(detail, null, 2))

            try {
              await dbService.createPayrollDetail({
                payroll_id: payrollId,
                concept: detail.concept,
                type: detail.type === "deduction" ? "deduction" : "addition",
                amount: Number(detail.amount),
                date: detail.date,
                notes: detail.notes,
              })
            } catch (detailError) {
              logger.error("Error al guardar detalle:", detailError)
            }
          }

          logger.log(`Guardados ${details.length} detalles para la nómina ${payrollId}`)
        } catch (error) {
          logger.error("Error al guardar detalles de nómina:", error)
        }
      } else {
        logger.log("No hay detalles para guardar")
      }

      logger.log(`FIN: Cálculo de ajustes para nómina ID: ${payrollId}`)
      return await this.getPayrollById(payrollId)
    } catch (error) {
      logger.error("Error al calcular ajustes de nómina:", error)
      throw new Error("Error al calcular ajustes de nómina")
    }
  }

  // FUNCIÓN MEJORADA: calculatePayrollAdjustments con más logging y mejor manejo de errores
  async calculatePayrollAdjustments(payrollId: string, attendances: any[]) {
    try {
      logger.log(`Iniciando cálculo de ajustes para nómina ID: ${payrollId} con ${attendances.length} asistencias`)

      // Obtener la nómina actual
      const payroll = await this.getPayrollById(payrollId)
      if (!payroll) {
        logger.error(`No se encontró la nómina con ID: ${payrollId}`)
        throw new Error("Nómina no encontrada")
      }

      logger.log(`Nómina encontrada:`, JSON.stringify(payroll, null, 2))

      // Obtener información del empleado
      const employeeId = payroll.employeeId || payroll.employee_id
      const employee = await dbService.getEmployeeById(employeeId)
      if (!employee) {
        logger.error(`No se encontró el empleado con ID: ${employeeId}`)
        throw new Error("Empleado no encontrado")
      }

      logger.log(`Empleado encontrado: ${employee.firstName} ${employee.lastName}`)

      // Calcular deducciones y adiciones
      const baseSalary = Number(payroll.base_salary || 0)
      const { deductions, additions, details } = this.calculateAdjustmentsFromAttendances(attendances, baseSalary)

      // Obtener valores actuales del empleado (no de la nómina)
      const handSalary = Number(employee.hand_salary || 0)
      const bankSalary = Number(employee.bank_salary || 0)
      const attendanceBonus = Number(employee.attendance_bonus || 0)
      const hasAttendanceBonus = Boolean(employee.has_attendance_bonus || false)

      // NUEVA LÓGICA: Calcular según la fórmula correcta
      // final_hand_salary = hand_salary + additions - deductions + bono_presentismo
      const calculatedFinalHandSalary = handSalary + additions - deductions + (hasAttendanceBonus ? attendanceBonus : 0)

      // total_salary = final_hand_salary + bank_salary
      const totalSalary = calculatedFinalHandSalary + bankSalary

      logger.log(`Valores calculados - Final Mano: ${calculatedFinalHandSalary}, Total: ${totalSalary}`)

      // Actualizar la nómina
      const updateData: any = {
        deductions: Number(deductions),
        additions: Number(additions),
        hand_salary: calculatedFinalHandSalary,
        final_hand_salary: calculatedFinalHandSalary,
        total_salary: totalSalary,
      }

      // Asegurarse de que los valores sean numéricos
      (Object.keys(updateData) as string[]).forEach((key: string) => {
        if (typeof updateData[key] === "number") {
          // Convertir a string y luego a número para asegurar que se guarde como numérico
          updateData[key] = Number(updateData[key].toString())
          logger.log(`Campo ${key} convertido a número: ${updateData[key]}`)
        }
      })

      logger.log(`Actualizando nómina con datos:`, JSON.stringify(updateData, null, 2))

      try {
        const updatedPayroll = await dbService.updatePayroll(payrollId, updateData)
        logger.log(`Nómina actualizada correctamente:`, JSON.stringify(updatedPayroll, null, 2))

        // Verificar si los valores se guardaron correctamente
        if (updatedPayroll.deductions === 0 && deductions > 0) {
          logger.error(
            `ADVERTENCIA: El valor de deductions no se guardó correctamente. Valor calculado: ${deductions}, Valor guardado: ${updatedPayroll.deductions}`,
          )
        }

        if (updatedPayroll.additions === 0 && additions > 0) {
          logger.error(
            `ADVERTENCIA: El valor de additions no se guardó correctamente. Valor calculado: ${additions}, Valor guardado: ${updatedPayroll.additions}`,
          )
        }
      } catch (updateError) {
        logger.error(`Error al actualizar nómina:`, updateError)
        throw updateError
      }

      // Guardar los detalles en la tabla payroll_details
      if (details.length > 0) {
        try {
          // Eliminar detalles existentes si los hay
          await dbService.deletePayrollDetails(payrollId)
          logger.log(`Detalles anteriores eliminados para nómina ${payrollId}`)

          // Insertar nuevos detalles
          logger.log(`Guardando ${details.length} detalles para la nómina ${payrollId}`)

          for (const detail of details) {
            logger.log(`Guardando detalle:`, JSON.stringify(detail, null, 2))

            try {
              const savedDetail = await dbService.createPayrollDetail({
                payroll_id: payrollId,
                concept: detail.concept,
                type: detail.type === "deduction" ? "deduction" : "addition",
                amount: Number(detail.amount),
                date: detail.date,
                notes: detail.notes,
              })

              logger.log(`Detalle guardado correctamente:`, JSON.stringify(savedDetail, null, 2))
            } catch (detailError) {
              logger.error(`Error al guardar detalle:`, detailError)
            }
          }

          logger.log(`Proceso de guardado de detalles completado`)
        } catch (error) {
          logger.error(`Error al gestionar detalles de nómina:`, error)
        }
      } else {
        logger.log(`No hay detalles para guardar`)
      }

      // Obtener la nómina actualizada para devolverla
      const finalPayroll = await this.getPayrollById(payrollId)
      logger.log(`Nómina final después de ajustes:`, JSON.stringify(finalPayroll, null, 2))

      return finalPayroll
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error("Error al calcular ajustes de nómina:", error)
        throw new Error(`Error al calcular ajustes de nómina: ${error.message}`)
      } else {
        logger.error("Error desconocido al calcular ajustes de nómina:", error)
        throw new Error("Error desconocido al calcular ajustes de nómina")
      }
    }
  }

  async recalculateAllPayrolls(month: number, year: number) {
    try {
      logger.log(`Recalculando todas las nóminas para el período ${month}/${year}`)

      // Obtener todas las nóminas del período
      const payrolls = await this.getPayrollsByMonthYear(month, year)
      logger.log(`Se encontraron ${payrolls.length} nóminas para recalcular`)

      // Usar forceRegeneratePayrolls para recalcular todas las nóminas
      const employeeIds = payrolls.map((p) => p.employeeId || p.employee_id)
      return await this.forceRegeneratePayrolls(employeeIds, month, year)
    } catch (error) {
      logger.error("Error al recalcular nóminas:", error)
      throw new Error("Error al recalcular nóminas")
    }
  }

  async generatePayrollReport(month: number, year: number) {
    try {
      // Obtener todas las nóminas del período
      const payrolls = await this.getPayrollsByMonthYear(month, year)

      // Calcular totales
      const totalHandSalary = payrolls.reduce(
        (sum, p) => sum + Number(p.final_hand_salary || 0),
        0,
      )
      const totalBankSalary = payrolls.reduce((sum, p) => sum + Number(p.bank_salary || 0), 0)
      const totalSalary = payrolls.reduce((sum, p) => sum + Number(p.total_salary || 0), 0)
      const totalDeductions = payrolls.reduce((sum, p) => sum + Number(p.deductions || 0), 0)
      const totalAdditions = payrolls.reduce((sum, p) => sum + Number(p.additions || 0), 0)
      const totalAttendanceBonus = payrolls.reduce(
        (sum, p) => sum + Number(p.attendance_bonus || 0),
        0,
      )

      // Agrupar por local
      const byLocation = {}
      for (const payroll of payrolls) {
        const employeeId = payroll.employeeId || payroll.employee_id
        const employee = await dbService.getEmployeeById(employeeId)
        if (employee) {
          const location = employee.local || "Sin asignar"
          if (!byLocation[location]) {
            byLocation[location] = {
              count: 0,
              totalSalary: 0,
              employees: [],
            }
          }
          byLocation[location].count++
          byLocation[location].totalSalary += Number(payroll.total_salary || 0)
          byLocation[location].employees.push({
            id: employee.id,
            name: `${employee.firstName} ${employee.lastName}`,
            salary: Number(payroll.total_salary || 0),
          })
        }
      }

      return {
        period: {
          month,
          year,
        },
        summary: {
          totalEmployees: payrolls.length,
          totalHandSalary,
          totalBankSalary,
          totalSalary,
          totalDeductions,
          totalAdditions,
          totalAttendanceBonus,
          averageSalary: payrolls.length > 0 ? totalSalary / payrolls.length : 0,
        },
        byLocation,
        payrolls: payrolls.map((p) => ({
          id: p.id,
          employeeId: p.employeeId || p.employee_id,
          totalSalary: Number(p.total_salary || 0),
          isPaid: p.is_paid || false,
        })),
      }
    } catch (error) {
      logger.error("Error al generar reporte de nóminas:", error)
      throw new Error("Error al generar reporte de nóminas")
    }
  }

  async applyBulkAttendanceBonus(employeeIds: string[], month: number, year: number, bonusAmount: number) {
    try {
      const results = []

      for (const employeeId of employeeIds) {
        // Obtener la nómina del empleado para el período
        const payrolls = await dbService.getPayrollsByEmployeeAndPeriod(employeeId, month, year)

        if (payrolls.length === 0) {
          logger.log(`No se encontró nómina para el empleado ${employeeId} en ${month}/${year}`)
          continue
        }

        const payroll = payrolls[0]

        // Obtener información del empleado para recalcular correctamente
        const employee = await dbService.getEmployeeById(employeeId)
        if (!employee) continue

        const handSalary = Number(employee.hand_salary || 0)
        const bankSalary = Number(employee.bank_salary || 0)
        const deductions = Number(payroll.deductions || 0)
        const additions = Number(payroll.additions || 0)

        // NUEVA LÓGICA: Calcular según la fórmula correcta
        // final_hand_salary = hand_salary + additions - deductions + bono_presentismo
        const calculatedFinalHandSalary = handSalary + additions - deductions + bonusAmount

        // total_salary = final_hand_salary + bank_salary
        const totalSalary = calculatedFinalHandSalary + bankSalary

        // Actualizar el bono de presentismo
        const updateData = {
          has_attendance_bonus: true,
          attendance_bonus: bonusAmount,
          hand_salary: calculatedFinalHandSalary, // CAMBIO: Guardar el valor calculado
          final_hand_salary: calculatedFinalHandSalary,
          total_salary: totalSalary,
        }

        const updatedPayroll = await dbService.updatePayroll(payroll.id, updateData)
        results.push(updatedPayroll)
      }

      return results
    } catch (error) {
      logger.error("Error al aplicar bono de presentismo masivo:", error)
      throw new Error("Error al aplicar bono de presentismo masivo")
    }
  }

  async removeBulkAttendanceBonus(employeeIds: string[], month: number, year: number) {
    try {
      const results = []

      for (const employeeId of employeeIds) {
        // Obtener la nómina del empleado para el período
        const payrolls = await dbService.getPayrollsByEmployeeAndPeriod(employeeId, month, year)

        if (payrolls.length === 0) {
          logger.log(`No se encontró nómina para el empleado ${employeeId} en ${month}/${year}`)
          continue
        }

        const payroll = payrolls[0]

        // Obtener información del empleado para recalcular correctamente
        const employee = await dbService.getEmployeeById(employeeId)
        if (!employee) continue

        const handSalary = Number(employee.hand_salary || 0)
        const bankSalary = Number(employee.bank_salary || 0)
        const deductions = Number(payroll.deductions || 0)
        const additions = Number(payroll.additions || 0)

        // NUEVA LÓGICA: Calcular según la fórmula correcta (sin bono)
        // final_hand_salary = hand_salary + additions - deductions
        const calculatedFinalHandSalary = handSalary + additions - deductions

        // total_salary = final_hand_salary + bank_salary
        const totalSalary = calculatedFinalHandSalary + bankSalary

        // Quitar el bono de presentismo
        const updateData = {
          has_attendance_bonus: false,
          attendance_bonus: 0,
          hand_salary: calculatedFinalHandSalary, // CAMBIO: Guardar el valor calculado
          final_hand_salary: calculatedFinalHandSalary,
          total_salary: totalSalary,
        }

        const updatedPayroll = await dbService.updatePayroll(payroll.id, updateData)
        results.push(updatedPayroll)
      }

      return results
    } catch (error) {
      logger.error("Error al quitar bono de presentismo masivo:", error)
      throw new Error("Error al quitar bono de presentismo masivo")
    }
  }

  async bulkUpdatePayrollStatus(payrollIds: string[], status: "paid" | "hand_paid" | "bank_paid") {
    try {
      const results = []

      for (const payrollId of payrollIds) {
        let field = ""
        if (status === "paid") field = "is_paid"
        else if (status === "hand_paid") field = "is_paid_hand"
        else if (status === "bank_paid") field = "is_paid_bank"
        else throw new Error("Estado de pago inválido")

        const updatedPayroll = await this.updatePayrollStatus(payrollId, field, true)
        results.push(updatedPayroll)
      }

      return results
    } catch (error) {
      logger.error("Error al actualizar estado de nóminas masivamente:", error)
      throw new Error("Error al actualizar estado de nóminas masivamente")
    }
  }

  async getPayrollStatistics(year: number) {
    try {
      const statistics = {
        byMonth: [] as any[],
        totalAnnual: 0,
        averageMonthly: 0,
        employeeCount: 0,
        topPaidEmployees: [] as any[],
      }

      // Obtener estadísticas por mes
      for (let month = 1; month <= 12; month++) {
        const payrolls = await this.getPayrollsByMonthYear(month, year)
        const totalAmount = payrolls.reduce((sum, p) => sum + Number(p.total_salary || 0), 0)

        statistics.byMonth.push({
          month,
          employeeCount: payrolls.length,
          totalAmount,
          averageSalary: payrolls.length > 0 ? totalAmount / payrolls.length : 0,
        })

        statistics.totalAnnual += totalAmount
      }

      // Calcular promedio mensual
      statistics.averageMonthly = statistics.totalAnnual / 12

      // Obtener empleados con mayor salario (promedio anual)
      const employees = await dbService.getEmployees()
      statistics.employeeCount = employees.length

      const employeeSalaries = [] as any[]

      for (const employee of employees) {
        const payrolls = await this.getPayrollsByEmployeeId(employee.id)
        const yearPayrolls = payrolls.filter((p: any) => p.year === year)

        if (yearPayrolls.length > 0) {
          const totalSalary = yearPayrolls.reduce((sum: number, p: any) => sum + Number(p.total_salary || 0), 0)
          const averageSalary = totalSalary / yearPayrolls.length

          employeeSalaries.push({
            employeeId: employee.id,
            name: `${employee.firstName} ${employee.lastName}`,
            averageSalary,
            payrollCount: yearPayrolls.length,
          })
        }
      }

      // Ordenar por salario promedio y tomar los 5 primeros
      statistics.topPaidEmployees = employeeSalaries.sort((a, b) => b.averageSalary - a.averageSalary).slice(0, 5)

      return statistics
    } catch (error) {
      logger.error("Error al obtener estadísticas de nóminas:", error)
      throw new Error("Error al obtener estadísticas de nóminas")
    }
  }

  async exportPayrollsToCSV(month: number, year: number) {
    try {
      const payrolls = await this.getPayrollsByMonthYear(month, year)
      let csvContent =
        "ID,Empleado,Mes,Año,Salario Base,Salario Banco,Salario Mano,Deducciones,Adiciones,Bono Presentismo,Salario Final Mano,Total,Estado\n"

      for (const payroll of payrolls) {
        const employeeId = payroll.employeeId || payroll.employee_id
        const employee = await dbService.getEmployeeById(employeeId)
        const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : "Desconocido"

        const isPaid = payroll.is_paid || false
        const handSalaryPaid = payroll.is_paid_hand || false
        const bankSalaryPaid = payroll.is_paid_bank || false

        const status = isPaid
          ? "Pagado"
          : handSalaryPaid && bankSalaryPaid
            ? "Pagado"
            : handSalaryPaid
              ? "Mano Pagado"
              : bankSalaryPaid
                ? "Banco Pagado"
                : "Pendiente"

        csvContent += `${payroll.id},${employeeName},${payroll.month},${payroll.year},${payroll.base_salary || 0},${payroll.bank_salary || 0},${payroll.hand_salary || 0},${payroll.deductions || 0},${payroll.additions || 0},${payroll.attendance_bonus || 0},${payroll.final_hand_salary || 0},${payroll.total_salary || 0},${status}\n`
      }

      return csvContent
    } catch (error) {
      logger.error("Error al exportar nóminas a CSV:", error)
      throw new Error("Error al exportar nóminas a CSV")
    }
  }

  // Añadir esta función al final de la clase PayrollService, justo antes del cierre
  async checkPayrollTableStructure() {
    try {
      // Obtener una nómina existente para ver su estructura
      const payrolls = await dbService.getPayrollsByPeriod(1, 2023, false)

      if (payrolls && payrolls.length > 0) {
        const payroll = payrolls[0]
        logger.log("ESTRUCTURA DE NÓMINA:", Object.keys(payroll))
        logger.log("VALORES DE NÓMINA:", JSON.stringify(payroll, null, 2))

        // Verificar si existen los campos deductions y additions
        const hasDeductions = "deductions" in payroll || "deductions" in payroll
        const hasAdditions = "additions" in payroll || "additions" in payroll

        logger.log(`Campo deductions existe: ${hasDeductions}`)
        logger.log(`Campo additions existe: ${hasAdditions}`)

        // Verificar si hay campos similares que podrían estar siendo usados en su lugar
        const possibleDeductionsFields = Object.keys(payroll).filter(
          (key) =>
            key.toLowerCase().includes("deduct") ||
            key.toLowerCase().includes("discount") ||
            key.toLowerCase().includes("minus"),
        )

        const possibleAdditionsFields = Object.keys(payroll).filter(
          (key) =>
            key.toLowerCase().includes("add") ||
            key.toLowerCase().includes("plus") ||
            key.toLowerCase().includes("bonus"),
        )

        if (possibleDeductionsFields.length > 0) {
          logger.log(`Posibles campos para deducciones: ${possibleDeductionsFields.join(", ")}`)
        }

        if (possibleAdditionsFields.length > 0) {
          logger.log(`Posibles campos para adiciones: ${possibleAdditionsFields.join(", ")}`)
        }

        return {
          hasDeductions,
          hasAdditions,
          possibleDeductionsFields,
          possibleAdditionsFields,
          structure: Object.keys(payroll),
        }
      } else {
        logger.log("No se encontraron nóminas para verificar la estructura")
        return null
      }
    } catch (error) {
      logger.error("Error al verificar la estructura de la tabla payroll:", error)
      throw new Error("Error al verificar la estructura de la tabla payroll")
    }
  }

  /**
   * Método para recalcular los ajustes de una nómina específica
   * @param payrollId ID de la nómina a recalcular
   * @returns La nómina actualizada
   */
  async recalculatePayrollAdjustments(payrollId: string) {
    try {
      logger.log(`Recalculando ajustes para nómina ID: ${payrollId}`)

      // Obtener la nómina actual
      const payroll = await this.getPayrollById(payrollId)
      if (!payroll) {
        throw new Error("Nómina no encontrada")
      }

      // Obtener información del empleado
      const employeeId = payroll.employeeId || payroll.employee_id
      const employee = await dbService.getEmployeeById(employeeId)
      if (!employee) {
        throw new Error("Empleado no encontrado")
      }

      // Calcular el rango de fechas para el período de la nómina
      const month = payroll.month
      const year = payroll.year
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)
      const startDateStr = startDate.toISOString().split("T")[0]
      const endDateStr = endDate.toISOString().split("T")[0]

      logger.log(`Obteniendo asistencias desde ${startDateStr} hasta ${endDateStr}`)

      // Obtener asistencias del empleado para el período
      const attendances = await dbService.getAttendancesByDateRange(employeeId, startDateStr, endDateStr)
      logger.log(`Se encontraron ${attendances.length} registros de asistencia`)

      // Calcular deducciones y adiciones basadas en asistencias
      const baseSalary = Number(payroll.base_salary || 0)
      const { deductions, additions, details } = this.calculateAdjustmentsFromAttendances(attendances, baseSalary)

      // Obtener valores actuales del empleado (no de la nómina)
      const handSalary = Number(employee.hand_salary || 0)
      const bankSalary = Number(employee.bank_salary || 0)
      const attendanceBonus = Number(employee.attendance_bonus || 0)
      const hasAttendanceBonus = Boolean(employee.has_attendance_bonus || false)

      // NUEVA LÓGICA: Calcular según la fórmula correcta
      // final_hand_salary = hand_salary + additions - deductions + bono_presentismo
      const calculatedFinalHandSalary = handSalary + additions - deductions + (hasAttendanceBonus ? attendanceBonus : 0)

      // total_salary = final_hand_salary + bank_salary
      const totalSalary = calculatedFinalHandSalary + bankSalary

      // Actualizar la nómina
      const updateData: any = {
        deductions: Number(deductions),
        additions: Number(additions),
        hand_salary: calculatedFinalHandSalary,
        final_hand_salary: calculatedFinalHandSalary,
        total_salary: totalSalary,
      }

      logger.log(`Actualizando nómina con datos: ${JSON.stringify(updateData)}`)

      // Actualizar la nómina
      await dbService.updatePayroll(payrollId, updateData)

      // Guardar los detalles en la tabla payroll_details
      if (details.length > 0) {
        // Eliminar detalles existentes si los hay
        await dbService.deletePayrollDetails(payrollId)

        // Insertar nuevos detalles
        for (const detail of details) {
          await dbService.createPayrollDetail({
            payroll_id: payrollId,
            concept: detail.concept,
            type: detail.type === "deduction" ? "deduction" : "addition",
            amount: Number(detail.amount),
            date: detail.date,
            notes: detail.notes,
          })
        }
      }

      // Obtener la nómina actualizada para devolverla
      return await this.getPayrollById(payrollId)
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error("Error al recalcular ajustes de nómina:", error)
        throw new Error(`Error al recalcular ajustes de nómina: ${error.message}`)
      } else {
        logger.error("Error desconocido al recalcular ajustes de nómina:", error)
        throw new Error("Error desconocido al recalcular ajustes de nómina")
      }
    }
  }

  async getEmployees() {
    return await dbService.getEmployees();
  }

  async getPayrolls(month: number, year: number, isPaid: boolean = false) {
    return await this.getPayrollsByPeriod(month, year, isPaid);
  }
}

// Mantener solo la instancia de la clase al final
export const payrollService = new PayrollService()