"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Datos de ejemplo
const data = [
  { name: "Ene", total: 1200 },
  { name: "Feb", total: 900 },
  { name: "Mar", total: 1600 },
  { name: "Abr", total: 1800 },
  { name: "May", total: 2200 },
  { name: "Jun", total: 2400 },
  { name: "Jul", total: 2100 },
  { name: "Ago", total: 2800 },
  { name: "Sep", total: 3200 },
  { name: "Oct", total: 3500 },
  { name: "Nov", total: 3700 },
  { name: "Dic", total: 3900 },
]

export function Overview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen Anual</CardTitle>
        <CardDescription>
          Actividad del sistema durante el último año
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip />
            <Bar
              dataKey="total"
              fill="currentColor"
              radius={[4, 4, 0, 0]}
              className="fill-primary"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}