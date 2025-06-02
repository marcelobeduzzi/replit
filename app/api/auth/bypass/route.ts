// app/api/auth/bypass/route.ts
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
    
    // Desactivar RLS para la tabla employees
    await supabaseAdmin.rpc('disable_rls', { table_name: 'employees' })
    
    return NextResponse.json({ success: true, message: 'RLS desactivado para employees' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al desactivar RLS' }, { status: 500 })
  }
}

// Función para desactivar RLS (debes crearla en Supabase)
/*
CREATE OR REPLACE FUNCTION public.disable_rls(table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', table_name);
END;
$$;
*/