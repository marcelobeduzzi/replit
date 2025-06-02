// Datos de ventas para dos turnos completos (mañana y tarde)

export const testSalesDataMañana = {
  id: "sales-morning",
  localId: "local-1",
  localName: "BR Cabildo",
  date: new Date().toISOString(),
  shift: "mañana",
  items: [
    {
      productId: "prod-1",
      productName: "Empanadas",
      quantity: 45,
      unitPrice: 500,
      totalPrice: 22500,
      paymentMethod: "Efectivo",
    },
    {
      productId: "prod-1",
      productName: "Empanadas",
      quantity: 15,
      unitPrice: 550,
      totalPrice: 8250,
      paymentMethod: "PedidosYa",
    },
    {
      productId: "prod-2",
      productName: "Pizzas Muzzarella",
      quantity: 8,
      unitPrice: 3500,
      totalPrice: 28000,
      paymentMethod: "Efectivo",
    },
    {
      productId: "prod-2",
      productName: "Pizzas Muzzarella",
      quantity: 3,
      unitPrice: 3800,
      totalPrice: 11400,
      paymentMethod: "Rappi",
    },
    {
      productId: "prod-3",
      productName: "Pizzas Doble Muzzarella",
      quantity: 5,
      unitPrice: 4000,
      totalPrice: 20000,
      paymentMethod: "Tarjeta de Crédito",
    },
    {
      productId: "prod-3",
      productName: "Pizzas Doble Muzzarella",
      quantity: 2,
      unitPrice: 4300,
      totalPrice: 8600,
      paymentMethod: "PedidosYa",
    },
    {
      productId: "prod-4",
      productName: "Medialunas de Grasa",
      quantity: 40,
      unitPrice: 300,
      totalPrice: 12000,
      paymentMethod: "Efectivo",
    },
    {
      productId: "prod-5",
      productName: "Medialunas de Manteca",
      quantity: 35,
      unitPrice: 350,
      totalPrice: 12250,
      paymentMethod: "Efectivo",
    },
    {
      productId: "prod-6",
      productName: "Almibar",
      quantity: 12,
      unitPrice: 400,
      totalPrice: 4800,
      paymentMethod: "Efectivo",
    },
    {
      productId: "prod-7",
      productName: "Pepsi 500ml",
      quantity: 25,
      unitPrice: 800,
      totalPrice: 20000,
      paymentMethod: "Efectivo",
    },
    {
      productId: "prod-8",
      productName: "7UP 500ml",
      quantity: 18,
      unitPrice: 800,
      totalPrice: 14400,
      paymentMethod: "Efectivo",
    },
  ],
  totalAmount: 162200,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastSync: new Date().toISOString(),
}

export const testSalesDataTarde = {
  id: "sales-afternoon",
  localId: "local-1",
  localName: "BR Cabildo",
  date: new Date().toISOString(),
  shift: "tarde",
  items: [
    {
      productId: "prod-1",
      productName: "Empanadas",
      quantity: 38,
      unitPrice: 500,
      totalPrice: 19000,
      paymentMethod: "Efectivo",
    },
    {
      productId: "prod-1",
      productName: "Empanadas",
      quantity: 22,
      unitPrice: 550,
      totalPrice: 12100,
      paymentMethod: "PedidosYa",
    },
    {
      productId: "prod-2",
      productName: "Pizzas Muzzarella",
      quantity: 10,
      unitPrice: 3500,
      totalPrice: 35000,
      paymentMethod: "Efectivo",
    },
    {
      productId: "prod-2",
      productName: "Pizzas Muzzarella",
      quantity: 5,
      unitPrice: 3800,
      totalPrice: 19000,
      paymentMethod: "Rappi",
    },
    {
      productId: "prod-3",
      productName: "Pizzas Doble Muzzarella",
      quantity: 8,
      unitPrice: 4000,
      totalPrice: 32000,
      paymentMethod: "Tarjeta de Crédito",
    },
    {
      productId: "prod-3",
      productName: "Pizzas Doble Muzzarella",
      quantity: 4,
      unitPrice: 4300,
      totalPrice: 17200,
      paymentMethod: "PedidosYa",
    },
    {
      productId: "prod-9",
      productName: "Fanta 500ml",
      quantity: 15,
      unitPrice: 800,
      totalPrice: 12000,
      paymentMethod: "Efectivo",
    },
    {
      productId: "prod-10",
      productName: "Agua sin Gas 500ml",
      quantity: 20,
      unitPrice: 700,
      totalPrice: 14000,
      paymentMethod: "Efectivo",
    },
    {
      productId: "prod-11",
      productName: "Agua con Gas 500ml",
      quantity: 12,
      unitPrice: 700,
      totalPrice: 8400,
      paymentMethod: "Efectivo",
    },
    {
      productId: "prod-12",
      productName: "Quilmes 500ml",
      quantity: 18,
      unitPrice: 1200,
      totalPrice: 21600,
      paymentMethod: "Efectivo",
    },
    {
      productId: "prod-13",
      productName: "Pepsi Grande",
      quantity: 8,
      unitPrice: 1500,
      totalPrice: 12000,
      paymentMethod: "Efectivo",
    },
  ],
  totalAmount: 202300,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastSync: new Date().toISOString(),
}

// Función para obtener datos de ventas según el turno
export function getSalesDataByShift(shift: string) {
  if (shift === "mañana" || shift === "morning") {
    return testSalesDataMañana
  } else if (shift === "tarde" || shift === "afternoon") {
    return testSalesDataTarde
  } else {
    // Si no se especifica turno o es otro, devolver datos del turno de mañana por defecto
    return testSalesDataMañana
  }
}

// Función para obtener todos los datos de ventas
export function getAllSalesData() {
  return {
    morning: testSalesDataMañana,
    afternoon: testSalesDataTarde,
  }
}

