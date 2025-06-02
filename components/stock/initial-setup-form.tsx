"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { mockProducts, mockUsers } from "@/lib/mock-data"

interface InitialSetupFormProps {
  onSubmit: (data: any) => void
}

export function InitialSetupForm({ onSubmit }: InitialSetupFormProps) {
  const { toast } = useToast()
  const [userId, setUserId] = useState("")
  const [supervisorId, setSupervisorId] = useState("")
  const [confirmationPin, setConfirmationPin] = useState("")
  const [supervisorPin, setSupervisorPin] = useState("")
  const [stockItems, setStockItems] = useState(
    mockProducts.map((product) => ({
      productId: product.id,
      productName: product.name,
      quantity: 0,
    })),
  )

  const handleQuantityChange = (index: number, value: number) => {
    const newStockItems = [...stockItems]
    newStockItems[index].quantity = value
    setStockItems(newStockItems)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!userId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un encargado",
        variant: "destructive",
      })
      return
    }

    if (!supervisorId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un supervisor para la configuración inicial",
        variant: "destructive",
      })
      return
    }

    if (!confirmationPin) {
      toast({
        title: "Error",
        description: "El encargado debe ingresar su PIN de confirmación",
        variant: "destructive",
      })
      return
    }

    if (!supervisorPin) {
      toast({
        title: "Error",
        description: "El supervisor debe ingresar su PIN de confirmación",
        variant: "destructive",
      })
      return
    }

    // Verificar que al menos un producto tenga cantidad
    const hasProducts = stockItems.some((item) => item.quantity > 0)
    if (!hasProducts) {
      toast({
        title: "Error",
        description: "Debes ingresar al menos un producto con cantidad mayor a cero",
        variant: "destructive",
      })
      return
    }

    // Enviar datos
    onSubmit({
      type: "configuracion-inicial",
      userId,
      supervisorId,
      confirmationPin,
      supervisorPin,
      items: stockItems.filter((item) => item.quantity > 0),
      date: new Date().toISOString(),
      shift: getCurrentShift(),
      localId: "local-1", // En un caso real, esto vendría de un contexto o selección
      confirmed: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  // Determinar el turno actual basado en la hora
  const getCurrentShift = () => {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 14) return "mañana"
    if (hour >= 14 && hour < 22) return "tarde"
    return "noche"
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Label htmlFor="userId">Encargado</Label>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger id="userId">
              <SelectValue placeholder="Seleccionar encargado" />
            </SelectTrigger>
            <SelectContent>
              {mockUsers
                .filter((user) => user.role === "encargado")
                .map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="supervisorId">Supervisor (Requerido)</Label>
          <Select value={supervisorId} onValueChange={setSupervisorId}>
            <SelectTrigger id="supervisorId">
              <SelectValue placeholder="Seleccionar supervisor" />
            </SelectTrigger>
            <SelectContent>
              {mockUsers
                .filter((user) => user.role === "admin" || user.role === "supervisor")
                .map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Label htmlFor="pin">PIN de Encargado</Label>
          <Input
            id="pin"
            type="password"
            maxLength={4}
            value={confirmationPin}
            onChange={(e) => setConfirmationPin(e.target.value)}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground mt-1">Ingresa tu PIN de 4 dígitos para confirmar</p>
        </div>

        <div>
          <Label htmlFor="supervisorPin">PIN de Supervisor</Label>
          <Input
            id="supervisorPin"
            type="password"
            maxLength={4}
            value={supervisorPin}
            onChange={(e) => setSupervisorPin(e.target.value)}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground mt-1">El supervisor debe ingresar su PIN para autorizar</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">Configuración Inicial de Productos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stockItems.map((item, index) => (
            <Card key={item.productId}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor={`quantity-${index}`}>{item.productName}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    min="0"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(index, Number.parseInt(e.target.value) || 0)}
                    placeholder="Cantidad inicial"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
        <p className="text-yellow-800 font-medium">Importante</p>
        <p className="text-yellow-700 text-sm">
          Esta configuración inicial establece el stock base para el local. Debe ser realizada conjuntamente por un
          encargado y un supervisor. Los valores ingresados serán la base para todos los controles posteriores.
        </p>
      </div>

      <Button type="submit" className="w-full">
        Confirmar Configuración Inicial
      </Button>
    </form>
  )
}

