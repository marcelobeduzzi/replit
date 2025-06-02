'use client'

import { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { salesService, type Product } from "@/lib/sales-service"

const initialStockSchema = z.object({
  productId: z.string({
    required_error: "Debes seleccionar un producto",
  }),
  quantity: z.coerce.number().min(0, {
    message: "La cantidad debe ser mayor o igual a 0",
  }),
  minQuantity: z.coerce.number().min(0, {
    message: "La cantidad mínima debe ser mayor o igual a 0",
  }),
})

type InitialStockFormValues = z.infer<typeof initialStockSchema>

interface InitialStockFormProps {
  products: Product[]
}

export function InitialStockForm({ products }: InitialStockFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const form = useForm<InitialStockFormValues>({
    resolver: zodResolver(initialStockSchema),
    defaultValues: {
      productId: "",
      quantity: 0,
      minQuantity: 0,
    },
  })

  async function onSubmit(data: InitialStockFormValues) {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // Obtener el nombre del producto para el mensaje de éxito
      const product = products.find(p => p.id === data.productId)
      
      // Registrar el stock inicial
      await salesService.setProductInventory(
        data.productId,
        data.quantity,
        data.minQuantity
      )

      // Registrar el movimiento de inventario si la cantidad es mayor que 0
      if (data.quantity > 0) {
        await salesService.registerInventoryMovement(
          data.productId,
          data.quantity,
          'in',
          'Stock inicial',
          'Sistema'
        )
      }

      // Mostrar mensaje de éxito
      setSuccess(`Stock inicial registrado correctamente para ${product?.name || 'el producto seleccionado'}.`)
      
      // Resetear el formulario
      form.reset({
        productId: "",
        quantity: 0,
        minQuantity: 0,
      })
      
      // Refrescar la página para actualizar la lista de productos
      router.refresh()
    } catch (error) {
      console.error("Error al registrar stock inicial:", error)
      setError("Error al registrar el stock inicial. Por favor, intenta nuevamente.")
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
                    {products.length === 0 ? (
                      <SelectItem value="no-products" disabled>
                        No hay productos sin inventario
                      </SelectItem>
                    ) : (
                      products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Selecciona el producto para el que deseas registrar el stock inicial.
                </FormDescription>
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
                  <FormLabel>Cantidad Actual</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormDescription>
                    Cantidad actual en stock.
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
                  <FormLabel>Cantidad Mínima</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormDescription>
                    Cantidad mínima para generar alertas de stock bajo.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/ventas/inventario')}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || products.length === 0}>
              {isSubmitting ? "Registrando..." : "Registrar Stock Inicial"}
            </Button>
          </div>
        </form>
      </Form>

      {products.length === 0 && (
        <Alert className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Información</AlertTitle>
          <AlertDescription>
            No hay productos sin inventario registrado. Todos los productos ya tienen un registro de inventario.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}