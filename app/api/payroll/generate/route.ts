import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { month, year } = await request.json()

    // Validar datos de entrada
    if (!month || !year) {
      return NextResponse.json({ error: "Se requiere mes y año" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log(`API: Iniciando generación de nóminas para ${month}/${year}`)

    // 1. Obtener todos los empleados activos
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("*")
      .eq("status", "active")

    if (employeesError) {
      console.error("Error al obtener empleados:", employeesError)
      return NextResponse.json({ error: "Error al obtener empleados" }, { status: 500 })
    }

    if (!employees || employees.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No hay empleados activos para generar nóminas",
        payrolls: [],
      })
    }

    console.log(`API: Se encontraron ${employees.length} empleados activos`)

    // 2. Obtener el primer y último día del mes
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)

    const firstDayStr = firstDay.toISOString().split("T")[0]
    const lastDayStr = lastDay.toISOString().split("T")[0]

    console.log(`API: Período de cálculo: ${firstDayStr} a ${lastDayStr}`)

    // 3. Para cada empleado, procesar su nómina
    const payrollPromises = employees.map(async (employee: any) => {
      try {
        console.log(`API: Procesando empleado ${employee.first_name} ${employee.last_name} (ID: ${employee.id})`)

        // 3.1 Verificar si ya existe una nómina para este empleado en este período
        const { data: existingPayroll, error: existingPayrollError } = await supabase
          .from("payroll")
          .select("id")
          .eq("employee_id", employee.id)
          .eq("month", month)
          .eq("year", year)
          .single()

        if (existingPayrollError && existingPayrollError.code !== "PGRST116") {
          console.error(`Error al verificar nómina existente para empleado ${employee.id}:`, existingPayrollError)
          return null
        }

        // 3.2 Obtener todas las asistencias del empleado en el período
        const { data: attendances, error: attendancesError } = await supabase
          .from("attendance")
          .select("*")
          .eq("employee_id", employee.id)
          .gte("date", firstDayStr)
          .lte("date", lastDayStr)

        if (attendancesError) {
          console.error(`Error al obtener asistencias para empleado ${employee.id}:`, attendancesError)
          return null
        }

        console.log(
          `API: Se encontraron ${attendances?.length || 0} registros de asistencia para empleado ${employee.id}`,
        )

        // 3.3 Calcular valores base de la nómina
        const baseSalary = Number(employee.base_salary || 0) // Salario base del empleado
        const bankSalary = Number(employee.bank_salary || 0) // Salario que va al banco
        let handSalary = Number(employee.hand_salary || 0) // Salario que se paga en mano

        console.log(`API: Valores originales del empleado:
- ID: ${employee.id}
- Nombre: ${employee.first_name} ${employee.last_name}
- base_salary: ${employee.base_salary}
- hand_salary: ${employee.hand_salary}
- bank_salary: ${employee.bank_salary}`)

        // REGLA: Si no hay salario en mano ni en banco, el salario base se convierte en salario en mano
        if (handSalary === 0 && bankSalary === 0 && baseSalary > 0) {
          handSalary = baseSalary
          console.log(`API: Aplicando regla - Sueldo Base (${baseSalary}) se convierte en Sueldo en Mano`)
        }

        // Calcular bonificación por asistencia si aplica
        const hasAttendanceBonus = Boolean(employee.has_attendance_bonus || false)
        const attendanceBonus = hasAttendanceBonus ? Number(employee.attendance_bonus || 0) : 0

        console.log(
          `API: Valores base - Base: ${baseSalary}, Banco: ${bankSalary}, Mano: ${handSalary}, Bono: ${attendanceBonus}`,
        )

        // 3.4 Calcular deducciones y adiciones basadas en asistencias
        const { deductions, additions, details } = calculateAdjustmentsFromAttendances(attendances || [], baseSalary)

        console.log(`API: Cálculos - Deducciones: ${deductions}, Adiciones: ${additions}, Detalles: ${details.length}`)

        // 3.5 NUEVA LÓGICA: Calcular salarios finales según la fórmula correcta
        // final_hand_salary = hand_salary + additions - deductions + bono_presentismo
        const calculatedFinalHandSalary =
          handSalary + additions - deductions + (hasAttendanceBonus ? attendanceBonus : 0)

        // total_salary = final_hand_salary + bank_salary
        const totalSalary = calculatedFinalHandSalary + bankSalary

        // NUEVO: Log para verificar el cálculo del total
        console.log(`API: VERIFICACIÓN DE CÁLCULO TOTAL:
- calculatedFinalHandSalary: ${calculatedFinalHandSalary}
- bankSalary: ${bankSalary}
- totalSalary calculado: ${totalSalary}`)

        console.log(`API: Valores finales calculados:
- Sueldo en Mano Original: ${handSalary}
- Deducciones: ${deductions}
- Adiciones: ${additions}
- Bono Asistencia: ${attendanceBonus}
- Final Hand Salary: ${calculatedFinalHandSalary}
- Bank Salary: ${bankSalary}
- Total Salary: ${totalSalary}`)

        // 3.6 Crear objeto de nómina con TODOS los valores ya calculados
        const payrollData = {
          employee_id: employee.id,
          month,
          year,
          base_salary: baseSalary,
          bank_salary: bankSalary,
          hand_salary: calculatedFinalHandSalary, // CAMBIO: Guardar el valor calculado
          deductions: Number(deductions), // Asegurar que sea número
          additions: Number(additions), // Asegurar que sea número
          final_hand_salary: calculatedFinalHandSalary,
          total_salary: totalSalary,
          // is_paid es columna generada
          is_paid_hand: false,
          has_attendance_bonus: hasAttendanceBonus,
          attendance_bonus: attendanceBonus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        // Verificar explícitamente que los valores numéricos sean números
        Object.keys(payrollData).forEach((key) => {
          if (typeof payrollData[key] === "number") {
            payrollData[key] = Number(payrollData[key].toString())
          }
        })

        console.log(`API: Datos de nómina preparados:`, JSON.stringify(payrollData, null, 2))

        let payrollId: string

        if (existingPayroll) {
          console.log(`API: Actualizando nómina existente con ID: ${existingPayroll.id}`)

          // Actualizar nómina existente
          const { data: updatedPayroll, error: updateError } = await supabase
            .from("payroll")
            .update({
              base_salary: payrollData.base_salary,
              bank_salary: payrollData.bank_salary,
              hand_salary: payrollData.hand_salary, // CAMBIO: Guardar el valor calculado
              deductions: payrollData.deductions,
              additions: payrollData.additions,
              final_hand_salary: payrollData.final_hand_salary,
              total_salary: payrollData.total_salary,
              has_attendance_bonus: payrollData.has_attendance_bonus,
              attendance_bonus: payrollData.attendance_bonus,
              updated_at: payrollData.updated_at,
            })
            .eq("id", existingPayroll.id)
            .select()
            .single()

          if (updateError) {
            console.error(`Error al actualizar nómina para empleado ${employee.id}:`, updateError)
            return null
          }

          console.log(`API: Nómina actualizada:`, updatedPayroll)
          payrollId = existingPayroll.id

          // Eliminar detalles existentes
          const { error: deleteDetailsError } = await supabase
            .from("payroll_details")
            .delete()
            .eq("payroll_id", payrollId)

          if (deleteDetailsError) {
            console.error(`Error al eliminar detalles existentes:`, deleteDetailsError)
          }
        } else {
          console.log(`API: Creando nueva nómina para empleado ${employee.id}`)

          // Crear nueva nómina
          const { data: newPayroll, error: insertError } = await supabase
            .from("payroll")
            .insert(payrollData)
            .select()
            .single()

          if (insertError) {
            console.error(`Error al crear nómina para empleado ${employee.id}:`, insertError)
            return null
          }

          console.log(`API: Nueva nómina creada:`, newPayroll)
          payrollId = newPayroll.id
        }

        // 3.7 Verificar que la nómina se haya guardado correctamente
        const { data: payrollAfterSave, error: fetchError } = await supabase
          .from("payroll")
          .select("*")
          .eq("id", payrollId)
          .single()

        if (fetchError) {
          console.error("Error al verificar nómina guardada:", fetchError)
        } else {
          console.log(`API: NÓMINA DESPUÉS DE GUARDAR:
- ID: ${payrollId}
- Deducciones: ${payrollAfterSave.deductions !== null ? payrollAfterSave.deductions : "NO PRESENTE"}
- Adiciones: ${payrollAfterSave.additions !== null ? payrollAfterSave.additions : "NO PRESENTE"}
- Sueldo en Banco: ${payrollAfterSave.bank_salary}
- Sueldo en Mano (guardado): ${payrollAfterSave.hand_salary}
- Sueldo Final en Mano: ${payrollAfterSave.final_hand_salary}
- Total a Pagar: ${payrollAfterSave.total_salary}
`)
        }

        // NUEVO: Verificación adicional después de guardar
        const { data: verificationPayroll } = await supabase
          .from("payroll")
          .select("total_salary, final_hand_salary, bank_salary")
          .eq("id", payrollId)
          .single()

        if (verificationPayroll) {
          console.log(`API: VERIFICACIÓN POST-GUARDADO:
- total_salary guardado: ${verificationPayroll.total_salary}
- final_hand_salary guardado: ${verificationPayroll.final_hand_salary}
- bank_salary guardado: ${verificationPayroll.bank_salary}
- ¿Total correcto?: ${Math.abs(verificationPayroll.total_salary - (verificationPayroll.final_hand_salary + verificationPayroll.bank_salary)) < 1}`)
        }

        // 3.8 Insertar detalles de nómina
        if (details.length > 0) {
          console.log(`API: Guardando ${details.length} detalles para la nómina ${payrollId}`)

          const detailsToInsert = details.map((detail) => ({
            payroll_id: payrollId,
            concept: detail.concept,
            type: detail.type,
            amount: Number(detail.amount), // Asegurar que sea número
            date: detail.date,
            notes: detail.notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))

          const { data: insertedDetails, error: detailsError } = await supabase
            .from("payroll_details")
            .insert(detailsToInsert)
            .select()

          if (detailsError) {
            console.error(`Error al insertar detalles de nómina para empleado ${employee.id}:`, detailsError)
          } else {
            console.log(`API: Detalles guardados correctamente:`, insertedDetails)
          }
        }

        return { employeeId: employee.id, payrollId, success: true }
      } catch (employeeError) {
        console.error(`Error procesando empleado ${employee.id}:`, employeeError)
        return { employeeId: employee.id, payrollId: null, success: false, error: employeeError.message }
      }
    })

    // Esperar a que todas las nóminas se procesen
    const results = await Promise.all(payrollPromises)
    const successfulPayrolls = results.filter((result) => result !== null && result.success)
    const failedPayrolls = results.filter((result) => result !== null && !result.success)

    console.log(`API: Proceso completado - Exitosas: ${successfulPayrolls.length}, Fallidas: ${failedPayrolls.length}`)

    return NextResponse.json({
      success: true,
      message: `Se generaron/actualizaron ${successfulPayrolls.length} nóminas para ${month}/${year}`,
      payrolls: successfulPayrolls,
      failed: failedPayrolls,
      summary: {
        total: employees.length,
        successful: successfulPayrolls.length,
        failed: failedPayrolls.length,
      },
    })
  } catch (error: any) {
    console.error("Error en la generación de nóminas:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}

// Función para calcular deducciones y adiciones basadas en asistencias
// Esta función replica la lógica del PayrollService para mantener consistencia
function calculateAdjustmentsFromAttendances(attendances: any[], baseSalary: number) {
  console.log("API: Calculando ajustes a partir de asistencias")
  console.log("API: Salario base para cálculos:", baseSalary)
  console.log("API: Número de asistencias:", attendances.length)

  // Inspeccionar los datos de asistencia
  if (attendances.length > 0) {
    console.log("API: Campos disponibles en el primer registro:", Object.keys(attendances[0]))
    console.log("API: Muestra de la primera asistencia:", JSON.stringify(attendances[0], null, 2))
  }

  let deductions = 0
  let additions = 0
  const details = []

  // Valor del minuto (basado en el salario base)
  const dailySalary = baseSalary / 30 // Salario diario
  const hourSalary = dailySalary / 8 // Salario por hora (asumiendo 8 horas por día)
  const minuteSalary = hourSalary / 60 // Salario por minuto

  console.log(`API: Valores para cálculos - Diario: ${dailySalary}, Hora: ${hourSalary}, Minuto: ${minuteSalary}`)

  // Procesar cada asistencia
  for (const attendance of attendances) {
    console.log(`API: Procesando asistencia del día ${attendance.date}`)

    // Verificar si hay datos relevantes para cálculos
    console.log(
      `API: Datos de asistencia - isAbsent: ${attendance.is_absent}, isJustified: ${attendance.is_justified}, isHoliday: ${attendance.is_holiday}`,
    )
    console.log(
      `API: Minutos - lateMinutes: ${attendance.late_minutes}, earlyDepartureMinutes: ${attendance.early_departure_minutes}, extraMinutes: ${attendance.extra_minutes}`,
    )

    // IMPORTANTE: Verificar si los campos existen y tienen valores numéricos
    const lateMinutes = typeof attendance.late_minutes === "number" ? attendance.late_minutes : 0
    const earlyDepartureMinutes =
      typeof attendance.early_departure_minutes === "number" ? attendance.early_departure_minutes : 0
    const extraMinutes = typeof attendance.extra_minutes === "number" ? attendance.extra_minutes : 0
    const isAbsent = Boolean(attendance.is_absent)
    const isJustified = Boolean(attendance.is_justified)
    const isHoliday = Boolean(attendance.is_holiday)

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
      console.log(`API: Ausencia injustificada. Deducción: ${absenceDeduction}`)
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
      console.log(`API: Llegada tarde: ${lateMinutes} min. Deducción: ${lateDeduction}`)
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
      console.log(`API: Salida anticipada: ${earlyDepartureMinutes} min. Deducción: ${earlyDeduction}`)
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
      console.log(`API: Horas extra: ${extraMinutes} min. Adición: ${extraAddition}`)
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
      console.log(`API: Feriado trabajado. Adición: ${holidayAddition}`)
    }
  }

  // IMPORTANTE: Asegurarse de que los valores sean números y estén redondeados
  deductions = Number(Math.round(deductions * 100) / 100)
  additions = Number(Math.round(additions * 100) / 100)

  console.log(
    `API: RESUMEN - Total deducciones: ${deductions}, Total adiciones: ${additions}, Detalles: ${details.length}`,
  )

  return { deductions, additions, details }
}