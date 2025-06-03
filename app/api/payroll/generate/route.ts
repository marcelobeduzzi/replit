import { NextRequest, NextResponse } from 'next/server'
import { payrollService } from '@/lib/payroll-service'

export async function POST(request: NextRequest) {
  try {
    const { period, regenerate } = await request.json()

    if (!period) {
      return NextResponse.json(
        { success: false, error: 'El período es requerido' },
        { status: 400 }
      )
    }

    // Validar formato del período (YYYY-MM)
    const periodRegex = /^\d{4}-\d{2}$/
    if (!periodRegex.test(period)) {
      return NextResponse.json(
        { success: false, error: 'El período debe tener el formato YYYY-MM' },
        { status: 400 }
      )
    }

    let result

    if (regenerate) {
      console.log(`🔄 Regenerando nóminas para período: ${period}`)
      result = await payrollService.regeneratePayroll(period)
    } else {
      console.log(`✨ Generando nóminas para período: ${period}`)
      result = await payrollService.generatePayroll(period)
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Nóminas ${regenerate ? 'regeneradas' : 'generadas'} exitosamente`,
        data: result.data
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

  } catch (error: any) {
    console.error('❌ Error en API de generación de nóminas:', error)
    return NextResponse.json(
      { success: false, error: `Error interno del servidor: ${error.message}` },
      { status: 500 }
    )
  }
}