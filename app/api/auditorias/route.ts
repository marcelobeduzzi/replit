import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (id) {
      // Obtener una auditoría específica por ID
      const audit = await db.supabase.from("audits").select("*").eq("id", id).single()

      if (audit.error) {
        return NextResponse.json({ error: "Auditoría no encontrada" }, { status: 404 })
      }

      return NextResponse.json(audit.data)
    } else {
      // Obtener todas las auditorías
      const { data, error } = await db.supabase.from("audits").select("*").order("date", { ascending: false })

      if (error) {
        console.error("Error al obtener auditorías:", error)
        return NextResponse.json({ error: "Error al obtener auditorías" }, { status: 500 })
      }

      return NextResponse.json(data)
    }
  } catch (error) {
    console.error("Error en GET /api/auditorias:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Asegurarse de que los campos requeridos estén presentes
    if (!body.localId && !body.local_id) {
      return NextResponse.json({ error: "Falta el ID del local" }, { status: 400 })
    }

    if (!body.auditorName && !body.auditor_name) {
      return NextResponse.json({ error: "Falta el nombre del auditor" }, { status: 400 })
    }

    if (!body.date) {
      return NextResponse.json({ error: "Falta la fecha de la auditoría" }, { status: 400 })
    }

    if (!body.categories) {
      return NextResponse.json({ error: "Faltan las categorías de la auditoría" }, { status: 400 })
    }

    // Calcular puntajes si no están presentes
    let totalScore = body.totalScore || body.total_score || 0
    let maxScore = body.maxScore || body.max_score || 0

    if ((totalScore === 0 || maxScore === 0) && Array.isArray(body.categories)) {
      body.categories.forEach((category: any) => {
        totalScore += category.score || 0
        maxScore += category.maxScore || 0
      })
    }

    // Calcular porcentaje
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

    // Preparar datos para guardar
    const auditData = {
      local_id: body.localId || body.local_id,
      local_name: body.localName || body.local_name || "",
      date: new Date(body.date).toISOString().split("T")[0],
      auditor_name: body.auditorName || body.auditor_name,
      categories: body.categories,
      total_score: totalScore,
      max_score: maxScore,
      percentage: percentage,
      notes: body.notes || body.generalObservations || "",
      audited: body.audited !== undefined ? body.audited : false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Insertar en la base de datos
    const { data, error } = await db.supabase.from("audits").insert([auditData]).select().single()

    if (error) {
      console.error("Error al crear auditoría:", error)
      return NextResponse.json({ error: "Error al crear auditoría: " + error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error en POST /api/auditorias:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: "Se requiere el ID de la auditoría" }, { status: 400 })
    }

    // Preparar datos para actualizar
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Solo actualizar los campos proporcionados
    if (body.audited !== undefined) {
      updateData.audited = body.audited
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes
    }

    if (body.auditor_name !== undefined) {
      updateData.auditor_name = body.auditor_name
    }

    if (body.categories !== undefined) {
      updateData.categories = body.categories

      // Recalcular puntajes si se actualizan las categorías
      let totalScore = 0
      let maxScore = 0

      if (Array.isArray(body.categories)) {
        body.categories.forEach((category: any) => {
          totalScore += category.score || 0
          maxScore += category.maxScore || 0
        })
      }

      updateData.total_score = totalScore
      updateData.max_score = maxScore
      updateData.percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
    }

    // Actualizar en la base de datos
    const { data, error } = await db.supabase.from("audits").update(updateData).eq("id", body.id).select().single()

    if (error) {
      console.error("Error al actualizar auditoría:", error)
      return NextResponse.json({ error: "Error al actualizar auditoría: " + error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error en PUT /api/auditorias:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Se requiere el ID de la auditoría" }, { status: 400 })
    }

    const { error } = await db.supabase.from("audits").delete().eq("id", id)

    if (error) {
      console.error("Error al eliminar auditoría:", error)
      return NextResponse.json({ error: "Error al eliminar auditoría: " + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error en DELETE /api/auditorias:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

