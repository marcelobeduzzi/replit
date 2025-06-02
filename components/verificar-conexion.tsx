"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function VerificarConexion() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  const verificarConexion = async () => {
    setStatus("loading")
    setMessage("Verificando conexión...")

    try {
      const supabase = createClient()

      // Intenta hacer una consulta simple
      const { data, error } = await supabase.from("cost_simulation_categories").select("count()", { count: "exact" })

      if (error) {
        throw error
      }

      setStatus("success")
      setMessage(`Conexión exitosa. Número de categorías: ${data[0].count}`)
    } catch (error: any) {
      setStatus("error")
      setMessage(`Error de conexión: ${error.message}`)
      console.error("Error de conexión:", error)
    }
  }

  useEffect(() => {
    verificarConexion()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado de la Conexión a la Base de Datos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div
            className={`p-4 rounded-md ${
              status === "loading"
                ? "bg-yellow-100 text-yellow-800"
                : status === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {message}
          </div>
          <Button onClick={verificarConexion}>Verificar Nuevamente</Button>
        </div>
      </CardContent>
    </Card>
  )
}

