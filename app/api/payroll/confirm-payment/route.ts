
import { NextRequest, NextResponse } from 'next/server'
import { payrollService } from '@/lib/payroll-service'

export async function POST(request: NextRequest) {
  try {
    const { payrollId, paymentMethod, paymentReference } = await request.json()

    if (!payrollId || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'ID de nómina y método de pago son requeridos' },
        { status: 400 }
      )
    }

    console.log(`💰 Confirmando pago para nómina: ${payrollId}`)

    const result = await payrollService.confirmPayment(
      payrollId, 
      paymentMethod, 
      paymentReference
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Pago confirmado exitosamente'
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

  } catch (error: any) {
    console.error('❌ Error en API de confirmación de pago:', error)
    return NextResponse.json(
      { success: false, error: `Error interno del servidor: ${error.message}` },
      { status: 500 }
    )
  }
}
