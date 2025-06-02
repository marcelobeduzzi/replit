import { Suspense } from "react"
import Link from "next/link"
import { BarChart, PieChart, LineChart, Download, Calendar, Filter, TrendingUp, TrendingDown, DollarSign, ShoppingBag } from 'lucide-react'
import { salesService } from "@/lib/sales-service"
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"

// Componente para mostrar las estadísticas generales
async function SalesStats() {
  let stats = {
    dailySales: 0,
    monthlySales: 0,
    yearToDateSales: 0,
    averageOrderValue: 0,
    dailyOrders: 0,
    monthlyOrders: 0,
    topSellingProduct: 'N/A',
    topSellingCategory: 'N/A'
  }
  
  try {
    stats = await salesService.getSalesStats()
  } catch (error) {
    console.error("Error al cargar estadísticas de ventas:", error)
    // Para desarrollo, usamos datos de ejemplo
    stats = {
      dailySales: 2500.75,
      monthlySales: 45000.50,
      yearToDateSales: 350000.00,
      averageOrderValue: 500.15,
      dailyOrders: 5,
      monthlyOrders: 90,
      topSellingProduct: 'Hamburguesa Completa',
      topSellingCategory: 'Hamburguesas'
    }
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ventas del Día</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.dailySales.toFixed(2)}</div>
          <div className="flex items-center pt-1">
            <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
            <span className="text-xs text-green-500">+5% desde ayer</span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
          <BarChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.monthlySales.toFixed(2)}</div>
          <div className="flex items-center pt-1">
            <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
            <span className="text-xs text-green-500">+12% desde el mes pasado</span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Órdenes del Día</CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.dailyOrders}</div>
          <div className="flex items-center pt-1">
            <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
            <span className="text-xs text-red-500">-2% desde ayer</span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Promedio</CardTitle>
          <LineChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.averageOrderValue.toFixed(2)}</div>
          <div className="flex items-center pt-1">
            <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
            <span className="text-xs text-green-500">+8% desde el mes pasado</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente para mostrar gráficos (simulados)
function SalesCharts() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Ventas por Día</CardTitle>
          <CardDescription>
            Ventas diarias de los últimos 7 días
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md border border-dashed">
            <div className="text-center">
              <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">Gráfico de Ventas Diarias</h3>
              <p className="text-sm text-muted-foreground">
                Aquí se mostraría un gráfico de barras con las ventas diarias
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Ventas por Categoría</CardTitle>
          <CardDescription>
            Distribución de ventas por categoría de producto
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md border border-dashed">
            <div className="text-center">
              <PieChart className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">Gráfico de Categorías</h3>
              <p className="text-sm text-muted-foreground">
                Aquí se mostraría un gráfico circular con las ventas por categoría
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente para mostrar productos más vendidos
async function TopSellingProducts() {
  let products = []
  
  try {
    products = await salesService.getTopSellingProducts()
  } catch (error) {
    console.error("Error al cargar productos más vendidos:", error)
    // Para desarrollo, usamos datos de ejemplo
    products = [
      { id: '101', name: 'Hamburguesa Completa', category: 'Hamburguesas', quantity: 120, revenue: 54000.00 },
      { id: '102', name: 'Hamburguesa Doble', category: 'Hamburguesas', quantity: 95, revenue: 52250.00 },
      { id: '201', name: 'Pizza Muzzarella', category: 'Pizzas', quantity: 85, revenue: 51000.00 },
      { id: '301', name: 'Gaseosa 500ml', category: 'Bebidas', quantity: 200, revenue: 10000.00 },
      { id: '401', name: 'Papas Fritas Grande', category: 'Acompañamientos', quantity: 150, revenue: 37575.00 },
    ]
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Productos Más Vendidos</CardTitle>
        <CardDescription>
          Los 5 productos con mayor cantidad de ventas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {products.map((product, index) => (
            <div key={product.id} className="flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                {index + 1}
              </div>
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">{product.name}</p>
                <p className="text-sm text-muted-foreground">{product.category}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm font-medium">{product.quantity} unidades</p>
                <p className="text-sm text-muted-foreground">${product.revenue.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export const metadata = {
  title: "Reportes - Sistema de Ventas",
}

export default function ReportesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="text-muted-foreground">
            Visualiza estadísticas y reportes de ventas
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar Datos
          </Button>
        </div>
      </div>

      <Suspense fallback={<div className="text-center py-4">Cargando estadísticas...</div>}>
        <SalesStats />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Reporte</CardTitle>
          <CardDescription>
            Selecciona el período y los filtros para el reporte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Desde</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Hasta</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Canal</label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los canales</SelectItem>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="pedidosya">PedidosYa</SelectItem>
                  <SelectItem value="rappi">Rappi</SelectItem>
                  <SelectItem value="mercadopago">MercadoPago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button className="w-full">
                <Filter className="mr-2 h-4 w-4" />
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="charts" className="w-full">
        <TabsList>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="products">Productos Más Vendidos</TabsTrigger>
        </TabsList>
        <TabsContent value="charts" className="mt-4">
          <SalesCharts />
        </TabsContent>
        <TabsContent value="products" className="mt-4">
          <Suspense fallback={<div className="text-center py-4">Cargando productos más vendidos...</div>}>
            <TopSellingProducts />
          </Suspense>
        </TabsContent>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/ventas/reportes/diario">
          <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Reporte Diario
              </CardTitle>
              <CardDescription>
                Análisis detallado de ventas por día
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Visualiza las ventas, productos vendidos y tendencias por día.
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/ventas/reportes/mensual">
          <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Reporte Mensual
              </CardTitle>
              <CardDescription>
                Análisis detallado de ventas por mes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Visualiza las ventas, productos vendidos y tendencias por mes.
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/ventas/reportes/productos">
          <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Reporte de Productos
              </CardTitle>
              <CardDescription>
                Análisis detallado de productos vendidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Visualiza los productos más vendidos, categorías populares y tendencias.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}