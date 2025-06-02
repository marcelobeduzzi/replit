import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const orders = await db.order.findMany({
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error al obtener pedidos:", error)
    return NextResponse.json({ error: "Error al obtener pedidos" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const order = await db.order.create({
      data: {
        localId: data.localId,
        date: data.date,
        items: data.items,
        stock: data.stock,
        deliveryDate: data.deliveryDate,
        status: data.status || "pending",
        createdAt: new Date().toISOString(),
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error al crear pedido:", error)
    return NextResponse.json({ error: "Error al crear pedido" }, { status: 500 })
  }
}

