import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Verificar si el empleado existe
    const employee = await db.employee.findUnique({
      where: { id },
    })

    if (!employee) {
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 })
    }

    // Eliminar el empleado
    await db.employee.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar empleado:", error)
    return NextResponse.json({ error: "Error al eliminar empleado" }, { status: 500 })
  }
}

