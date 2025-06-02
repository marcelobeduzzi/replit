"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { balanceService } from "@/lib/balance-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import type { Balance, BalanceServicios } from "@/types/balance"

type BalanceFormProps = {
  localId: string
  localName: string
  balanceId?: string
}

export function BalanceForm({ localId, localName, balanceId }: BalanceFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const [isEditing, setIsEditing] = useState(!!balanceId)

  const [balanceData, setBalanceData] = useState<Partial<Balance>>({
    localId,
    local: localName,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    ventasRappi: 0,
    ventasPedidosYa: 0,
    ventasDebitoCreditoQR: 0, // Con QR en mayúsculas
    ventasEfectivo: 0,
    cmv: 0,
    desperdicio: 0,
    consumos: 0,
    contribucionMarginal: 0,
    fee: 0,
    alquiler: 0,
    sueldos: 0,
    gastos: 0,
    ebit: 0,
    iva: 0,
    iibb: 0,
    ccss: 0,
    tarjeta: 0,
  })

  const [serviciosData, setServiciosData] = useState<Partial<BalanceServicios>>({
    prosegur: 0,
    internet: 0,
    seguro: 0,
    desinfectacion: 0,
    edenor: 0,
    metrogas: 0,
    abl: 0,
    expensas: 0,
    autonomo: 0,
    abogado: 0,
    contador: 0,
    datalive: 0,
    payway: 0,
    personal: 0,
  })

  // Cargar datos si estamos editando
  useEffect(() => {
    if (balanceId) {
      const loadBalanceData = async () => {
        setIsLoading(true)
        try {
          const balance = await balanceService.getBalanceById(balanceId)
          if (balance) {
            setBalanceData(balance)
          }

          const servicios = await balanceService.getBalanceServices(balanceId)
          if (servicios) {
            setServiciosData(servicios)
          }
        } catch (error) {
          console.error("Error al cargar datos del balance:", error)
          toast({
            title: "Error",
            description: "No se pudieron cargar los datos del balance",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }

      loadBalanceData()
    }
  }, [balanceId, toast])

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setBalanceData((prev) => ({ ...prev, [name]: value === "" ? 0 : Number(value) }))
  }

  const handleServiciosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setServiciosData((prev) => ({ ...prev, [name]: value === "" ? 0 : Number(value) }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setBalanceData((prev) => ({ ...prev, [name]: Number(value) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isEditing && balanceId) {
        // Actualizar balance existente
        await balanceService.updateBalance(balanceId, balanceData as Balance, serviciosData)
        toast({
          title: "Éxito",
          description: "Balance actualizado correctamente",
        })
      } else {
        // Crear nuevo balance
        await balanceService.createBalance(balanceData as Balance, serviciosData)
        toast({
          title: "Éxito",
          description: "Balance creado correctamente",
        })
      }

      // Redirigir a la lista de balances
      router.push("/balances")
      router.refresh()
    } catch (error) {
      console.error("Error al guardar balance:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el balance",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="general">Información General</TabsTrigger>
          <TabsTrigger value="ventas">Ventas y Costos</TabsTrigger>
          <TabsTrigger value="servicios">Servicios</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Datos básicos del balance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="month">Mes</Label>
                  <Select
                    value={balanceData.month?.toString()}
                    onValueChange={(value) => handleSelectChange("month", value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="month">
                      <SelectValue placeholder="Seleccionar mes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Enero</SelectItem>
                      <SelectItem value="2">Febrero</SelectItem>
                      <SelectItem value="3">Marzo</SelectItem>
                      <SelectItem value="4">Abril</SelectItem>
                      <SelectItem value="5">Mayo</SelectItem>
                      <SelectItem value="6">Junio</SelectItem>
                      <SelectItem value="7">Julio</SelectItem>
                      <SelectItem value="8">Agosto</SelectItem>
                      <SelectItem value="9">Septiembre</SelectItem>
                      <SelectItem value="10">Octubre</SelectItem>
                      <SelectItem value="11">Noviembre</SelectItem>
                      <SelectItem value="12">Diciembre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Año</Label>
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    value={balanceData.year || ""}
                    onChange={handleBalanceChange}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="local">Local</Label>
                <Input
                  id="local"
                  name="local"
                  value={balanceData.local || ""}
                  onChange={(e) => setBalanceData((prev) => ({ ...prev, local: e.target.value }))}
                  disabled={isLoading}
                  required
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ventas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ventas</CardTitle>
              <CardDescription>Ingresos por canal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ventasRappi">Ventas Rappi</Label>
                  <Input
                    id="ventasRappi"
                    name="ventasRappi"
                    type="number"
                    step="0.01"
                    value={balanceData.ventasRappi || ""}
                    onChange={handleBalanceChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ventasPedidosYa">Ventas Pedidos Ya</Label>
                  <Input
                    id="ventasPedidosYa"
                    name="ventasPedidosYa"
                    type="number"
                    step="0.01"
                    value={balanceData.ventasPedidosYa || ""}
                    onChange={handleBalanceChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ventasDebitoCreditoQR">Ventas Débito/Crédito QR</Label>
                  <Input
                    id="ventasDebitoCreditoQR"
                    name="ventasDebitoCreditoQR"
                    type="number"
                    step="0.01"
                    value={balanceData.ventasDebitoCreditoQR || ""}
                    onChange={handleBalanceChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ventasEfectivo">Ventas Efectivo</Label>
                  <Input
                    id="ventasEfectivo"
                    name="ventasEfectivo"
                    type="number"
                    step="0.01"
                    value={balanceData.ventasEfectivo || ""}
                    onChange={handleBalanceChange}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Costos y Gastos</CardTitle>
              <CardDescription>Costos operativos y gastos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cmv">CMV</Label>
                  <Input
                    id="cmv"
                    name="cmv"
                    type="number"
                    step="0.01"
                    value={balanceData.cmv || ""}
                    onChange={handleBalanceChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desperdicio">Desperdicio</Label>
                  <Input
                    id="desperdicio"
                    name="desperdicio"
                    type="number"
                    step="0.01"
                    value={balanceData.desperdicio || ""}
                    onChange={handleBalanceChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consumos">Consumos</Label>
                  <Input
                    id="consumos"
                    name="consumos"
                    type="number"
                    step="0.01"
                    value={balanceData.consumos || ""}
                    onChange={handleBalanceChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contribucionMarginal">Contribución Marginal</Label>
                  <Input
                    id="contribucionMarginal"
                    name="contribucionMarginal"
                    type="number"
                    step="0.01"
                    value={balanceData.contribucionMarginal || ""}
                    onChange={handleBalanceChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee">Fee</Label>
                  <Input
                    id="fee"
                    name="fee"
                    type="number"
                    step="0.01"
                    value={balanceData.fee || ""}
                    onChange={handleBalanceChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alquiler">Alquiler</Label>
                  <Input
                    id="alquiler"
                    name="alquiler"
                    type="number"
                    step="0.01"
                    value={balanceData.alquiler || ""}
                    onChange={handleBalanceChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sueldos">Sueldos</Label>
                  <Input
                    id="sueldos"
                    name="sueldos"
                    type="number"
                    step="0.01"
                    value={balanceData.sueldos || ""}
                    onChange={handleBalanceChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gastos">Otros Gastos</Label>
                  <Input
                    id="gastos"
                    name="gastos"
                    type="number"
                    step="0.01"
                    value={balanceData.gastos || ""}
                    onChange={handleBalanceChange}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Impuestos y Resultados</CardTitle>
              <CardDescription>Impuestos y resultados financieros</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ebit">EBIT</Label>
                  <Input
                    id="ebit"
                    name="ebit"
                    type="number"
                    step="0.01"
                    value={balanceData.ebit || ""}
                    onChange={handleBalanceChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iva">IVA</Label>
                  <Input
                    id="iva"
                    name="iva"
                    type="number"
                    step="0.01"
                    value={balanceData.iva || ""}
                    onChange={handleBalanceChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iibb">IIBB</Label>
                  <Input
                    id="iibb"
                    name="iibb"
                    type="number"
                    step="0.01"
                    value={balanceData.iibb || ""}
                    onChange={handleBalanceChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ccss">CCSS</Label>
                  <Input
                    id="ccss"
                    name="ccss"
                    type="number"
                    step="0.01"
                    value={balanceData.ccss || ""}
                    onChange={handleBalanceChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tarjeta">Tarjeta</Label>
                  <Input
                    id="tarjeta"
                    name="tarjeta"
                    type="number"
                    step="0.01"
                    value={balanceData.tarjeta || ""}
                    onChange={handleBalanceChange}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="servicios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Servicios</CardTitle>
              <CardDescription>Gastos en servicios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prosegur">Prosegur</Label>
                  <Input
                    id="prosegur"
                    name="prosegur"
                    type="number"
                    step="0.01"
                    value={serviciosData.prosegur || ""}
                    onChange={handleServiciosChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="internet">Internet</Label>
                  <Input
                    id="internet"
                    name="internet"
                    type="number"
                    step="0.01"
                    value={serviciosData.internet || ""}
                    onChange={handleServiciosChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seguro">Seguro</Label>
                  <Input
                    id="seguro"
                    name="seguro"
                    type="number"
                    step="0.01"
                    value={serviciosData.seguro || ""}
                    onChange={handleServiciosChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desinfectacion">Desinfectación</Label>
                  <Input
                    id="desinfectacion"
                    name="desinfectacion"
                    type="number"
                    step="0.01"
                    value={serviciosData.desinfectacion || ""}
                    onChange={handleServiciosChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edenor">Edenor</Label>
                  <Input
                    id="edenor"
                    name="edenor"
                    type="number"
                    step="0.01"
                    value={serviciosData.edenor || ""}
                    onChange={handleServiciosChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metrogas">Metrogas</Label>
                  <Input
                    id="metrogas"
                    name="metrogas"
                    type="number"
                    step="0.01"
                    value={serviciosData.metrogas || ""}
                    onChange={handleServiciosChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="abl">ABL</Label>
                  <Input
                    id="abl"
                    name="abl"
                    type="number"
                    step="0.01"
                    value={serviciosData.abl || ""}
                    onChange={handleServiciosChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expensas">Expensas</Label>
                  <Input
                    id="expensas"
                    name="expensas"
                    type="number"
                    step="0.01"
                    value={serviciosData.expensas || ""}
                    onChange={handleServiciosChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="autonomo">Autónomo</Label>
                  <Input
                    id="autonomo"
                    name="autonomo"
                    type="number"
                    step="0.01"
                    value={serviciosData.autonomo || ""}
                    onChange={handleServiciosChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="abogado">Abogado</Label>
                  <Input
                    id="abogado"
                    name="abogado"
                    type="number"
                    step="0.01"
                    value={serviciosData.abogado || ""}
                    onChange={handleServiciosChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contador">Contador</Label>
                  <Input
                    id="contador"
                    name="contador"
                    type="number"
                    step="0.01"
                    value={serviciosData.contador || ""}
                    onChange={handleServiciosChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="datalive">Datalive</Label>
                  <Input
                    id="datalive"
                    name="datalive"
                    type="number"
                    step="0.01"
                    value={serviciosData.datalive || ""}
                    onChange={handleServiciosChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payway">Payway</Label>
                  <Input
                    id="payway"
                    name="payway"
                    type="number"
                    step="0.01"
                    value={serviciosData.payway || ""}
                    onChange={handleServiciosChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="personal">Personal</Label>
                  <Input
                    id="personal"
                    name="personal"
                    type="number"
                    step="0.01"
                    value={serviciosData.personal || ""}
                    onChange={handleServiciosChange}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => router.push("/balances")} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Guardando..." : isEditing ? "Actualizar Balance" : "Crear Balance"}
        </Button>
      </div>
    </form>
  )
}
