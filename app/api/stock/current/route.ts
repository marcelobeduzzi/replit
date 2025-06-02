import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const localId = searchParams.get("localId")

    if (!localId) {
      return NextResponse.json({ error: "Se requiere el ID del local" }, { status: 400 })
    }

    // Aquí iría la lógica para obtener el stock actual
    // Por ahora, devolvemos datos de ejemplo
    const currentStock: Record<string, number> = {
      // Empanadas
      emp_bondiola: 10,
      emp_humita: 8,
      emp_verdura: 12,
      emp_carne_suave: 15,
      emp_pollo: 10,
      emp_carne_picante: 5,
      emp_queso_cebolla: 8,
      emp_jamon_queso: 20,
      emp_roquefort: 6,
      emp_capresse: 7,
      emp_cheeseburger: 9,

      // Pizzas
      pizza_muzzarella: 5,
      pizza_doble_muzzarella: 3,

      // Medialunas
      med_grasa: 20,
      med_manteca: 15,

      // Cajas
      caja_pizza: 10,
      caja_empanada: 15,

      // Sobres
      sobre_chico: 20,
      sobre_mediano: 15,
      sobre_grande: 10,

      // Almíbar
      almibar: 2,
    }

    return NextResponse.json(currentStock)
  } catch (error) {
    console.error("Error al obtener stock actual:", error)
    return NextResponse.json({ error: "Error al obtener stock actual" }, { status: 500 })
  }
}

