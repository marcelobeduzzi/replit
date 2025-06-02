import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    // Obtener las asistencias más recientes
    const attendances = await db.attendance.findMany({
      take: limit,
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json(attendances)
  } catch (error) {
    console.error("Error al obtener asistencias recientes:", error)
    return NextResponse.json({ error: "Error al obtener asistencias recientes" }, { status: 500 })
  }
}

