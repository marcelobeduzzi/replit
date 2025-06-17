import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Cuerpo de la solicitud recibido:", body)

    const { payrollId, paymentType } = body

    if (!payrollId) {
      console.error("payrollId faltante en la solicitud")
      return NextResponse.json({ error: "payrollId es requerido" }, { status: 400 })
    }

    if (!paymentType) {
      console.error("paymentType faltante en la solicitud")
      return NextResponse.json({ error: "paymentType es requerido" }, { status: 400 })
    }

    console.log(`Confirmando pago - ID: ${payrollId}, Tipo: ${paymentType}`)

    // Crear instancia de Supabase para el servidor
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    )

    // Primero, obtener la nómina actual para verificar que existe
    const { data: currentPayroll, error: fetchError } = await supabase
      .from("payroll")
      .select("*")
      .eq("id", payrollId)
      .single()

    if (fetchError) {
      console.error("Error al obtener nómina:", fetchError)
      return NextResponse.json({ 
        error: "Nómina no encontrada", 
        details: fetchError.message 
      }, { status: 404 })
    }

    if (!currentPayroll) {
      console.error("Nómina no encontrada con ID:", payrollId)
      return NextResponse.json({ error: "Nómina no encontrada" }, { status: 404 })
    }

    console.log("Nómina actual encontrada:", currentPayroll)

    // Preparar los datos de actualización según el tipo de pago
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    const now = new Date().toISOString()

    if (paymentType === 'hand') {
      updateData.is_paid_hand = true
      updateData.hand_payment_date = now
      console.log("Marcando pago en mano como completado")
    } else if (paymentType === 'bank') {
      updateData.is_paid_bank = true
      updateData.bank_payment_date = now
      console.log("Marcando pago en banco como completado")
    } else if (paymentType === 'total' || paymentType === 'all') {
      updateData.is_paid_hand = true
      updateData.is_paid_bank = true
      updateData.hand_payment_date = now
      updateData.bank_payment_date = now
      console.log("Marcando ambos pagos como completados")
    } else {
      console.error("Tipo de pago inválido:", paymentType)
      return NextResponse.json({ error: `Tipo de pago inválido: ${paymentType}` }, { status: 400 })
    }

    console.log("Datos a actualizar:", updateData)

    // Actualizar la nómina
    const { data, error } = await supabase
      .from("payroll")
      .update(updateData)
      .eq("id", payrollId)
      .select(`
        *,
        employees!inner (
          id,
          first_name,
          last_name,
          position
        )
      `)
      .single()

    if (error) {
      console.error("Error al actualizar nómina:", error)
      return NextResponse.json({ 
        error: "Error al confirmar pago", 
        details: error.message 
      }, { status: 500 })
    }

    if (!data) {
      console.error("No se recibieron datos después de la actualización")
      return NextResponse.json({ 
        error: "Error al confirmar pago - sin datos de respuesta" 
      }, { status: 500 })
    }

    console.log("Pago confirmado exitosamente:", data)

    // Formatear la respuesta para el frontend
    const formattedData = {
      id: data.id,
      employee_id: data.employee_id,
      year: data.year,
      month: data.month,
      hand_salary: Number(data.hand_salary || 0),
      bank_salary: Number(data.bank_salary || 0),
      final_hand_salary: Number(data.final_hand_salary || 0),
      total_salary: Number(data.total_salary || 0),
      is_paid: Boolean(data.is_paid),
      is_paid_hand: Boolean(data.is_paid_hand),
      is_paid_bank: Boolean(data.is_paid_bank),
      hand_payment_date: data.hand_payment_date,
      bank_payment_date: data.bank_payment_date,
      updated_at: data.updated_at,
      employees: data.employees
    }

    return NextResponse.json({ 
      success: true, 
      message: "Pago confirmado correctamente",
      data: formattedData
    })

  } catch (error: any) {
    console.error("Error general en confirmación de pago:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor", 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}