"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, Save } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Lista de locales
const locales = [
  { id: "cabildo", name: "BR Cabildo" },
  { id: "carranza", name: "BR Carranza" },
  { id: "pacifico", name: "BR Pacífico" },
  { id: "lavalle", name: "BR Lavalle" },
  { id: "rivadavia", name: "BR Rivadavia" },
  { id: "aguero", name: "BR Aguero" },
  { id: "dorrego", name: "BR Dorrego" },
  { id: "dean_dennys", name: "Dean & Dennys" },
]

export default function RegistroStockPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Estado del formulario
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    shift: "mañana",
    local_id: "",
    local_name: "",
    responsible: "",

    // Empanadas
    empanadas_real: 0,
    empanadas_datalive: 0,

    // Bebidas
    gaseosa_grande_real: 0,
    gaseosa_grande_datalive: 0,
    gaseosa_chica_real: 0,
    gaseosa_chica_datalive: 0,
    agua_chica_real: 0,
    agua_chica_datalive: 0,
    cerveza_real: 0,
    cerveza_datalive: 0,

    // Medialunas
    medialunas_real: 0,
    medialunas_datalive: 0,

    // Almibar
    almibar_real: 0,

    // Pizzas
    pizzas_real: 0,
    pizzas_datalive: 0,

    observations: "",
  })

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes("real") || name.includes("datalive") ? Number.parseInt(value) || 0 : value,
    }))
  }

  // Manejar cambio de local
  const handleLocalChange = (value: string) => {
    const selectedLocal = locales.find((local) => local.id === value)
    setFormData((prev) => ({
      ...prev,
      local_id: value,
      local_name: selectedLocal?.name || "",
    }))
  }

  // Manejar cambio de turno
  const handleShiftChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      shift: value,
    }))
  }

  // Guardar registro
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSaving(true)

      // Validar campos requeridos
      if (!formData.local_id || !formData.responsible) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos requeridos",
          variant: "destructive",
        })
        return
      }

      // Insertar registro en la base de datos
      const { data, error } = await supabase.from("stock_records").insert(formData).select()

      if (error) throw error

      // Generar alertas automáticas para diferencias significativas
      await generateAlerts(data[0].id)

      toast({
        title: "Registro guardado",
        description: "El registro de stock se ha guardado correctamente",
      })

      // Redireccionar a la página principal
      router.push("/stock")
    } catch (error: any) {
      console.error("Error al guardar registro:", error)
      toast({
        title: "Error",
        description: error.message || "Ha ocurrido un error al guardar el registro",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Generar alertas automáticas
  const generateAlerts = async (recordId: string) => {
    try {
      // Productos a verificar
      const products = [
        { name: "empanadas", real: formData.empanadas_real, datalive: formData.empanadas_datalive },
        { name: "medialunas", real: formData.medialunas_real, datalive: formData.medialunas_datalive },
        { name: "pizzas", real: formData.pizzas_real, datalive: formData.pizzas_datalive },
        { name: "gaseosa_grande", real: formData.gaseosa_grande_real, datalive: formData.gaseosa_grande_datalive },
        { name: "gaseosa_chica", real: formData.gaseosa_chica_real, datalive: formData.gaseosa_chica_datalive },
        { name: "agua_chica", real: formData.agua_chica_real, datalive: formData.agua_chica_datalive },
        { name: "cerveza", real: formData.cerveza_real, datalive: formData.cerveza_datalive },
      ]

      // Verificar diferencias y generar alertas
      for (const product of products) {
        const difference = product.real - product.datalive

        // Si hay diferencia, generar alerta
        if (difference !== 0 && product.datalive > 0) {
          const percentage = (difference / product.datalive) * 100
          const alertType = difference < 0 ? "faltante" : "sobrante"

          await supabase.from("stock_alerts").insert({
            stock_record_id: recordId,
            type: alertType,
            product: product.name,
            difference,
            percentage,
            status: "activa",
            local_id: formData.local_id,
            local_name: formData.local_name,
            date: new Date().toISOString(),
          })
        }
      }
    } catch (error) {
      console.error("Error al generar alertas:", error)
    }
  }

  return (
    <DashboardLayout isLoading={isLoading}>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold">Nuevo Registro de Stock</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Información general */}
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
                <CardDescription>Datos generales del registro de stock</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha</Label>
                    <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shift">Turno</Label>
                    <Select value={formData.shift} onValueChange={handleShiftChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar turno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mañana">Mañana</SelectItem>
                        <SelectItem value="tarde">Tarde</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="local">Local</Label>
                    <Select value={formData.local_id} onValueChange={handleLocalChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar local" />
                      </SelectTrigger>
                      <SelectContent>
                        {locales.map((local) => (
                          <SelectItem key={local.id} value={local.id}>
                            {local.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsible">Responsable</Label>
                  <Input
                    id="responsible"
                    name="responsible"
                    value={formData.responsible}
                    onChange={handleChange}
                    placeholder="Nombre del responsable"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Empanadas */}
            <Card>
              <CardHeader>
                <CardTitle>Empanadas</CardTitle>
                <CardDescription>Registro de stock de empanadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="empanadas_real">Cantidad Real (conteo físico)</Label>
                    <Input
                      id="empanadas_real"
                      name="empanadas_real"
                      type="number"
                      value={formData.empanadas_real}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="empanadas_datalive">Cantidad Datalive</Label>
                    <Input
                      id="empanadas_datalive"
                      name="empanadas_datalive"
                      type="number"
                      value={formData.empanadas_datalive}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bebidas */}
            <Card>
              <CardHeader>
                <CardTitle>Bebidas</CardTitle>
                <CardDescription>Registro de stock de bebidas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Gaseosa Grande</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gaseosa_grande_real">Cantidad Real</Label>
                        <Input
                          id="gaseosa_grande_real"
                          name="gaseosa_grande_real"
                          type="number"
                          value={formData.gaseosa_grande_real}
                          onChange={handleChange}
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gaseosa_grande_datalive">Cantidad Datalive</Label>
                        <Input
                          id="gaseosa_grande_datalive"
                          name="gaseosa_grande_datalive"
                          type="number"
                          value={formData.gaseosa_grande_datalive}
                          onChange={handleChange}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Gaseosa Chica</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gaseosa_chica_real">Cantidad Real</Label>
                        <Input
                          id="gaseosa_chica_real"
                          name="gaseosa_chica_real"
                          type="number"
                          value={formData.gaseosa_chica_real}
                          onChange={handleChange}
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gaseosa_chica_datalive">Cantidad Datalive</Label>
                        <Input
                          id="gaseosa_chica_datalive"
                          name="gaseosa_chica_datalive"
                          type="number"
                          value={formData.gaseosa_chica_datalive}
                          onChange={handleChange}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Agua Chica</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="agua_chica_real">Cantidad Real</Label>
                        <Input
                          id="agua_chica_real"
                          name="agua_chica_real"
                          type="number"
                          value={formData.agua_chica_real}
                          onChange={handleChange}
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="agua_chica_datalive">Cantidad Datalive</Label>
                        <Input
                          id="agua_chica_datalive"
                          name="agua_chica_datalive"
                          type="number"
                          value={formData.agua_chica_datalive}
                          onChange={handleChange}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Cerveza</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cerveza_real">Cantidad Real</Label>
                        <Input
                          id="cerveza_real"
                          name="cerveza_real"
                          type="number"
                          value={formData.cerveza_real}
                          onChange={handleChange}
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cerveza_datalive">Cantidad Datalive</Label>
                        <Input
                          id="cerveza_datalive"
                          name="cerveza_datalive"
                          type="number"
                          value={formData.cerveza_datalive}
                          onChange={handleChange}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medialunas */}
            <Card>
              <CardHeader>
                <CardTitle>Medialunas</CardTitle>
                <CardDescription>Registro de stock de medialunas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="medialunas_real">Cantidad Real (conteo físico)</Label>
                    <Input
                      id="medialunas_real"
                      name="medialunas_real"
                      type="number"
                      value={formData.medialunas_real}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medialunas_datalive">Cantidad Datalive</Label>
                    <Input
                      id="medialunas_datalive"
                      name="medialunas_datalive"
                      type="number"
                      value={formData.medialunas_datalive}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Almibar */}
            <Card>
              <CardHeader>
                <CardTitle>Almibar</CardTitle>
                <CardDescription>Registro de stock de almibar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="almibar_real">Cantidad Real (conteo físico)</Label>
                  <Input
                    id="almibar_real"
                    name="almibar_real"
                    type="number"
                    value={formData.almibar_real}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pizzas */}
            <Card>
              <CardHeader>
                <CardTitle>Pizzas</CardTitle>
                <CardDescription>Registro de stock de pizzas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pizzas_real">Cantidad Real (conteo físico)</Label>
                    <Input
                      id="pizzas_real"
                      name="pizzas_real"
                      type="number"
                      value={formData.pizzas_real}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pizzas_datalive">Cantidad Datalive</Label>
                    <Input
                      id="pizzas_datalive"
                      name="pizzas_datalive"
                      type="number"
                      value={formData.pizzas_datalive}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Observaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Observaciones</CardTitle>
                <CardDescription>Información adicional sobre el registro</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="observations"
                  name="observations"
                  value={formData.observations}
                  onChange={handleChange}
                  placeholder="Ingresa cualquier observación relevante..."
                  className="min-h-[100px]"
                />
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <span className="flex items-center">
                      <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                      Guardando...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Registro
                    </span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

