"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

const data = [
  { name: "Ventas/Hora", value: 35, color: "#8884d8" },
  { name: "Asistencia", value: 25, color: "#82ca9d" },
  { name: "Precisión Caja", value: 15, color: "#ffc658" },
  { name: "Precisión Stock", value: 15, color: "#ff8042" },
  { name: "Decomisos", value: 10, color: "#0088fe" },
]

export function ProductivityFactors() {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value}%`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

