import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const audit = await db.audit.findUnique({
      where: { id },
    })

    if (!audit) {
      return NextResponse.json({ error: "Auditoría no encontrada" }, { status: 404 })
    }

    return NextResponse.json(audit)
  } catch (error) {
    console.error("Error al obtener auditoría:", error)
    return NextResponse.json({ error: "Error al obtener auditoría" }, { status: 500 })
  }
}

