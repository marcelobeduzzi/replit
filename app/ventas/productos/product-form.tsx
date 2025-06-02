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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2 } from 'lucide-react'
import { salesService } from "@/lib/sales-service"
import type { Product, Category } from "@/lib/sales-service"

// Esquema para variantes
const variantSchema = z.object({
  variantName: z.string().min(1, { message: "El nombre de la variante es requerido" }),
  localPrice: z.coerce.number().min(0, { message: "El precio debe ser mayor o igual a 0" }),
})

const productSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  productType: z.enum(["simple", "withVariants"]),
  parentId: z.string().optional(),
  variantName: z.string().optional(),
  localPrice: z.coerce.number().min(0, { message: "El precio debe ser mayor o igual a 0" }),
  pedidosYaPrice: z.coerce.number().min(0, { message: "El precio debe ser mayor o igual a 0" }).optional(),
  rappiPrice: z.coerce.number().min(0, { message: "El precio debe ser mayor o igual a 0" }).optional(),
  mercadoPagoPrice: z.coerce.number().min(0, { message: "El precio debe ser mayor o igual a 0" }).optional(),
  variants: z.array(variantSchema).optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  product?: Product
  parentProduct?: Product
}

export default function ProductForm({ product, parentProduct }: ProductFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [isVariant, setIsVariant] = useState(!!parentProduct)

  // Cargar categorías
  useEffect(() => {
    async function loadCategories() {
      try {
        const categoriesData = await salesService.getCategories()
        setCategories(categoriesData)
      } catch (error) {
        console.error("Error al cargar categorías:", error)
      }
    }

    loadCategories()
  }, [])

  const defaultValues: Partial<ProductFormValues> = {
    name: product?.name || "",
    description: product?.description || "",
    categoryId: product?.categoryId || "",
    imageUrl: product?.imageUrl || "",
    isActive: product?.isActive ?? true,
    productType: parentProduct ? "simple" : (product?.variants && product.variants.length > 0) ? "withVariants" : "simple",
    parentId: parentProduct?.id || product?.parentId,
    variantName: product?.variantName || "",
    localPrice: 0,
    pedidosYaPrice: undefined,
    rappiPrice: undefined,
    mercadoPagoPrice: undefined,
    variants: [],
  }

  // Si hay un producto, cargar los precios
  if (product?.prices) {
    product.prices.forEach((price) => {
      if (price.channel === "local") {
        defaultValues.localPrice = price.price
      } else if (price.channel === "pedidosya") {
        defaultValues.pedidosYaPrice = price.price
      } else if (price.channel === "rappi") {
        defaultValues.rappiPrice = price.price
      } else if (price.channel === "mercadopago") {
        defaultValues.mercadoPagoPrice = price.price
      }
    })
  }

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues,
  })

  // Configurar el fieldArray para las variantes
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  // Observar cambios en el tipo de producto
  const productType = form.watch("productType")

  async function onSubmit(data: ProductFormValues) {
    try {
      setIsSubmitting(true)

      // Extraer los precios del formulario
      const { localPrice, pedidosYaPrice, rappiPrice, mercadoPagoPrice, productType, variants, ...productData } = data

      // Preparar datos según si es variante o producto principal
      const isVariant = !!parentProduct || !!productData.parentId
      const finalProductData = {
        ...productData,
        isVariant,
      }

      if (product) {
        // Actualizar producto existente
        await salesService.updateProduct(product.id, finalProductData)

        // Actualizar precios
        await salesService.setProductPrice(product.id, "local", localPrice)
        if (pedidosYaPrice !== undefined) {
          await salesService.setProductPrice(product.id, "pedidosya", pedidosYaPrice)
        }
        if (rappiPrice !== undefined) {
          await salesService.setProductPrice(product.id, "rappi", rappiPrice)
        }
        if (mercadoPagoPrice !== undefined) {
          await salesService.setProductPrice(product.id, "mercadopago", mercadoPagoPrice)
        }
      } else if (isVariant) {
        // Crear nueva variante
        const newVariant = await salesService.createProductVariant(
          productData.parentId!,
          finalProductData
        )

        // Establecer precios
        await salesService.setProductPrice(newVariant.id, "local", localPrice)
        if (pedidosYaPrice !== undefined) {
          await salesService.setProductPrice(newVariant.id, "pedidosya", pedidosYaPrice)
        }
        if (rappiPrice !== undefined) {
          await salesService.setProductPrice(newVariant.id, "rappi", rappiPrice)
        }
        if (mercadoPagoPrice !== undefined) {
          await salesService.setProductPrice(newVariant.id, "mercadopago", mercadoPagoPrice)
        }
      } else {
        // Crear nuevo producto principal
        const newProduct = await salesService.createProduct(finalProductData)

        // Establecer precios
        await salesService.setProductPrice(newProduct.id, "local", localPrice)
        if (pedidosYaPrice !== undefined) {
          await salesService.setProductPrice(newProduct.id, "pedidosya", pedidosYaPrice)
        }
        if (rappiPrice !== undefined) {
          await salesService.setProductPrice(newProduct.id, "rappi", rappiPrice)
        }
        if (mercadoPagoPrice !== undefined) {
          await salesService.setProductPrice(newProduct.id, "mercadopago", mercadoPagoPrice)
        }

        // Si es un producto con variantes, crear las variantes
        if (productType === "withVariants" && variants && variants.length > 0) {
          for (const variant of variants) {
            const variantData = {
              name: productData.name,
              description: productData.description,
              categoryId: productData.categoryId,
              imageUrl: productData.imageUrl,
              isActive: productData.isActive,
              variantName: variant.variantName,
            };

            const newVariant = await salesService.createProductVariant(
              newProduct.id,
              variantData
            );

            // Establecer precio para la variante
            await salesService.setProductPrice(newVariant.id, "local", variant.localPrice);
          }
        }
      }

      router.push(parentProduct ? `/ventas/productos/${parentProduct.id}` : "/ventas/productos")
      router.refresh()
    } catch (error) {
      console.error("Error al guardar producto:", error)
      alert("Error al guardar el producto. Por favor, intenta de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {!isVariant && (
          <FormField
            control={form.control}
            name="productType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Tipo de Producto</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="simple" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Producto Simple
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="withVariants" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Producto con Variantes
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormDescription>
                  Selecciona "Producto con Variantes" si este producto tiene diferentes sabores, tamaños, etc.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Producto</FormLabel>
                <FormControl>
                  <Input placeholder="Hamburguesa Clásica" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isVariant && (
            <FormField
              control={form.control}
              name="variantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Variante</FormLabel>
                  <FormControl>
                    <Input placeholder="Sabor Jamón y Queso" {...field} />
                  </FormControl>
                  <FormDescription>
                    Ej: "Jamón y Queso", "Grande", "500ml", etc.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea placeholder="Descripción del producto..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de la Imagen</FormLabel>
              <FormControl>
                <Input placeholder="https://ejemplo.com/imagen.jpg" {...field} />
              </FormControl>
              <FormDescription>URL de la imagen del producto (opcional)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Producto Activo</FormLabel>
                <FormDescription>
                  Los productos inactivos no aparecerán en el sistema de ventas
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Sección de precios para producto principal o variante única */}
        {(productType === "simple" || isVariant) && (
          <Tabs defaultValue="local" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="local">Local</TabsTrigger>
              <TabsTrigger value="pedidosya">PedidosYa</TabsTrigger>
              <TabsTrigger value="rappi">Rappi</TabsTrigger>
              <TabsTrigger value="mercadopago">MercadoPago</TabsTrigger>
            </TabsList>
            <TabsContent value="local">
              <FormField
                control={form.control}
                name="localPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Local</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormDescription>Precio para ventas en el local</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
            <TabsContent value="pedidosya">
              <FormField
                control={form.control}
                name="pedidosYaPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio PedidosYa</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormDescription>Precio para ventas a través de PedidosYa</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
            <TabsContent value="rappi">
              <FormField
                control={form.control}
                name="rappiPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Rappi</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormDescription>Precio para ventas a través de Rappi</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
            <TabsContent value="mercadopago">
              <FormField
                control={form.control}
                name="mercadoPagoPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio MercadoPago</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormDescription>Precio para ventas a través de MercadoPago</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>
        )}

        {/* Sección de variantes para productos con variantes */}
        {productType === "withVariants" && !isVariant && !product && (
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Variantes del Producto</span>
                <Button 
                  type="button" 
                  onClick={() => append({ variantName: "", localPrice: 0 })}
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Variante
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No hay variantes agregadas. Haz clic en "Agregar Variante" para comenzar.
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-4 p-4 border rounded-md">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`variants.${index}.variantName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre de la Variante</FormLabel>
                              <FormControl>
                                <Input placeholder="Ej: Grande, Mediano, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`variants.${index}.localPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Precio</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="0.00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => remove(index)}
                        className="mt-8"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar variante</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(parentProduct ? `/ventas/productos/${parentProduct.id}` : "/ventas/productos")}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : product ? "Actualizar Producto" : "Crear Producto"}
          </Button>
        </div>
      </form>
    </Form>
  )
}