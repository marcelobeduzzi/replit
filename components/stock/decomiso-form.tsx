"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { mockProducts, mockUsers } from "@/lib/mock-data"
import { AlertTriangle } from "lucide-react"

interface DecomisoFormProps {
  salesData: any
  onSubmit: (data: any) => void
}

export function DecomisoForm({ salesData, onSubmit }: DecomisoFormProps) {
  const { toast } = useToast()
  const [userId, setUserId] = useState("")
  const [photosSent, setPhotosSent] = useState(false)
  const [notes, setNotes] = useState("")
  const [decomisoItems, setDecomisoItems] = useState(
    mockProducts.map((product) => ({
      productId: product.id,
      productName: product.name,
      quantity: 0,
      reason: "",
    })),
  )

  // Calcular el total de ventas por producto (para el límite del 1%)
  const calculateSalesTotal = (productId) => {
    if (!salesData || !salesData.items) return 0

    const productSales = salesData.items.find((item) => item.productId === productId)
    return productSales ? productSales.quantity : 0
  }

  const handleQuantityChange = (index: number, value: number) => {
    const newDecomisoItems = [...decomisoItems]
    newDecomisoItems[index].quantity = value
    setDecomisoItems(newDecomisoItems)
  }

  const handleReasonChange = (index: number, value: string) => {
    const newDecomisoItems = [...decomisoItems]
    newDecomisoItems[index].reason = value
    setDecomisoItems(newDecomisoItems)
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

    if (!photosSent) {
      toast({
        title: "Error",
        description: "Debes confirmar que has enviado las fotos de los decomisos",
        variant: "destructive",
      })
      return
    }

    // Filtrar solo los items con cantidad > 0
    const itemsWithQuantity = decomisoItems.filter((item) => item.quantity > 0)

    if (itemsWithQuantity.length === 0) {
      toast({
        title: "Error",
        description: "Debes ingresar al menos un producto decomisado",
        variant: "destructive",
      })
      return
    }

    // Verificar si hay decomisos que superen el 1% de las ventas
    const excessiveDecomisos = itemsWithQuantity.filter((item) => {
      const salesTotal = calculateSalesTotal(item.productId)
      return salesTotal > 0 && item.quantity / salesTotal > 0.01
    })

    if (excessiveDecomisos.length > 0) {
      // Mostrar alerta pero permitir continuar
      toast({
        title: "Atención",
        description: `Se detectaron ${excessiveDecomisos.length} productos con decomisos superiores al 1% de las ventas`,
        variant: "destructive",
      })
    }

    // Enviar datos
    onSubmit({
      userId,
      photosSent,
      notes,
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
      <div className="mb-6">
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

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">Productos Decomisados</h3>
        <div className="grid grid-cols-1 gap-4">
          {decomisoItems.map((item, index) => {
            const salesTotal = calculateSalesTotal(item.productId)
            const percentage = salesTotal > 0 ? (item.quantity / salesTotal) * 100 : 0
            const isExcessive = percentage > 1

            return (
              <Card key={item.productId} className={isExcessive && item.quantity > 0 ? "border-red-500" : ""}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor={`quantity-${index}`}>{item.productName}</Label>
                    {salesTotal > 0 && item.quantity > 0 && (
                      <span className={`text-sm font-medium ${isExcessive ? "text-red-500" : "text-muted-foreground"}`}>
                        {percentage.toFixed(2)}% de las ventas
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                    <div>
                      <Input
                        id={`quantity-${index}`}
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, Number.parseInt(e.target.value) || 0)}
                        placeholder="Cantidad"
                      />
                    </div>
                    <div>
                      <Input
                        id={`reason-${index}`}
                        value={item.reason}
                        onChange={(e) => handleReasonChange(index, e.target.value)}
                        placeholder="Motivo del decomiso"
                        disabled={item.quantity === 0}
                      />
                    </div>
                  </div>
                  {isExcessive && item.quantity > 0 && (
                    <div className="flex items-center text-red-500 text-sm mt-1">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Supera el límite recomendado del 1%
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <div className="mb-6">
        <Label htmlFor="notes">Observaciones</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ingresa cualquier observación relevante sobre los decomisos"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2 mb-6">
        <Checkbox
          id="photosSent"
          checked={photosSent}
          onCheckedChange={(checked) => setPhotosSent(checked as boolean)}
        />
        <Label htmlFor="photosSent" className="font-medium">
          Confirmo que he enviado las fotos de los decomisos al grupo correspondiente
        </Label>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
        <p className="text-yellow-800 font-medium">Importante</p>
        <p className="text-yellow-700 text-sm">
          Omitir información en esta sección o no enviar las fotos de los decomisos es causal de despido inmediato
          justificado.
        </p>
      </div>

      <Button type="submit" className="w-full">
        Registrar Decomisos
      </Button>
    </form>
  )
}

