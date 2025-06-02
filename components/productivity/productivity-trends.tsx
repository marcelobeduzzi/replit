"use client"

import { useState } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Datos simulados para tendencias
const productivityTrends = [
  {
    month: "Ene",
    avgScore: 72,
    salesPerHour: 1200,
    attendance: 92,
    cashAccuracy: 98.2,
    stockAccuracy: 97.5,
    rainyDays: 8,
  },
  {
    month: "Feb",
    avgScore: 74,
    salesPerHour: 1250,
    attendance: 93,
    cashAccuracy: 98.5,
    stockAccuracy: 98.0,
    rainyDays: 6,
  },
  {
    month: "Mar",
    avgScore: 75,
    salesPerHour: 1300,
    attendance: 94,
    cashAccuracy: 98.7,
    stockAccuracy: 98.2,
    rainyDays: 5,
  },
  {
    month: "Abr",
    avgScore: 73,
    salesPerHour: 1280,
    attendance: 91,
    cashAccuracy: 98.4,
    stockAccuracy: 97.8,
    rainyDays: 9,
  },
  {
    month: "May",
    avgScore: 76,
    salesPerHour: 1350,
    attendance: 95,
    cashAccuracy: 98.9,
    stockAccuracy: 98.5,
    rainyDays: 4,
  },
  {
    month: "Jun",
    avgScore: 78,
    salesPerHour: 1400,
    attendance: 96,
    cashAccuracy: 99.1,
    stockAccuracy: 98.8,
    rainyDays: 2,
  },
  {
    month: "Jul",
    avgScore: 80,
    salesPerHour: 1450,
    attendance: 97,
    cashAccuracy: 99.3,
    stockAccuracy: 99.0,
    rainyDays: 1,
  },
  {
    month: "Ago",
    avgScore: 79,
    salesPerHour: 1420,
    attendance: 96,
    cashAccuracy: 99.2,
    stockAccuracy: 98.9,
    rainyDays: 3,
  },
  {
    month: "Sep",
    avgScore: 77,
    salesPerHour: 1380,
    attendance: 95,
    cashAccuracy: 99.0,
    stockAccuracy: 98.7,
    rainyDays: 5,
  },
  {
    month: "Oct",
    avgScore: 78,
    salesPerHour: 1400,
    attendance: 96,
    cashAccuracy: 99.1,
    stockAccuracy: 98.8,
    rainyDays: 6,
  },
  {
    month: "Nov",
    avgScore: 80,
    salesPerHour: 1450,
    attendance: 97,
    cashAccuracy: 99.3,
    stockAccuracy: 99.0,
    rainyDays: 4,
  },
  {
    month: "Dic",
    avgScore: 82,
    salesPerHour: 1500,
    attendance: 98,
    cashAccuracy: 99.5,
    stockAccuracy: 99.2,
    rainyDays: 3,
  },
]

// Datos simulados para comparación por local
const locationComparison = [
  { name: "BR Cabildo", avgScore: 82, salesPerHour: 1500, attendance: 98, cashAccuracy: 99.5, stockAccuracy: 99.2 },
  { name: "BR Carranza", avgScore: 78, salesPerHour: 1400, attendance: 96, cashAccuracy: 99.1, stockAccuracy: 98.8 },
  { name: "BR Pacífico", avgScore: 76, salesPerHour: 1350, attendance: 95, cashAccuracy: 98.9, stockAccuracy: 98.5 },
  { name: "BR Local 4", avgScore: 74, salesPerHour: 1300, attendance: 94, cashAccuracy: 98.7, stockAccuracy: 98.2 },
  { name: "BR Local 5", avgScore: 72, salesPerHour: 1250, attendance: 93, cashAccuracy: 98.5, stockAccuracy: 98.0 },
]

// Datos simulados para correlación clima-ventas
const weatherSalesCorrelation = [
  { month: "Ene", rainyDays: 8, avgSales: 1200, normalizedSales: 92 },
  { month: "Feb", rainyDays: 6, avgSales: 1250, normalizedSales: 95 },
  { month: "Mar", rainyDays: 5, avgSales: 1300, normalizedSales: 97 },
  { month: "Abr", rainyDays: 9, avgSales: 1280, normalizedSales: 90 },
  { month: "May", rainyDays: 4, avgSales: 1350, normalizedSales: 98 },
  { month: "Jun", rainyDays: 2, avgSales: 1400, normalizedSales: 100 },
  { month: "Jul", rainyDays: 1, avgSales: 1450, normalizedSales: 102 },
  { month: "Ago", rainyDays: 3, avgSales: 1420, normalizedSales: 99 },
  { month: "Sep", rainyDays: 5, avgSales: 1380, normalizedSales: 97 },
  { month: "Oct", rainyDays: 6, avgSales: 1400, normalizedSales: 95 },
  { month: "Nov", rainyDays: 4, avgSales: 1450, normalizedSales: 98 },
  { month: "Dic", rainyDays: 3, avgSales: 1500, normalizedSales: 100 },
]

export function ProductivityTrends() {
  const [activeTab, setActiveTab] = useState("overall")
  const [metric, setMetric] = useState("avgScore")

  const getMetricName = (key: string) => {
    switch (key) {
      case "avgScore":
        return "Productividad"
      case "salesPerHour":
        return "Ventas/Hora"
      case "attendance":
        return "Asistencia"
      case "cashAccuracy":
        return "Precisión Caja"
      case "stockAccuracy":
        return "Precisión Stock"
      default:
        return key
    }
  }

  const getMetricColor = (key: string) => {
    switch (key) {
      case "avgScore":
        return "#8884d8"
      case "salesPerHour":
        return "#82ca9d"
      case "attendance":
        return "#ffc658"
      case "cashAccuracy":
        return "#ff8042"
      case "stockAccuracy":
        return "#0088fe"
      default:
        return "#8884d8"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="overall">Tendencia General</TabsTrigger>
            <TabsTrigger value="location">Por Local</TabsTrigger>
            <TabsTrigger value="weather">Impacto del Clima</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="w-full sm:w-[200px]">
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar métrica" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="avgScore">Productividad</SelectItem>
              <SelectItem value="salesPerHour">Ventas/Hora</SelectItem>
              <SelectItem value="attendance">Asistencia</SelectItem>
              <SelectItem value="cashAccuracy">Precisión Caja</SelectItem>
              <SelectItem value="stockAccuracy">Precisión Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <TabsContent value="overall" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de {getMetricName(metric)}</CardTitle>
            <CardDescription>Evolución mensual durante el último año</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={productivityTrends}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey={metric}
                  name={getMetricName(metric)}
                  stroke={getMetricColor(metric)}
                  fill={getMetricColor(metric)}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="location" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle>{getMetricName(metric)} por Local</CardTitle>
            <CardDescription>Comparación entre locales</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={locationComparison}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey={metric} name={getMetricName(metric)} fill={getMetricColor(metric)} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="weather" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle>Impacto del Clima en las Ventas</CardTitle>
            <CardDescription>Correlación entre días de lluvia y ventas normalizadas</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={weatherSalesCorrelation}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="rainyDays"
                  name="Días de lluvia"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="normalizedSales"
                  name="Ventas normalizadas"
                  stroke="#82ca9d"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
    </div>
  )
}

