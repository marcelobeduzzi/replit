'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
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
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Plus, Trash, Calculator } from 'lucide-react'
import { salesService } from "@/lib/sales-service"
import { useAuth } from "@/lib/auth-context"

// Esquema de validación para el formulario
const saleFormSchema = z.object({
  channel: z.string({
    required_error: "Debes seleccionar un canal de venta",
  }),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string({
        required_error: "Debes seleccionar un producto",
      }),
      quantity: z.coerce.number().min(1, {
        message: "La cantidad debe ser al menos 1",
      }),
      price: z.coerce.number().min(0, {
        message: "El precio no puede ser negativo",
      }),
    })
  ).min(1, {
    message: "Debes agregar al menos un producto",
  }),
  total: z.coerce.number().min(0),
  paymentMethod: z.string({
    required_error: "Debes seleccionar un método de pago",
  }),
})

export function SaleForm({ products }) {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [productPrices, setProductPrices] = useState({})

  // Inicializar formulario
  const form = useForm({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      channel: "local",
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      notes: "",
      items: [
        {
          productId: "",
          quantity: 1,
          price: 0,
        },
      ],
      total: 0,
      paymentMethod: "cash",
    },
  })

  // Configurar field array para items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  // Cargar precios de productos
  useEffect(() => {
    async function loadProductPrices() {
      try {
        const prices = {}
        
        for (const product of products) {
          // Obtener precios del producto
          const { data } = await salesService.getProductPrices(product.id)
          
          if (data && data.length > 0) {
            prices[product.id] = {}
            
            // Organizar precios por canal
            for (const price of data) {
              prices[product.id][price.channel] = price.price
            }
          }
        }
        
        setProductPrices(prices)
      } catch (error) {
        console.error("Error al cargar precios:", error)
      }
    }
    
    loadProductPrices()
  }, [products])

  // Actualizar precio cuando cambia el producto o el canal
  const handleProductChange = (index, productId) => {
    const channel = form.getValues("channel")
    const selectedProduct = products.find(p => p.id === productId)
    
    if (selectedProduct && productPrices[productId] && productPrices[productId][channel]) {
      form.setValue(`items.${index}.price`, productPrices[productId][channel])
    } else {
      form.setValue(`items.${index}.price`, 0)
    }
    
    updateTotal()
  }

  const handleChannelChange = (channel) => {
    form.setValue("channel", channel)
    
    // Actualizar precios de todos los items
    const items = form.getValues("items")
    
    items.forEach((item, index) => {
      if (item.productId && productPrices[item.productId] && productPrices[item.productId][channel]) {
        form.setValue(`items.${index}.price`, productPrices[item.productId][channel])
      }
    })
    
    updateTotal()
  }

  // Actualizar total
  const updateTotal = () => {
    const items = form.getValues("items")
    const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
    form.setValue("total", total)
  }

  // Observar cambios en cantidad y precio para actualizar total
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name && (name.includes('items') || name === 'channel')) {
        updateTotal()
      }
    })
    
    return () => subscription.unsubscribe()
  }, [form.watch])

  // Enviar formulario
  async function onSubmit(data) {
    setIsSubmitting(true)
    setError(null)
    
    try {
      // 1. Verificar stock disponible
      const stockCheck = await salesService.checkStockForSale(data.items)
      
      if (!stockCheck.hasStock) {
        setError(
          <div>
            <p>No hay suficiente stock para los siguientes productos:</p>
            <ul className="mt-2 list-disc pl-5">
              {stockCheck.insufficientStock.map(item => (
                <li key={item.productId}>
                  <strong>{item.name}</strong>
                  {item.variantName && ` - ${item.variantName}`}
                  <span className="ml-2">
                    (Solicitado: {item.requested}, Disponible: {item.available})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )
        setIsSubmitting(false)
        return
      }
      
      // 2. Procesar la venta (esto descontará automáticamente del inventario)
      const sale = await salesService.registerSale({
        ...data,
        createdBy: user?.name || user?.email || 'Usuario'
      })
      
      // 3. Redirigir a la página de detalles de la venta
      router.push(`/ventas/detalle/${sale.id}`)
    } catch (error) {
      console.error("Error al procesar venta:", error)
      setError("Error al procesar la venta. Por favor, intenta nuevamente.")
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Venta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="channel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canal de Venta</FormLabel>
                    <Select
                      onValueChange={(value) => handleChannelChange(value)}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un canal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="local">Local</SelectItem>
                        <SelectItem value="pedidosya">PedidosYa</SelectItem>
                        <SelectItem value="rappi">Rappi</SelectItem>
                        <SelectItem value="mercadopago">MercadoPago</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Selecciona el canal por el que se realizó la venta.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Cliente (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del cliente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono del Cliente (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Teléfono del cliente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="customerAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección de Entrega (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Dirección de entrega" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Notas adicionales" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Productos</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ productId: "", quantity: 1, price: 0 })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Producto
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-col space-y-4 p-4 border rounded-md">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Producto {index + 1}</h4>
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          remove(index)
                          updateTotal()
                        }}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Producto</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value)
                              handleProductChange(index, value)
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un producto" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                  {product.variantName && ` - ${product.variantName}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cantidad</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e)
                                updateTotal()
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e)
                                updateTotal()
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}

              {fields.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No hay productos agregados. Haz clic en "Agregar Producto" para comenzar.
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex items-center">
                <Calculator className="mr-2 h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-medium">Total:</span>
              </div>
              <div className="text-2xl font-bold">
                ${form.watch("total").toFixed(2)}
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Método de Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pago</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un método de pago" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Efectivo</SelectItem>
                        <SelectItem value="card">Tarjeta</SelectItem>
                        <SelectItem value="transfer">Transferencia</SelectItem>
                        <SelectItem value="mercadopago">MercadoPago</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/ventas')}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Procesando..." : "Registrar Venta"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  )
}