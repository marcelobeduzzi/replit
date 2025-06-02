"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { ArrowLeft, RefreshCw, CheckCircle, AlertCircle, Search, Check, X, Clock, Truck, ShoppingBag } from 'lucide-react'

export default function DeliveryOrdersPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("pending")
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [platform, setPlatform] = useState("all")
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  // Cargar pedidos
  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // En una implementación real, aquí cargaríamos los pedidos desde la API
      // Por ahora, usamos datos de ejemplo
      
      // Simular una carga de datos
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Datos de ejemplo
      const mockOrders = {
        pending: [
          {
            id: "PY-12345",
            platform: "PedidosYa",
            date: new Date().toISOString(),
            customer: "Juan Pérez",
            address: "Av. Corrientes 1234, CABA",
            items: [
              { name: "Hamburguesa Completa", quantity: 2, price: 1200 },
              { name: "Papas Fritas", quantity: 1, price: 450 },
              { name: "Coca Cola 500ml", quantity: 2, price: 350 }
            ],
            total: 3550,
            status: "pending"
          },
          {
            id: "RP-67890",
            platform: "Rappi",
            date: new Date(Date.now() - 15 * 60000).toISOString(),
            customer: "María González",
            address: "Av. Santa Fe 4321, CABA",
            items: [
              { name: "Pizza Muzzarella", quantity: 1, price: 1800 },
              { name: "Fainá", quantity: 2, price: 400 },
              { name: "Sprite 1.5L", quantity: 1, price: 650 }
            ],
            total: 3250,
            status: "pending"
          },
          {
            id: "PY-54321",
            platform: "PedidosYa",
            date: new Date(Date.now() - 25 * 60000).toISOString(),
            customer: "Carlos Rodríguez",
            address: "Av. Cabildo 2468, CABA",
            items: [
              { name: "Milanesa Napolitana", quantity: 2, price: 1500 },
              { name: "Ensalada Mixta", quantity: 1, price: 600 },
              { name: "Agua Mineral 500ml", quantity: 2, price: 300 }
            ],
            total: 4200,
            status: "pending"
          }
        ],
        processing: [
          {
            id: "PY-98765",
            platform: "PedidosYa",
            date: new Date(Date.now() - 35 * 60000).toISOString(),
            customer: "Ana Martínez",
            address: "Av. Rivadavia 5678, CABA",
            items: [
              { name: "Lomo Completo", quantity: 1, price: 1700 },
              { name: "Papas Fritas", quantity: 1, price: 450 },
              { name: "Coca Cola 500ml", quantity: 1, price: 350 }
            ],
            total: 2500,
            estimatedTime: "20 minutos",
            status: "processing"
          },
          {
            id: "RP-43210",
            platform: "Rappi",
            date: new Date(Date.now() - 45 * 60000).toISOString(),
            customer: "Pedro Sánchez",
            address: "Av. Córdoba 9876, CABA",
            items: [
              { name: "Empanadas", quantity: 6, price: 1800 },
              { name: "Coca Cola 1.5L", quantity: 1, price: 650 }
            ],
            total: 2450,
            estimatedTime: "15 minutos",
            status: "processing"
          }
        ],
        completed: [
          {
            id: "PY-24680",
            platform: "PedidosYa",
            date: new Date(Date.now() - 120 * 60000).toISOString(),
            customer: "Laura Fernández",
            address: "Av. Callao 1357, CABA",
            items: [
              { name: "Hamburguesa Completa", quantity: 1, price: 1200 },
              { name: "Papas Fritas", quantity: 1, price: 450 },
              { name: "Coca Cola 500ml", quantity: 1, price: 350 }
            ],
            total: 2000,
            deliveryTime: "18:30",
            status: "completed"
          },
          {
            id: "RP-13579",
            platform: "Rappi",
            date: new Date(Date.now() - 180 * 60000).toISOString(),
            customer: "Roberto López",
            address: "Av. Entre Ríos 2468, CABA",
            items: [
              { name: "Pizza Especial", quantity: 1, price: 2200 },
              { name: "Cerveza 1L", quantity: 1, price: 800 }
            ],
            total: 3000,
            deliveryTime: "19:15",
            status: "completed"
          }
        ]
      }
      
      setOrders(mockOrders)
    } catch (error) {
      console.error("Error al cargar pedidos:", error)
      setErrorMessage("Error al cargar pedidos. Por favor, intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Efecto para cargar los pedidos al montar el componente
  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Filtrar pedidos por plataforma y búsqueda
  const filteredOrders = orders[activeTab]
    ? orders[activeTab].filter(order => {
        const matchesPlatform = platform === "all" || order.platform === platform
        const matchesSearch = order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             order.id.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesPlatform && matchesSearch
      })
    : []

  // Aceptar pedido
  const acceptOrder = async (orderId) => {
    try {
      // En una implementación real, aquí actualizaríamos el estado del pedido en la API
      
      // Simular una actualización
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Actualizar el estado local
      setOrders(prev => ({
        ...prev,
        pending: prev.pending.filter(order => order.id !== orderId),
        processing: [
          ...prev.processing,
          {
            ...prev.pending.find(order => order.id === orderId),
            status: "processing",
            estimatedTime: "30 minutos"
          }
        ]
      }))
      
      setSuccessMessage(`Pedido ${orderId} aceptado correctamente`)
    } catch (error) {
      console.error("Error al aceptar pedido:", error)
      setErrorMessage("Error al aceptar pedido. Por favor, intenta nuevamente.")
    }
  }

  // Rechazar pedido
  const rejectOrder = async (orderId) => {
    try {
      // En una implementación real, aquí actualizaríamos el estado del pedido en la API
      
      // Simular una actualización
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Actualizar el estado local
      setOrders(prev => ({
        ...prev,
        pending: prev.pending.filter(order => order.id !== orderId)
      }))
      
      setSuccessMessage(`Pedido ${orderId} rechazado correctamente`)
    } catch (error) {
      console.error("Error al rechazar pedido:", error)
      setErrorMessage("Error al rechazar pedido. Por favor, intenta nuevamente.")
    }
  }

  // Completar pedido
  const completeOrder = async (orderId) => {
    try {
      // En una implementación real, aquí actualizaríamos el estado del pedido en la API
      
      // Simular una actualización
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Actualizar el estado local
      setOrders(prev => ({
        ...prev,
        processing: prev.processing.filter(order => order.id !== orderId),
        completed: [
          ...prev.completed,
          {
            ...prev.processing.find(order => order.id === orderId),
            status: "completed",
            deliveryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]
      }))
      
      setSuccessMessage(`Pedido ${orderId} completado correctamente`)
    } catch (error) {
      console.error("Error al completar pedido:", error)
      setErrorMessage("Error al completar pedido. Por favor, intenta nuevamente.")
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/ventas">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Gestión de Pedidos Delivery</h1>
          <p className="text-muted-foreground">
            Administra los pedidos de las diferentes plataformas
          </p>
        </div>
      </div>
      
      {/* Mensajes de éxito o error */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          <span>{successMessage}</span>
          <button 
            className="absolute top-0 right-0 p-2" 
            onClick={() => setSuccessMessage("")}
          >
            &times;
          </button>
        </div>
      )}
      
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{errorMessage}</span>
          <button 
            className="absolute top-0 right-0 p-2" 
            onClick={() => setErrorMessage("")}
          >
            &times;
          </button>
        </div>
      )}
      
      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <Label htmlFor="platform">Plataforma</Label>
              <Select 
                value={platform} 
                onValueChange={setPlatform}
              >
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Todas las plataformas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las plataformas</SelectItem>
                  <SelectItem value="PedidosYa">PedidosYa</SelectItem>
                  <SelectItem value="Rappi">Rappi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-2/3">
              <Label htmlFor="search">Buscar Pedido</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="ID o nombre del cliente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Pestañas de pedidos */}
      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            Pendientes
            {orders.pending && orders.pending.length > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                {orders.pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="processing" className="flex items-center">
            <Truck className="mr-2 h-4 w-4" />
            En Proceso
            {orders.processing && orders.processing.length > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                {orders.processing.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center">
            <Check className="mr-2 h-4 w-4" />
            Completados
          </TabsTrigger>
        </TabsList>
        
        {/* Contenido de la pestaña Pendientes */}
        <TabsContent value="pending">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pedidos Pendientes</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadOrders}
                disabled={isLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Cargando pedidos pendientes...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="mt-4 text-muted-foreground">No hay pedidos pendientes</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredOrders.map((order) => (
                    <Card key={order.id} className="overflow-hidden">
                      <div className={`px-4 py-2 ${
                        order.platform === "PedidosYa" 
                          ? "bg-[#FF5A5F] text-white" 
                          : "bg-[#FF9500] text-white"
                      }`}>
                        <div className="flex justify-between items-center">
                          <div className="font-bold">{order.platform} - {order.id}</div>
                          <div>{new Date(order.date).toLocaleString()}</div>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h3 className="font-medium">Cliente</h3>
                            <p>{order.customer}</p>
                            <p className="text-sm text-muted-foreground">{order.address}</p>
                          </div>
                          <div>
                            <h3 className="font-medium">Resumen</h3>
                            <p>{order.items.length} productos</p>
                            <p className="font-bold">${order.total.toFixed(2)}</p>
                          </div>
                        </div>
                        
                        <div className="border rounded-md overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead className="text-center">Cantidad</TableHead>
                                <TableHead className="text-right">Precio</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {order.items.map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell className="text-center">{item.quantity}</TableCell>
                                  <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                                  <TableCell className="text-right">${(item.quantity * item.price).toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        
                        <div className="flex justify-end mt-4 space-x-2">
                          <Button 
                            variant="outline" 
                            className="text-destructive"
                            onClick={() => rejectOrder(order.id)}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Rechazar
                          </Button>
                          <Button 
                            onClick={() => acceptOrder(order.id)}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Aceptar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Contenido de la pestaña En Proceso */}
        <TabsContent value="processing">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pedidos En Proceso</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadOrders}
                disabled={isLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Cargando pedidos en proceso...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="mt-4 text-muted-foreground">No hay pedidos en proceso</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredOrders.map((order) => (
                    <Card key={order.id} className="overflow-hidden">
                      <div className={`px-4 py-2 ${
                        order.platform === "PedidosYa" 
                          ? "bg-[#FF5A5F] text-white" 
                          : "bg-[#FF9500] text-white"
                      }`}>
                        <div className="flex justify-between items-center">
                          <div className="font-bold">{order.platform} - {order.id}</div>
                          <div>{new Date(order.date).toLocaleString()}</div>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h3 className="font-medium">Cliente</h3>
                            <p>{order.customer}</p>
                            <p className="text-sm text-muted-foreground">{order.address}</p>
                          </div>
                          <div>
                            <h3 className="font-medium">Resumen</h3>
                            <p>{order.items.length} productos</p>
                            <p className="font-bold">${order.total.toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">
                              Tiempo estimado: {order.estimatedTime}
                            </p>
                          </div>
                        </div>
                        
                        <div className="border rounded-md overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead className="text-center">Cantidad</TableHead>
                                <TableHead className="text-right">Precio</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {order.items.map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell className="text-center">{item.quantity}</TableCell>
                                  <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                                  <TableCell className="text-right">${(item.quantity * item.price).toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        
                        <div className="flex justify-end mt-4">
                          <Button 
                            onClick={() => completeOrder(order.id)}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Completar Pedido
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Contenido de la pestaña Completados */}
        <TabsContent value="completed">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pedidos Completados</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadOrders}
                disabled={isLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Cargando pedidos completados...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="mt-4 text-muted-foreground">No hay pedidos completados</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredOrders.map((order) => (
                    <Card key={order.id} className="overflow-hidden">
                      <div className={`px-4 py-2 ${
                        order.platform === "PedidosYa" 
                          ? "bg-[#FF5A5F] text-white" 
                          : "bg-[#FF9500] text-white"
                      }`}>
                        <div className="flex justify-between items-center">
                          <div className="font-bold">{order.platform} - {order.id}</div>
                          <div>{new Date(order.date).toLocaleString()}</div>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h3 className="font-medium">Cliente</h3>
                            <p>{order.customer}</p>
                            <p className="text-sm text-muted-foreground">{order.address}</p>
                          </div>
                          <div>
                            <h3 className="font-medium">Resumen</h3>
                            <p>{order.items.length} productos</p>
                            <p className="font-bold">${order.total.toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">
                              Entregado a las: {order.deliveryTime}
                            </p>
                          </div>
                        </div>
                        
                        <div className="border rounded-md overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead className="text-center">Cantidad</TableHead>
                                <TableHead className="text-right">Precio</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {order.items.map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell className="text-center">{item.quantity}</TableCell>
                                  <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                                  <TableCell className="text-right">${(item.quantity * item.price).toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}