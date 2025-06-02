// Archivo: app/api/auditorias/config/route.ts

import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Configuración con las categorías e ítems que proporcionaste
const defaultAuditConfig = {
  categories: [
    {
      id: "limpieza",
      name: "Limpieza",
      maxScore: 40,
      items: [
        { id: "atril", name: "Atril", maxScore: 1 },
        { id: "mesas_trabajo", name: "Mesas de Trabajo", maxScore: 1 },
        { id: "marquesina", name: "Marquesina", maxScore: 2 },
        { id: "vidrios_exhibidores", name: "Vidrios Exhibidores", maxScore: 2 },
        { id: "exhibidor_interno", name: "Exhibidor parte Interna", maxScore: 1 },
        { id: "pisos", name: "Pisos", maxScore: 2 },
        { id: "paredes_ceramicas", name: "Paredes/Cerámicas", maxScore: 2 },
        { id: "latas_bandejas", name: "Latas y Bandejas", maxScore: 2 },
        { id: "banos", name: "Baños", maxScore: 2 },
        { id: "latas_exhibidas", name: "Latas Exhibidas", maxScore: 3 },
        { id: "heladeras_exhibidoras", name: "Heladeras Exhibidoras", maxScore: 2 },
        { id: "mueble_caja", name: "Mueble de Caja", maxScore: 2 },
        { id: "fermentadora", name: "Fermentadora", maxScore: 1 },
        { id: "horno", name: "Horno", maxScore: 2 },
        { id: "camara_frio", name: "Cámara de Frío", maxScore: 2 },
        { id: "deposito", name: "Depósito", maxScore: 2 },
        { id: "bacha", name: "Bacha", maxScore: 1 },
        { id: "teles", name: "Teles", maxScore: 2 },
        { id: "maquina_cafe", name: "Máquina de Café", maxScore: 2 },
        { id: "tacho_basura", name: "Tacho de Basura", maxScore: 3 },
        { id: "dispenser", name: "Dispenser", maxScore: 1 }
      ]
    },
    {
      id: "orden",
      name: "Orden",
      maxScore: 16,
      items: [
        { id: "cajas_armadas", name: "Cajas de Pizza y Empanadas Armadas", maxScore: 4 },
        { id: "utensillos", name: "Utensillos en su lugar", maxScore: 2 },
        { id: "guantes_pinzas", name: "Guantes y Pinzas listos para usar", maxScore: 3 },
        { id: "deposito_ordenado", name: "Depósito Ordenado", maxScore: 2 },
        { id: "exhibidora_orden", name: "Exhibidora en orden", maxScore: 4 },
        { id: "productos_limpieza", name: "Productos de limpieza en su lugar", maxScore: 1 }
      ]
    },
    {
      id: "atencion_cliente",
      name: "Atención al Cliente",
      maxScore: 22,
      items: [
        { id: "personal_completo", name: "Personal Completo", maxScore: 4 },
        { id: "atencion_cliente", name: "Atención al Cliente", maxScore: 5 },
        { id: "caja_cambio", name: "Caja con Cambio suficiente", maxScore: 3 },
        { id: "tiempos_espera", name: "Tiempos de Espera en Ventas", maxScore: 3 },
        { id: "venta_sugestiva", name: "Venta Sugestiva", maxScore: 4 },
        { id: "uniformes", name: "Uniformes del personal", maxScore: 3 }
      ]
    },
    {
      id: "operatividad",
      name: "Operatividad",
      maxScore: 28,
      items: [
        { id: "exhibicion_completa", name: "Exhibición de productos completa", maxScore: 5 },
        { id: "precios_actualizados", name: "Precios actualizados", maxScore: 5 },
        { id: "rotulos_visibles", name: "Rótulos en bandejas visibles", maxScore: 5 },
        { id: "bandejeo_completo", name: "Bandejeo completo en heladeras", maxScore: 4 },
        { id: "rotacion_eficiente", name: "Rotación Eficiente", maxScore: 5 },
        { id: "gustos_orden", name: "Gustos en orden en exhibición", maxScore: 4 }
      ]
    },
    {
      id: "temperaturas_equipamiento",
      name: "Equipamiento",
      maxScore: 19,
      items: [
        { id: "temperatura_horno", name: "Temperatura correcta de Horno", maxScore: 5 },
        { id: "fermentadora_agua", name: "Fermentadora con Agua", maxScore: 3 },
        { id: "camara_frio_temperatura", name: "Cámara de Frío en temperatura", maxScore: 5 },
        { id: "heladera_temperatura", name: "Heladera Exhibidora en Temperatura", maxScore: 3 },
        { id: "lamparas_calor", name: "Lámparas de Calor funcionando", maxScore: 3 }
      ]
    },
    {
      id: "apps_delivery",
      name: "Delivery",
      maxScore: 15,
      items: [
        { id: "apps_prendidas", name: "Apps prendidas", maxScore: 5 },
        { id: "horario_cierre_apertura", name: "Horario de cierre y apertura", maxScore: 5 },
        { id: "productos_activados", name: "Productos correspondientes activados", maxScore: 5 }
      ]
    },
    {
      id: "legales",
      name: "Legales",
      maxScore: 28,
      items: [
        { id: "cartel_afip", name: "Cartel de AFIP Exhibido", maxScore: 5 },
        { id: "manipulacion_alimentos", name: "Manipulación de Alimentos al día", maxScore: 3 },
        { id: "desinfeccion", name: "Desinfección Último Mes", maxScore: 4 },
        { id: "seguro_integral", name: "Seguro Integral de Comercio", maxScore: 5 },
        { id: "evacuacion_matafuegos", name: "Evacuación y Matafuegos", maxScore: 4 },
        { id: "qr_habilitacion", name: "QR Habilitación", maxScore: 5 },
        { id: "libro_quejas", name: "Libro de Quejas y Actas", maxScore: 2 }
      ]
    }
  ]
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Intentar obtener la configuración existente
    const { data, error } = await supabase
      .from('audit_config')
      .select('*')
      .limit(1)
      .single()
    
    if (error) {
      console.error('Error al obtener configuración:', error)
      
      // Si el error es porque la tabla no existe o está vacía, devolver la configuración predeterminada
      return NextResponse.json(defaultAuditConfig)
    }
    
    return NextResponse.json(data || defaultAuditConfig)
  } catch (error) {
    console.error('Error en API de configuración de auditorías:', error)
    return NextResponse.json(defaultAuditConfig)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const config = await request.json()
    
    // Verificar si ya existe una configuración
    const { data: existingConfig, error: checkError } = await supabase
      .from('audit_config')
      .select('id')
      .limit(1)
    
    if (checkError) {
      console.error('Error al verificar configuración existente:', checkError)
      return NextResponse.json({ error: 'Error al verificar configuración existente' }, { status: 500 })
    }
    
    let result
    
    if (existingConfig && existingConfig.length > 0) {
      // Actualizar configuración existente
      const { data, error } = await supabase
        .from('audit_config')
        .update(config)
        .eq('id', existingConfig[0].id)
        .select()
      
      if (error) {
        console.error('Error al actualizar configuración:', error)
        return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 })
      }
      
      result = data
    } else {
      // Crear nueva configuración
      const { data, error } = await supabase
        .from('audit_config')
        .insert([config])
        .select()
      
      if (error) {
        console.error('Error al crear configuración:', error)
        return NextResponse.json({ error: 'Error al crear configuración' }, { status: 500 })
      }
      
      result = data
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error en API de configuración de auditorías:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}