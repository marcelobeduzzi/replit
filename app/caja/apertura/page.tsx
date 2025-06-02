"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Lista de locales para seleccionar
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

export default function AperturaCajaPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)
  const [needsSupervisor, setNeedsSupervisor] = useState(false)
  const [totalCalculado, setTotalCalculado] = useState(0)
  const [existingApertura, setExistingApertura] = useState(false)

  // Estado para los datos de apertura
  const [formData, setFormData] = useState({
    local_id: "",
    local_name: "",
    date: format(new Date(), "yyyy-MM-dd"),
    shift: "mañana",
    responsible: "",
    supervisor: "",
    supervisor_pin: "",

    // Desglose de billetes
    bills_1000: 0,
    bills_500: 0,
    bills_200: 0,
    bills_100: 0,
    bills_50: 0,
    bills_20: 0,
    bills_10: 0,
    coins: 0,

    // Verificaciones
    pos_operational: true,
    printer_operational: true,
    observations: "",
    
    // Estado
    status: "pendiente",
    has_closing: false,
    initial_amount: 0
  })

  // Calcular el total basado en el desglose de billetes
  useEffect(() => {
    const total =
      formData.bills_1000 * 1000 +
      formData.bills_500 * 500 +
      formData.bills_200 * 200 +
      formData.bills_100 * 100 +
      formData.bills_50 * 50 +
      formData.bills_20 * 20 +
      formData.bills_10 * 10 +
      formData.coins

    setTotalCalculado(total)
    
    setFormData(prev => ({
      ...prev,
      initial_amount: total
    }))
  }, [
    formData.bills_1000,
    formData.bills_500,
    formData.bills_200,
    formData.bills_100,
    formData.bills_50,
    formData.bills_20,
    formData.bills_10,
    formData.coins
  ])

  // Manejar cambios en los campos del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Manejar cambios en campos numéricos
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? 0 : Number.parseInt(value, 10),
    }))
  }

  // Manejar cambios en switches
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  // Manejar cambios en selects
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    
    // Si cambia el local, actualizar el nombre del local
    if (name === "local_id") {
      const selectedLocal = locales.find((local) => local.id === value)
      if (selectedLocal) {
        setFormData((prev) => ({
          ...prev,
          local_name: selectedLocal.name,
        }))
      }
      
      // Verificar si ya existe una apertura para este local y turno
      checkExistingApertura(value, formData.date, formData.shift)
    }
    
    // Si cambia la fecha o el turno, verificar si ya existe una apertura
    if (name === "date" || name === "shift") {
      checkExistingApertura(formData.local_id, name === "date" ? value : formData.date, name === "shift" ? value : formData.shift)
    }
  }

  // Verificar si ya existe una apertura para este turno
  const checkExistingApertura = async (localId: string, date: string, shift: string) => {
    if (!localId || !date || !shift) return
    
    try {
      const { data, error } = await supabase
        .from('cash_register_openings')
        .select('*')
        .eq('local_id', localId)
        .eq('date', date)
        .eq('shift', shift)
        .eq('has_closing', false)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error al verificar apertura existente:", error)
      }
      
      setExistingApertura(!!data)
    } catch (error) {
      console.error("Error al verificar apertura existente:", error)
    }
  }

  // Validar el formulario
  const validateForm = () => {
    if (!formData.local_id) {
      toast({
        title: "Error",
        description: "Debes seleccionar un local",
        variant: "destructive",
      })
      return false
    }

    if (!formData.responsible) {
      toast({
        title: "Error",
        description: "Debes ingresar el nombre del responsable",
        variant: "destructive",
      })
      return false
    }

    if (needsSupervisor && (!formData.supervisor || !formData.supervisor_pin)) {
      toast({
        title: "Error",
        description: "Se requiere autorización del supervisor",
        variant: "destructive",
      })
      return false
    }

    if (totalCalculado <= 0) {
      toast({
        title: "Error",
        description: "El monto inicial debe ser mayor a cero",
        variant: "destructive",
      })
      return false
    }
    
    if (existingApertura) {
      toast({
        title: "Error",
        description: "Ya existe una apertura para este local, fecha y turno",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  // Guardar la apertura de caja
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setIsLoading(true)

      // Preparar datos para guardar
      const aperturaData = {
        local_id: formData.local_id,
        local_name: formData.local_name,
        date: formData.date,
        shift: formData.shift,
        responsible: formData.responsible,
        supervisor: needsSupervisor ? formData.supervisor : null,
        supervisor_pin: needsSupervisor ? formData.supervisor_pin : null,
        
        // Desglose de billetes
        bills_1000: formData.bills_1000,
        bills_500: formData.bills_500,
        bills_200: formData.bills_200,
        bills_100: formData.bills_100,
        bills_50: formData.bills_50,
        bills_20: formData.bills_20,
        bills_10: formData.bills_10,
        coins: formData.coins,
        
        // Verificaciones
        pos_operational: formData.pos_operational,
        printer_operational: formData.printer_operational,
        observations: formData.observations,
        
        // Estado
        status: needsSupervisor ? 'pendiente' : 'aprobado',
        has_closing: false,
        initial_amount: totalCalculado,
        
        // Timestamp
        created_at: new Date().toISOString()
      }
      
      // Insertar en la base de datos
      const { error } = await supabase
        .from('cash_register_openings')
        .insert(aperturaData)
      
      if (error) throw error

      toast({
        title: "Apertura registrada",
        description: "La apertura de caja se ha registrado correctamente",
      })

      // Redireccionar a la página de cajas
      router.push("/caja")
    } catch (error) {
      console.error("Error al guardar la apertura:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al registrar la apertura de caja",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout isLoading={isLoading}>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Apertura de Caja</h1>
          <Button variant="outline" onClick={() => router.push("/caja")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Información general */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Información General</CardTitle>
                <CardDescription>Datos básicos de la apertura</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="local_id">Local</Label>
                  <Select
                    name="local_id"
                    value={formData.local_id}
                    onValueChange={(value) => handleSelectChange("local_id", value)}
                  >
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

                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input 
                    id="date" 
                    name="date" 
                    type="date" 
                    value={formData.date} 
                    onChange={handleInputChange}
                    onBlur={(e) => handleSelectChange("date", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shift">Turno</Label>
                  <Select
                    name="shift"
                    value={formData.shift}
                    onValueChange={(value) => handleSelectChange("shift", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar turno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mañana">Mañana</SelectItem>
                      <SelectItem value="tarde">Tarde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {existingApertura && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-700">
                      <p className="font-medium">Apertura existente</p>
                      <p>
                        Ya existe una apertura para este local, fecha y turno. Por favor, selecciona otra combinación.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="responsible">Responsable de Caja</Label>
                  <Input
                    id="responsible"
                    name="responsible"
                    value={formData.responsible}
                    onChange={handleInputChange}
                    placeholder="Nombre del responsable"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="supervisor" className="cursor-pointer">
                      Supervisor (opcional)
                    </Label>
                    <span className="text-xs text-muted-foreground">{needsSupervisor ? "Requerido" : "Opcional"}</span>
                  </div>
                  <Input
                    id="supervisor"
                    name="supervisor"
                    value={formData.supervisor}
                    onChange={handleInputChange}
                    placeholder="Nombre del supervisor"
                    required={needsSupervisor}
                  />
                </div>

                {(needsSupervisor || formData.supervisor) && (
                  <div className="space-y-2">
                    <Label htmlFor="supervisor_pin">PIN del Supervisor</Label>
                    <Input
                      id="supervisor_pin"
                      name="supervisor_pin"
                      type="password"
                      value={formData.supervisor_pin}
                      onChange={handleInputChange}
                      placeholder="PIN de autorización"
                      required={needsSupervisor}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Desglose de efectivo */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Desglose de Efectivo</CardTitle>
                <CardDescription>Detalle del efectivo inicial</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bills_1000">Billetes de $1000</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="bills_1000"
                      name="bills_1000"
                      type="number"
                      min="0"
                      value={formData.bills_1000 || ""}
                      onChange={handleNumberChange}
                    />
                    <span className="text-sm font-medium">= ${formData.bills_1000 * 1000}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bills_500">Billetes de $500</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="bills_500"
                      name="bills_500"
                      type="number"
                      min="0"
                      value={formData.bills_500 || ""}
                      onChange={handleNumberChange}
                    />
                    <span className="text-sm font-medium">= ${formData.bills_500 * 500}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bills_200">Billetes de $200</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="bills_200"
                      name="bills_200"
                      type="number"
                      min="0"
                      value={formData.bills_200 || ""}
                      onChange={handleNumberChange}
                    />
                    <span className="text-sm font-medium">= ${formData.bills_200 * 200}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bills_100">Billetes de $100</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="bills_100"
                      name="bills_100"
                      type="number"
                      min="0"
                      value={formData.bills_100 || ""}
                      onChange={handleNumberChange}
                    />
                    <span className="text-sm font-medium">= ${formData.bills_100 * 100}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bills_50">Billetes de $50</Label>
                    <Input
                      id="bills_50"
                      name="bills_50"
                      type="number"
                      min="0"
                      value={formData.bills_50 || ""}
                      onChange={handleNumberChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bills_20">Billetes de $20</Label>
                    <Input
                      id="bills_20"
                      name="bills_20"
                      type="number"
                      min="0"
                      value={formData.bills_20 || ""}
                      onChange={handleNumberChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bills_10">Billetes de $10</Label>
                    <Input
                      id="bills_10"
                      name="bills_10"
                      type="number"
                      min="0"
                      value={formData.bills_10 || ""}
                      onChange={handleNumberChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coins">Monedas (total)</Label>
                    <Input
                      id="coins"
                      name="coins"
                      type="number"
                      min="0"
                      value={formData.coins || ""}
                      onChange={handleNumberChange}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Efectivo:</span>
                    <span className="text-xl font-bold">${totalCalculado.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verificaciones y observaciones */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Verificaciones</CardTitle>
                <CardDescription>Estado de equipos y observaciones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pos_operational" className="cursor-pointer">
                      Terminal POS operativa
                    </Label>
                    <Switch
                      id="pos_operational"
                      checked={formData.pos_operational}
                      onCheckedChange={(checked) => handleSwitchChange("pos_operational", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="printer_operational" className="cursor-pointer">
                      Impresora operativa
                    </Label>
                    <Switch
                      id="printer_operational"
                      checked={formData.printer_operational}
                      onCheckedChange={(checked) => handleSwitchChange("printer_operational", checked)}
                    />
                  </div>
                </div>

                {(!formData.pos_operational || !formData.printer_operational) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-700">
                      <p className="font-medium">Atención</p>
                      <p>
                        Has indicado que algún equipo no está operativo. Por favor, detalla el problema en las
                        observaciones y notifica a soporte técnico.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="observations">Observaciones</Label>
                  <Textarea
                    id="observations"
                    name="observations"
                    value={formData.observations}
                    onChange={handleInputChange}
                    placeholder="Ingresa cualquier observación relevante"
                    rows={5}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Guardando..." : "Registrar Apertura"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

