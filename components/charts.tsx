"use client"

import { useEffect, useRef } from "react"

// Definimos la interfaz para los props de los gráficos
interface ChartProps {
  data: {
    labels: string[]
    datasets: {
      label?: string
      data: number[]
      backgroundColor?: string | string[]
      borderColor?: string | string[]
      borderWidth?: number
      fill?: boolean
    }[]
  }
}

// Componente de carga para mostrar mientras se carga Chart.js
const LoadingChart = () => (
  <div className="h-full w-full flex items-center justify-center">
    <p className="text-muted-foreground">Cargando gráfico...</p>
  </div>
)

// Implementación del BarChart con carga dinámica
export function BarChart({ data }: ChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // Función asíncrona para cargar Chart.js dinámicamente
    const initChart = async () => {
      try {
        // Importar Chart.js dinámicamente
        const { Chart, registerables } = await import("chart.js")

        // Registrar los componentes necesarios
        Chart.register(...registerables)

        // Destruir el gráfico anterior si existe
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy()
        }

        // Crear nuevo gráfico
        const ctx = chartRef.current?.getContext("2d")
        if (ctx) {
          chartInstanceRef.current = new Chart(ctx, {
            type: "bar",
            data: data,
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "top",
                },
              },
            },
          })
        }
      } catch (error) {
        console.error("Error al inicializar el gráfico:", error)
      }
    }

    initChart()

    // Limpiar al desmontar
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
      }
    }
  }, [data])

  return <canvas ref={chartRef} />
}

// Implementación del LineChart con carga dinámica
export function LineChart({ data }: ChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // Función asíncrona para cargar Chart.js dinámicamente
    const initChart = async () => {
      try {
        // Importar Chart.js dinámicamente
        const { Chart, registerables } = await import("chart.js")

        // Registrar los componentes necesarios
        Chart.register(...registerables)

        // Destruir el gráfico anterior si existe
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy()
        }

        // Crear nuevo gráfico
        const ctx = chartRef.current?.getContext("2d")
        if (ctx) {
          chartInstanceRef.current = new Chart(ctx, {
            type: "line",
            data: data,
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "top",
                },
              },
            },
          })
        }
      } catch (error) {
        console.error("Error al inicializar el gráfico:", error)
      }
    }

    initChart()

    // Limpiar al desmontar
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
      }
    }
  }, [data])

  return <canvas ref={chartRef} />
}

// Implementación del PieChart con carga dinámica
export function PieChart({ data }: ChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // Función asíncrona para cargar Chart.js dinámicamente
    const initChart = async () => {
      try {
        // Importar Chart.js dinámicamente
        const { Chart, registerables } = await import("chart.js")

        // Registrar los componentes necesarios
        Chart.register(...registerables)

        // Destruir el gráfico anterior si existe
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy()
        }

        // Crear nuevo gráfico
        const ctx = chartRef.current?.getContext("2d")
        if (ctx) {
          chartInstanceRef.current = new Chart(ctx, {
            type: "pie",
            data: data,
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "top",
                },
              },
            },
          })
        }
      } catch (error) {
        console.error("Error al inicializar el gráfico:", error)
      }
    }

    initChart()

    // Limpiar al desmontar
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
      }
    }
  }, [data])

  return <canvas ref={chartRef} />
}

