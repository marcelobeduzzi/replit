"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"

// Lista fija de locales con IDs numéricos
const locales = [
  { id: 1, name: "BR Cabildo", hasTwoCashRegisters: false },
  { id: 2, name: "BR Carranza", hasTwoCashRegisters: false },
  { id: 3, name: "BR Pacífico", hasTwoCashRegisters: true },
  { id: 4, name: "BR Lavalle", hasTwoCashRegisters: true },
  { id: 5, name: "BR Rivadavia", hasTwoCashRegisters: false },
  { id: 6, name: "BR Aguero", hasTwoCashRegisters: true },
  { id: 7, name: "BR Dorrego", hasTwoCashRegisters: false },
  { id: 8, name: "Dean & Dennys", hasTwoCashRegisters: false },
]

export function GenerateDiscrepanciesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    locationId: "",
    shift: "mañana",
    overwrite: false,
    forceCashDiscrepancies: false,
  })

  // Cargar parámetros de la URL si existen
  useEffect(() => {
    const localIdParam = searchParams.get("localId")
    if (localIdParam) {
      setFormData((prev) => ({
        ...prev,
        locationId: localIdParam,
      }))
    }
  }, [searchParams])

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.date || !formData.locationId || !formData.shift) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      })
      return
    }

    // Si overwrite es true, pedir confirmación adicional
    if (formData.overwrite) {
      const confirmed = confirm(
        "ADVERTENCIA: Has seleccionado sobrescribir discrepancias existentes. Esta acción eliminará todas las discrepancias previas para la fecha y local seleccionados. ¿Estás seguro de continuar?",
      )
      if (!confirmed) {
        return
      }
    }

    try {
      setIsLoading(true)

      // Obtener información sobre si el local tiene dos cajas
      const selectedLocal = locales.find((local) => local.id === Number(formData.locationId))
      const hasTwoCashRegisters = selectedLocal?.hasTwoCashRegisters || false

      // Llamar al procedimiento almacenado con el parámetro adicional
      const { error } = await supabase.rpc("generate_discrepancies", {
        p_date: formData.date,
        p_location_id: Number(formData.locationId),
        p_shift: formData.shift,
        p_overwrite: formData.overwrite,
        p_has_two_registers: hasTwoCashRegisters,
        p_force_cash_discrepancies: formData.forceCashDiscrepancies,
      })

      if (error) {
        console.error("Error al generar discrepancias:", error)
        throw new Error(error.message)
      }

      toast({
        title: "Éxito",
        description: "Discrepancias generadas correctamente",
      })

      // Redirigir al detalle del local después de generar discrepancias
      router.push(`/conciliacion/local/${formData.locationId}?date=${formData.date}&shift=${formData.shift}`)
    } catch (error: any) {
      console.error("Error al generar discrepancias:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron generar las discrepancias",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push("/conciliacion")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generar Discrepancias</CardTitle>
          <CardDescription>Genera discrepancias de stock y caja a partir de los datos existentes</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Local</Label>
              <Select
                value={formData.locationId}
                onValueChange={(value) => handleChange("locationId", value)}
                disabled={isLoading}
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder="Seleccionar local" />
                </SelectTrigger>
                <SelectContent>
                  {locales.map((local) => (
                    <SelectItem key={local.id} value={local.id.toString()}>
                      {local.name} {local.hasTwoCashRegisters ? "(2 cajas)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift">Turno</Label>
              <Select
                value={formData.shift}
                onValueChange={(value) => handleChange("shift", value)}
                disabled={isLoading}
              >
                <SelectTrigger id="shift">
                  <SelectValue placeholder="Seleccionar turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mañana">Mañana</SelectItem>
                  <SelectItem value="tarde">Tarde</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="overwrite"
                checked={formData.overwrite}
                onCheckedChange={(checked) => handleChange("overwrite", checked)}
                disabled={isLoading}
              />
              <Label htmlFor="overwrite" className="cursor-pointer">
                Sobrescribir discrepancias existentes
              </Label>
            </div>

            {formData.overwrite && (
              <div className="bg-amber-50 p-3 rounded-md border border-amber-200 flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Esta opción eliminará todas las discrepancias existentes para la fecha y local seleccionados antes de
                  generar nuevas.
                </p>
              </div>
            )}

            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="forceCashDiscrepancies"
                checked={formData.forceCashDiscrepancies}
                onCheckedChange={(checked) => handleChange("forceCashDiscrepancies", checked)}
                disabled={isLoading}
              />
              <Label htmlFor="forceCashDiscrepancies" className="cursor-pointer">
                Forzar generación de discrepancias de caja
              </Label>
            </div>

            {formData.forceCashDiscrepancies && (
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200 flex items-start">
                <AlertTriangle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Esta opción intentará generar discrepancias de caja incluso si no se detectan automáticamente. Útil si
                  sabes que hay cierres de caja pero no aparecen discrepancias.
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                "Generar Discrepancias"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
