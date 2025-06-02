"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Truck, History, BarChart2, Package, Settings, Bell } from 'lucide-react'

export default function VentasPage() {
  const router = useRouter()
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Control de Ventas</h1>
        <p className="text-muted-foreground">
          Gestiona todas las operaciones de venta desde un solo lugar
        </p>
      </div>
      
      <Tabs defaultValue="ventas" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-3xl">
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="reportes">Reportes</TabsTrigger>
        </TabsList>
        
        {/* Sección de Ventas */}
        <TabsContent value="ventas" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Punto de Venta</CardTitle>
                <CardDescription>
                  Registra ventas rápidamente con nuestra interfaz optimizada
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <ShoppingCart className="h-16 w-16 text-primary mb-4" />
                <p className="text-center mb-6">
                  Accede al punto de venta para registrar ventas de manera rápida y sencilla.
                  Ideal para tablets y dispositivos móviles.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => router.push('/pos')}
                >
                  Abrir Punto de Venta
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
                <CardDescription>
                  Accede a las funciones más utilizadas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => router.push('/ventas/productos')}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Gestionar Productos
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => router.push('/ventas/inventario')}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Inventario
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => router.push('/ventas/historial')}
                >
                  <History className="mr-2 h-4 w-4" />
                  Historial de Ventas
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => router.push('/ventas/reportes')}
                >
                  <BarChart2 className="mr-2 h-4 w-4" />
                  Reportes
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => router.push('/ventas/alertas')}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Alertas de Stock
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <RecentSales />
        </TabsContent>
        
        {/* Sección de Delivery */}
        <TabsContent value="delivery" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Gestión de Pedidos Delivery</CardTitle>
                <CardDescription>
                  Administra los pedidos de las diferentes plataformas
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <Truck className="h-16 w-16 text-primary mb-4" />
                <p className="text-center mb-6">
                  Recibe y gestiona los pedidos de PedidosYa, Rappi y otras plataformas.
                  Confirma pedidos, asigna repartidores y más.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => router.push('/ventas/delivery')}
                >
                  Gestionar Pedidos Delivery
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Plataformas</CardTitle>
                <CardDescription>
                  Accede a las diferentes plataformas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-[#FF5A5F] text-white hover:bg-[#FF5A5F]/90 hover:text-white"
                >
                  PedidosYa
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-[#FF9500] text-white hover:bg-[#FF9500]/90 hover:text-white"
                >
                  Rappi
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  Configurar Integraciones
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <PendingDeliveryOrders />
        </TabsContent>
        
        {/* Sección de Historial */}
        <TabsContent value="historial">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Ventas</CardTitle>
              <CardDescription>
                Consulta el historial completo de ventas
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <History className="h-16 w-16 text-primary mb-4" />
              <p className="text-center mb-6">
                Accede al historial completo de ventas, filtra por fecha, método de pago,
                canal de venta y más.
              </p>
              <Button 
                className="w-full max-w-md" 
                size="lg"
                onClick={() => router.push('/ventas/historial')}
              >
                Ver Historial Completo
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Sección de Reportes */}
        <TabsContent value="reportes">
          <Card>
            <CardHeader>
              <CardTitle>Reportes de Ventas</CardTitle>
              <CardDescription>
                Analiza el rendimiento de tus ventas
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <BarChart2 className="h-16 w-16 text-primary mb-4" />
              <p className="text-center mb-6">
                Accede a reportes detallados de ventas, productos más vendidos,
                rendimiento por canal y más.
              </p>
              <Button 
                className="w-full max-w-md" 
                size="lg"
                onClick={() => router.push('/ventas/reportes')}
              >
                Ver Reportes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Componente para mostrar las ventas recientes
function RecentSales() {
  const [isLoading, setIsLoading] = useState(false)
  const [sales, setSales] = useState([
    {
      id: 1,
      date: new Date().toISOString(),
      total: 1250.50,
      items: 3,
      paymentMethod: "Efectivo",
      status: "completed"
    },
    {
      id: 2,
      date: new Date(Date.now() - 30 * 60000).toISOString(),
      total: 850.75,
      items: 2,
      paymentMethod: "Tarjeta",
      status: "completed"
    },
    {
      id: 3,
      date: new Date(Date.now() - 60 * 60000).toISOString(),
      total: 1500.00,
      items: 4,
      paymentMethod: "MercadoPago",
      status: "completed"
    },
    {
      id: 4,
      date: new Date(Date.now() - 90 * 60000).toISOString(),
      total: 750.25,
      items: 2,
      paymentMethod: "Efectivo",
      status: "completed"
    },
    {
      id: 5,
      date: new Date(Date.now() - 120 * 60000).toISOString(),
      total: 2100.00,
      items: 5,
      paymentMethod: "Transferencia",
      status: "completed"
    }
  ])
  
  // En una implementación real, aquí cargaríamos las ventas desde la API
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas Recientes</CardTitle>
        <CardDescription>
          Últimas 5 ventas realizadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium">ID</th>
                <th className="text-left py-3 px-2 font-medium">Fecha</th>
                <th className="text-left py-3 px-2 font-medium">Items</th>
                <th className="text-left py-3 px-2 font-medium">Método de Pago</th>
                <th className="text-right py-3 px-2 font-medium">Total</th>
                <th className="text-center py-3 px-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    Cargando ventas recientes...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    No hay ventas recientes
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="border-b">
                    <td className="py-3 px-2">{sale.id}</td>
                    <td className="py-3 px-2">
                      {new Date(sale.date).toLocaleString()}
                    </td>
                    <td className="py-3 px-2">{sale.items}</td>
                    <td className="py-3 px-2">{sale.paymentMethod}</td>
                    <td className="py-3 px-2 text-right">
                      ${sale.total.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Link href={`/ventas/detalle/${sale.id}`}>
                        <Button variant="ghost" size="sm">
                          Ver
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" disabled={isLoading} onClick={() => setIsLoading(true)}>
          Actualizar
        </Button>
        <Button variant="outline" onClick={() => router.push('/ventas/historial')}>
          Ver Todas
        </Button>
      </CardFooter>
    </Card>
  )
}

// Componente para mostrar los pedidos de delivery pendientes
function PendingDeliveryOrders() {
  const [isLoading, setIsLoading] = useState(false)
  const [orders, setOrders] = useState([
    {
      id: "PY-12345",
      platform: "PedidosYa",
      date: new Date().toISOString(),
      total: 1350.75,
      items: 3,
      status: "pending"
    },
    {
      id: "RP-67890",
      platform: "Rappi",
      date: new Date(Date.now() - 15 * 60000).toISOString(),
      total: 950.50,
      items: 2,
      status: "pending"
    },
    {
      id: "PY-54321",
      platform: "PedidosYa",
      date: new Date(Date.now() - 25 * 60000).toISOString(),
      total: 1200.00,
      items: 4,
      status: "pending"
    }
  ])
  
  // En una implementación real, aquí cargaríamos los pedidos desde la API
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pedidos Delivery Pendientes</CardTitle>
        <CardDescription>
          Pedidos que requieren atención
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium">ID</th>
                <th className="text-left py-3 px-2 font-medium">Plataforma</th>
                <th className="text-left py-3 px-2 font-medium">Fecha</th>
                <th className="text-left py-3 px-2 font-medium">Items</th>
                <th className="text-right py-3 px-2 font-medium">Total</th>
                <th className="text-center py-3 px-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    Cargando pedidos pendientes...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    No hay pedidos pendientes
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="py-3 px-2">{order.id}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        order.platform === "PedidosYa" 
                          ? "bg-[#FF5A5F]/20 text-[#FF5A5F]" 
                          : "bg-[#FF9500]/20 text-[#FF9500]"
                      }`}>
                        {order.platform}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {new Date(order.date).toLocaleString()}
                    </td>
                    <td className="py-3 px-2">{order.items}</td>
                    <td className="py-3 px-2 text-right">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex justify-center space-x-2">
                        <Button variant="outline" size="sm">
                          Aceptar
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive">
                          Rechazar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" disabled={isLoading} onClick={() => setIsLoading(true)}>
          Actualizar
        </Button>
        <Button variant="outline" onClick={() => router.push('/ventas/delivery')}>
          Ver Todos
        </Button>
      </CardFooter>
    </Card>
  )
}