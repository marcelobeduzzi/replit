import { NextResponse } from "next/server"
import { AutoOrderService } from "@/lib/auto-order-service-v2"

export async function POST() {
  try {
    // Generar pedidos basados en stock-matrix
    const result = await AutoOrderService.generateOrdersFromStockMatrix()

    return NextResponse.json({
      success: true,
      ordersCreated: result.ordersCreated,
      orderDetails: result.orderDetails,
    })
  } catch (error) {
    console.error("Error al generar pedidos automáticos:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
