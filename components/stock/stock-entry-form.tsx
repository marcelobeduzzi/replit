"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { mockProducts } from "@/lib/mock-data"

interface StockEntryFormProps {
  onSubmit: (data: any) => void
}

export function StockEntryForm({ onSubmit }: StockEntryFormProps) {
  const { toast } = useToast()
  const [userId, setUserId] = useState("")
  const [providerId, setProviderId] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [entryItems, setEntryItems] = useState(
    mockProducts.map((product) => ({
      productId: product.id,
      productName: product.name,
      quantity: 0,
    })),
  )

  // Actualizar la lista de proveedores para incluir los solicitados
  const providers = [
    { id: "prov-1", name: "Fabian Bebidas" },
    { id: "prov-2", name: "Lucho Tango" },
    { id: "prov-3", name: "Brozziano" },
    // Mantener otros proveedores si es necesario
  ]

  const handleQuantityChange = (index: number, value: number) => {
    const newEntryItems = [...entryItems]
    newEntryItems[index].quantity = value
    setEntryItems(newEntryItems)
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

    // Filtrar solo los items con cantidad > 0
    const itemsWithQuantity = entryItems.filter((item) => item.quantity > 0)

    if (itemsWithQuantity.length === 0) {
      toast({
        title: "Error",
        description: "Debes ingresar al menos un producto recibido",
        variant: "destructive",
      })
      return
    }

    // Enviar datos
    onSubmit({
      userId,
      providerId: providerId || undefined,
      invoiceNumber: invoiceNumber || undefined,
      items: itemsWithQuantity,
      date: new Date().toISOString(),
      shift: getCurrentShift(),
      localId: "local-1", // En un caso real, esto vendría de un contexto o selección
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
          <Label htmlFor="currentUser">Encargado</Label>
          <Input id="currentUser" value="Usuario Actual (Automático)" disabled className="bg-muted" />
          <input type="hidden" name="userId" value="user-current" />
        </div>

        <div>
          <Label htmlFor="providerId">Proveedor</Label>
          <Select value={providerId} onValueChange={setProviderId}>
            <SelectTrigger id="providerId">
              <SelectValue placeholder="Seleccionar proveedor" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">Productos Recibidos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entryItems.map((item, index) => (
            <Card key={item.productId}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor={`quantity-${index}`}>{item.productName}</Label>
                </div>
                <Input
                  id={`quantity-${index}`}
                  type="number"
                  min="0"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(index, Number.parseInt(e.target.value) || 0)}
                  placeholder="Cantidad"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full">
        Registrar Ingreso de Mercadería
      </Button>
    </form>
  )
}



