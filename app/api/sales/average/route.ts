import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const localId = searchParams.get("localId")

    if (!localId) {
      return NextResponse.json({ error: "Se requiere el ID del local" }, { status: 400 })
    }

    // Aquí iría la lógica para obtener el promedio de ventas
    // Por ahora, devolvemos datos de ejemplo
    const averageSales: Record<string, number> = {
      // Empanadas
      emp_bondiola: 50,
      emp_humita: 40,
      emp_verdura: 45,
      emp_carne_suave: 60,
      emp_pollo: 55,
      emp_carne_picante: 35,
      emp_queso_cebolla: 45,
      emp_jamon_queso: 65,
      emp_roquefort: 30,
      emp_capresse: 40,
      emp_cheeseburger: 50,

      // Pizzas
      pizza_muzzarella: 20,
      pizza_doble_muzzarella: 15,

      // Medialunas
      med_grasa: 100,
      med_manteca: 80,

      // Cajas
      caja_pizza: 30,
      caja_empanada: 40,

      // Sobres
      sobre_chico: 50,
      sobre_mediano: 40,
      sobre_grande: 30,

      // Almíbar
      almibar: 5,
    }

    return NextResponse.json(averageSales)
  } catch (error) {
    console.error("Error al obtener promedio de ventas:", error)
    return NextResponse.json({ error: "Error al obtener promedio de ventas" }, { status: 500 })
  }
}

