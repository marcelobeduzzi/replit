"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"

interface Manager {
  id?: string
  name: string
  email: string
}

export function ManagersForm() {
  const [managers, setManagers] = useState<Manager[]>([])
  const [newManager, setNewManager] = useState<Manager>({ name: "", email: "" })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchManagers() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("managers").select("*").order("name")

        if (error) throw error

        setManagers(data || [])
      } catch (error: any) {
        console.error("Error fetching managers:", error.message)
        toast({
          title: "Error",
          description: "No se pudieron cargar los encargados",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchManagers()
  }, [])

  const handleAddManager = async () => {
    if (newManager.name && newManager.email) {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("managers")
          .insert([{ name: newManager.name, email: newManager.email }])
          .select()

        if (error) throw error

        setManagers([...managers, data[0]])
        setNewManager({ name: "", email: "" })

        toast({
          title: "Éxito",
          description: "Encargado agregado correctamente",
        })
      } catch (error: any) {
        console.error("Error adding manager:", error.message)
        toast({
          title: "Error",
          description: "No se pudo agregar el encargado",
          variant: "destructive",
        })
      }
    }
  }

  const handleRemoveManager = async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("managers").delete().eq("id", id)

      if (error) throw error

      setManagers(managers.filter((manager) => manager.id !== id))

      toast({
        title: "Éxito",
        description: "Encargado eliminado correctamente",
      })
    } catch (error: any) {
      console.error("Error removing manager:", error.message)
      toast({
        title: "Error",
        description: "No se pudo eliminar el encargado",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div>Cargando encargados...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Encargados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={newManager.name}
                onChange={(e) => setNewManager({ ...newManager, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={newManager.email}
                onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={handleAddManager}>Agregar Encargado</Button>

          {managers.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium">Encargados Actuales</h3>
              <div className="mt-2 space-y-2">
                {managers.map((manager) => (
                  <div key={manager.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">{manager.name}</p>
                      <p className="text-sm text-muted-foreground">{manager.email}</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => handleRemoveManager(manager.id!)}>
                      Eliminar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
