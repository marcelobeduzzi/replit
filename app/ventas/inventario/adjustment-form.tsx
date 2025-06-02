'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { salesService, type InventoryItem } from "@/lib/sales-service"
import { useAuth } from "@/lib/auth-context"

const adjustmentSchema = z.object({
  productId: z.string({
    required_error: "Debes seleccionar un producto",
  }),
  type: z.enum(['in', 'out'], {
    required_error: "Debes seleccionar un tipo de ajuste",
  }),
  quantity: z.coerce.number().min(1, {
    message: "La cantidad debe ser mayor o igual a 1",
  }),
  reason: z.string().min(3, {
    message: "El motivo debe tener al menos 3 caracteres",
  }),
  minQuantity: z.coerce.number().min(0, {
    message: "La cantidad mínima debe ser mayor o igual a 0",
  }).optional(),
})

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>

interface AdjustmentFormProps {
  inventory: InventoryItem[]
  selectedProductId?: string
}

export function AdjustmentForm({ inventory, selectedProductId }: AdjustmentFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [currentStock, setCurrentStock] = useState<number | null>(null)

  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      productId: selectedProductId || "",
      type: 'in',
      quantity: 1,
      reason: "",
      minQuantity: undefined,
    },
  })

  // Cuando cambia el producto seleccionado, actualizar el stock actual
  const watchProductId = form.watch("productId")
  
  useEffect(() => {
    if (watchProductId) {
      const selectedItem = inventory.find(item => item.productId === watchProductId)
      if (selectedItem) {
        setCurrentStock(selectedItem.quantity)
        form.setValue("minQuantity", selectedItem.minQuantity)
      } else {
        setCurrentStock(null)
      }
    } else {
      setCurrentStock(null)
    }
  }, [watchProductId, inventory, form])

  async function onSubmit(data: AdjustmentFormValues) {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // Verificar si hay suficiente stock para una salida
      if (data.type === 'out' && currentStock !== null && data.quantity > currentStock) {
        setError(`No hay suficiente stock. Stock actual: ${currentStock}`)
        setIsSubmitting(false)
        return
      }

      // Obtener el nombre del producto para el mensaje de éxito
      const selectedItem = inventory.find(item => item.productId === data.productId)
      
      // Registrar el movimiento de inventario
      await salesService.registerInventoryMovement(
        data.productId,
        data.quantity,
        data.type,
        data.reason,
        user?.name || user?.email || 'Usuario'
      )

      // Actualizar la cantidad mínima si se proporcionó
      if (data.minQuantity !== undefined && selectedItem && data.minQuantity !== selectedItem.minQuantity) {
        await salesService.setProductInventory(
          data.productId,
          data.type === 'in' ? selectedItem.quantity + data.quantity : selectedItem.quantity - data.quantity,
          data.minQuantity
        )
      }

      // Mostrar mensaje de éxito
      setSuccess(`Ajuste de inventario registrado correctamente para ${selectedItem?.product?.name || 'el producto seleccionado'}.`)
      
      // Resetear el formulario
      form.reset({
        productId: "",
        type: 'in',
        quantity: 1,
        reason: "",
        minQuantity: undefined,
      })
      
      // Refrescar la página para actualizar la lista de productos
      router.refresh()
    } catch (error) {
      console.error("Error al registrar ajuste de inventario:", error)
      setError("Error al registrar el ajuste de inventario. Por favor, intenta nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="bg-green-50 text-green-800 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="productId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Producto</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un producto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {inventory.length === 0 ? (
                      <SelectItem value="no-products" disabled>
                        No hay productos con inventario
                      </SelectItem>
                    ) : (
                      inventory.map((item) => (
                        <SelectItem key={item.productId} value={item.productId}>
                          {item.product?.name || 'Producto desconocido'} (Stock: {item.quantity})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Selecciona el producto para el que deseas realizar el ajuste.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {currentStock !== null && (
            <div className="bg-muted p-4 rounded-md">
              <p className="font-medium">Stock actual: {currentStock}</p>
            </div>
          )}

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Tipo de Ajuste</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="in" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Entrada (Aumentar stock)
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="out" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Salida (Disminuir stock)
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormDescription>
                    Cantidad a {form.getValues("type") === 'in' ? 'agregar' : 'retirar'} del inventario.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad Mínima (Opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      value={field.value === undefined ? '' : field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  </FormControl>
                  <FormDescription>
                    Actualizar la cantidad mínima para generar alertas de stock bajo.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Ingresa el motivo del ajuste de inventario" 
                    className="resize-none" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Describe el motivo por el cual estás realizando este ajuste.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/ventas/inventario')}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || inventory.length === 0}>
              {isSubmitting ? "Registrando..." : "Registrar Ajuste"}
            </Button>
          </div>
        </form>
      </Form>

      {inventory.length === 0 && (
        <Alert className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Información</AlertTitle>
          <AlertDescription>
            No hay productos con inventario registrado. Primero debes registrar el stock inicial de al menos un producto.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}