"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { LoadingSpinner } from "@/components/loading-spinner"
import DashboardLayout from "@/app/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Users, Store, Calendar, DollarSign, ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface DashboardStats {
  activeEmployees: number
  activeEmployeesChange: number
  totalDeliveryOrders: number
  deliveryOrdersChange: number
  totalRevenue: number
  revenueChange: number
  averageRating: number
  ratingChange: number
}

interface ChartData {
  labels: string[]
  datasets: {
    label?: string
    data: number[]
    backgroundColor: string | string[]
    borderColor: string | string[]
    borderWidth: number
  }[]
}

interface DashboardData {
  stats: DashboardStats
  charts: {
    salesData: ChartData
    deliveryData: ChartData
    attendanceData: ChartData
  }
}

export default function HomePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
      return
    }

    if (user) {
      loadDashboardData()
    }
  }, [user, isLoading, router])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard')
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const renderChangeIndicator = (value: number) => {
    if (value === undefined) return null
    return value > 0 ? (
      <span className="text-green-500 flex items-center">
        <ArrowUpRight className="h-4 w-4 mr-1" />
        {formatPercentage(value)}
      </span>
    ) : (
      <span className="text-red-500 flex items-center">
        <ArrowDownRight className="h-4 w-4 mr-1" />
        {formatPercentage(value)}
      </span>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empleados Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.stats.activeEmployees || 0}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData?.stats.activeEmployeesChange !== undefined && renderChangeIndicator(dashboardData.stats.activeEmployeesChange)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dashboardData?.stats.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData?.stats.revenueChange !== undefined && renderChangeIndicator(dashboardData.stats.revenueChange)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Delivery</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.stats.totalDeliveryOrders || 0}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData?.stats.deliveryOrdersChange !== undefined && renderChangeIndicator(dashboardData.stats.deliveryOrdersChange)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.stats.averageRating?.toFixed(1) || '0.0'}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData?.stats.ratingChange !== undefined && renderChangeIndicator(dashboardData.stats.ratingChange)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Ventas por Local</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData?.charts.salesData.datasets[0].data.map((value, index) => ({
                    name: dashboardData.charts.salesData.labels[index],
                    value
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Distribución de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData?.charts.deliveryData.datasets[0].data.map((value, index) => ({
                        name: dashboardData.charts.deliveryData.labels[index],
                        value
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dashboardData?.charts.deliveryData.datasets[0].data.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={dashboardData.charts.deliveryData.datasets[0].backgroundColor[index] as string} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Asistencia Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData?.charts.attendanceData.datasets[0].data.map((value, index) => ({
                  name: dashboardData.charts.attendanceData.labels[index],
                  value
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}