"use client"

import { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProductivityChartProps {
  data: any[]
}

export function ProductivityChart({ data }: ProductivityChartProps) {
  const [chartType, setChartType] = useState("line")
  const [chartData, setChartData] = useState<any[]>([])

  // Preparar datos para el gráfico
  useEffect(() => {
    // Agrupar datos por fecha
    const groupedByDate = data.reduce((acc, employee) => {
      const date = employee.date

      if (!acc[date]) {
        acc[date] = {
          date,
          avgScore: 0,
          count: 0,
          totalScore: 0,
          salesPerHour: 0,
          totalSales: 0,
          attendance: 0,
          totalAttendance: 0,
        }
      }

      acc[date].totalScore += employee.score
      acc[date].totalSales += employee.salesPerHour
      acc[date].totalAttendance += employee.attendance
      acc[date].count += 1

      return acc
    }, {})

    // Calcular promedios
    const chartData = Object.values(groupedByDate).map((day: any) => ({
      date: day.date,
      avgScore: Math.round(day.totalScore / day.count),
      salesPerHour: Math.round(day.totalSales / day.count),
      attendance: Math.round(day.totalAttendance / day.count),
    }))

    // Ordenar por fecha
    chartData.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

    setChartData(chartData)
  }, [data])

  return (
    <div className="space-y-4">
      <Tabs value={chartType} onValueChange={setChartType}>
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="line">Línea</TabsTrigger>
          <TabsTrigger value="bar">Barras</TabsTrigger>
        </TabsList>

        <TabsContent value="line" className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgScore" name="Productividad" stroke="#8884d8" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="salesPerHour" name="Ventas/Hora" stroke="#82ca9d" />
              <Line type="monotone" dataKey="attendance" name="Asistencia" stroke="#ffc658" />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="bar" className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgScore" name="Productividad" fill="#8884d8" />
              <Bar dataKey="salesPerHour" name="Ventas/Hora" fill="#82ca9d" />
              <Bar dataKey="attendance" name="Asistencia" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </div>
  )
}

