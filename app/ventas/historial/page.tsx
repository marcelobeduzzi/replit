"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { ArrowLeft, Search, RefreshCw, Calendar } from 'lucide-react'

export default function SalesHistory() {
  const router = useRouter()
  const [sales, setSales] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [channelFilter, setChannelFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [totalSales, setTotalSales] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)

  // Cargar ventas
  const loadSales = async () => {
    try {
      setIsLoading(true)
      
      // Construir la consulta base
      let query = supabase
        .from('sales_orders')
        .select('*')
        .order('created_at', { ascending: false })
      
      // Aplicar filtros
      if (dateFilter === "today") {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        query = query.gte('created_at', today.toISOString())
      } else if (dateFilter === "yesterday") {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setHours(0, 0, 0, 0)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        query = query.gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString())
      } else if (dateFilter === "week") {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        query = query.gte('created_at', weekAgo.toISOString())
      } else if (dateFilter === "month") {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        query = query.gte('created_at', monthAgo.toISOString())
      } else if (dateFilter === "custom" && startDate && endDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString())
      }
      
      if (paymentFilter !== "all") {
        query = query.eq('payment_method', paymentFilter)
      }
      
      if (channelFilter !== "all") {
        query = query.eq('channel', channelFilter)
      }
      
      if (statusFilter !== "all") {
        query = query.eq('payment_status', statusFilter)
      }
      
      // Ejecutar la consulta
      const { data, error } = await query
      
      if (error) {
        console.error("Error al cargar ventas:", error)
        throw error
      }
      
      // Filtrar por búsqueda (ID)
      let filteredData = data || []
      if (searchQuery) {
        filteredData = filteredData.filter(sale => 
          sale.id.toString().includes(searchQuery)
        )
      }
      
      console.log("Ventas cargadas:", filteredData)
      
      // Calcular totales
      setTotalSales(filteredData.length)
      setTotalAmount(filteredData.reduce((sum, sale) => sum + (sale.total_amount || 0), 0))
      
      // Formatear los datos
      const formattedSales = filteredData.map(sale => ({
        id: sale.id,
        date: sale.created_at,
        total: sale.total_amount || 0,
        paymentMethod: sale.payment_method || 'Desconocido',
        status: sale.payment_status || 'pending',
        channel: sale.channel || 'local',
        createdBy: sale.created_by || 'Sistema'
      }))
      
      setSales(formattedSales)
    } catch (error) {
      console.error("Error al cargar ventas:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar ventas al montar el componente y cuando cambien los filtros
  useEffect(() => {
    loadSales()
  }, [dateFilter, paymentFilter, channelFilter, statusFilter])

  // Aplicar filtros personalizados
  const applyCustomFilters = () => {
    if (dateFilter === "custom" && startDate && endDate) {
      loadSales()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Encabezado */}
      <header className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Button 
              variant="secondary" 
              size="icon" 
              className="mr-2"
              onClick={() => router.push('/ventas')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Historial de Ventas</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={loadSales}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => router.push('/pos')}
            >
              Punto de Venta
            </Button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Tarjeta de resumen */}
          <Card className="md:col-span-4">
            <CardHeader className="pb-2">
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Total de Ventas
                  </div>
                  <div className="text-2xl font-bold">
                    {totalSales}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Monto Total
                  </div>
                  <div className="text-2xl font-bold">
                    ${totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Filtros */}
          <Card className="md:col-span-4">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Búsqueda por ID */}
                <div>
                  <Label htmlFor="search">Buscar por ID</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="ID de venta..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          loadSales()
                        }
                      }}
                    />
                  </div>
                </div>
                
                {/* Filtro por fecha */}
                <div>
                  <Label htmlFor="date-filter">Período</Label>
                  <Select 
                    value={dateFilter} 
                    onValueChange={setDateFilter}
                  >
                    <SelectTrigger id="date-filter">
                      <SelectValue placeholder="Seleccionar período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="today">Hoy</SelectItem>
                      <SelectItem value="yesterday">Ayer</SelectItem>
                      <SelectItem value="week">Última semana</SelectItem>
                      <SelectItem value="month">Último mes</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Filtro por método de pago */}
                <div>
                  <Label htmlFor="payment-filter">Método de Pago</Label>
                  <Select 
                    value={paymentFilter} 
                    onValueChange={setPaymentFilter}
                  >
                    <SelectTrigger id="payment-filter">
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="card">Tarjeta</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="mercadopago">MercadoPago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Filtro por canal */}
                <div>
                  <Label htmlFor="channel-filter">Canal</Label>
                  <Select 
                    value={channelFilter} 
                    onValueChange={setChannelFilter}
                  >
                    <SelectTrigger id="channel-filter">
                      <SelectValue placeholder="Seleccionar canal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="pedidosya">PedidosYa</SelectItem>
                      <SelectItem value="rappi">Rappi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Filtro por estado */}
                <div>
                  <Label htmlFor="status-filter">Estado</Label>
                  <Select 
                    value={statusFilter} 
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger id="status-filter">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="completed">Pagado</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Filtros de fecha personalizados */}
              {dateFilter === "custom" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <Label htmlFor="start-date">Fecha Inicio</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="end-date">Fecha Fin</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={applyCustomFilters}
                      disabled={!startDate || !endDate}
                      className="w-full"
                    >
                      Aplicar Filtros
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Botón de búsqueda para ID */}
              {searchQuery && (
                <div className="mt-4">
                  <Button onClick={loadSales}>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Tabla de ventas */}
        <Card>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Método de Pago</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        Cargando ventas...
                      </TableCell>
                    </TableRow>
                  ) : sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No se encontraron ventas
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{sale.id}</TableCell>
                        <TableCell>{new Date(sale.date).toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            sale.channel === "local" 
                              ? "bg-blue-100 text-blue-800" 
                              : sale.channel === "pedidosya"
                                ? "bg-[#FF5A5F]/20 text-[#FF5A5F]"
                                : "bg-[#FF9500]/20 text-[#FF9500]"
                          }`}>
                            {sale.channel}
                          </span>
                        </TableCell>
                        <TableCell>{sale.paymentMethod}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            sale.status === "completed" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {sale.status === "completed" ? "Pagado" : "Pendiente"}
                          </span>
                        </TableCell>
                        <TableCell>{sale.createdBy}</TableCell>
                        <TableCell className="text-right font-medium">
                          ${sale.total.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Link href={`/ventas/detalle/${sale.id}`}>
                            <Button variant="ghost" size="sm">
                              Ver
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}