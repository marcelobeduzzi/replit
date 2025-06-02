"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"

type Location = {
  id: number
  name: string
  address: string
  active: boolean
}

export function LocationsForm() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
  })

  useEffect(() => {
    fetchLocations()
  }, [])

  async function fetchLocations() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("locations").select("*").order("name", { ascending: true })

      if (error) throw error
      setLocations(data || [])
    } catch (error: any) {
      console.error("Error fetching locations:", error.message)
      toast({
        title: "Error",
        description: "No se pudieron cargar los locales",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar datos
      if (!formData.name) {
        throw new Error("Por favor ingrese el nombre del local")
      }

      // Insertar en la base de datos
      const supabase = createClient()
      const { error } = await supabase.from("locations").insert([
        {
          name: formData.name,
          address: formData.address || null,
          active: true,
        },
      ])

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Local agregado correctamente",
      })

      // Limpiar formulario y recargar locales
      setFormData({
        name: "",
        address: "",
      })
      fetchLocations()
    } catch (error: any) {
      console.error("Error adding location:", error.message)
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el local",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleLocationStatus = async (location: Location) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("locations").update({ active: !location.active }).eq("id", location.id)

      if (error) throw error

      toast({
        title: "Éxito",
        description: `Local ${location.active ? "desactivado" : "activado"} correctamente`,
      })

      fetchLocations()
    } catch (error: any) {
      console.error("Error updating location:", error.message)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el local",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agregar Nuevo Local</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Local</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" name="address" value={formData.address} onChange={handleChange} />
              </div>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Agregar Local"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Locales Configurados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Cargando locales...</div>
          ) : locations.length === 0 ? (
            <div className="text-center p-4">No hay locales configurados</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell>{location.name}</TableCell>
                    <TableCell>{location.address || "-"}</TableCell>
                    <TableCell>{location.active ? "Activo" : "Inactivo"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={location.active ? "outline" : "default"}
                        size="sm"
                        onClick={() => toggleLocationStatus(location)}
                      >
                        {location.active ? "Desactivar" : "Activar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
