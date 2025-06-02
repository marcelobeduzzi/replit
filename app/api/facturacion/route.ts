import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Obtener los datos de la solicitud
    const requestData = await request.json()

    console.log("Enviando solicitud a TusFacturas:", JSON.stringify(requestData, null, 2))

    // Hacer la solicitud a TusFacturas desde el servidor
    const response = await fetch("https://www.tusfacturas.app/app/api/v2/facturacion/nuevo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    })

    // Obtener el texto de la respuesta para depuración
    const responseText = await response.text()
    console.log("Respuesta de TusFacturas:", responseText)

    // Intentar parsear la respuesta como JSON
    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Error al parsear la respuesta JSON:", parseError)
      return NextResponse.json(
        {
          error: true,
          errores: ["Error al parsear la respuesta del servidor: " + responseText],
        },
        { status: 500 },
      )
    }

    // Devolver la respuesta al cliente
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Error en el proxy de facturación:", error)
    return NextResponse.json(
      {
        error: true,
        errores: [error instanceof Error ? error.message : "Error desconocido"],
      },
      { status: 500 },
    )
  }
}
