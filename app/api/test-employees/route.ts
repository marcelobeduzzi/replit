import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Crear cliente con rol de servicio que omite RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Consultar empleados
    const { data, error } = await supabaseAdmin
      .from('employees')
      .select('*')
    
    if (error) {
      console.error('Error al consultar empleados:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Verificar si hay datos
    console.log('Número de empleados encontrados:', data?.length || 0)
    
    return NextResponse.json({ 
      success: true, 
      count: data?.length || 0,
      data: data || []
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al consultar empleados' }, { status: 500 })
  }
}