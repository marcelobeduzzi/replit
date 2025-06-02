"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  CalendarClock,
  FileText,
  Plus,
  Trash2,
  Eye,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { suppliersService, invoicesService } from "@/lib/services/suppliers-service"
import type { Supplier, SupplierProduct, SupplierDiscount, InvoiceWithDetails } from "@/lib/types/suppliers"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function ProveedorDetailPage() {
  const params = useParams()
  const supplierId = params.id as string
  const router = useRouter()
  const { toast } = useToast()

  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [products, setProducts] = useState<SupplierProduct[]>([])
  const [discounts, setDiscounts] = useState<SupplierDiscount[]>([])
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false)
  const [newProduct, setNewProduct] = useState<Partial<SupplierProduct>>({
    supplier_id: supplierId,
    product_name: "",
    description: "",
    sku: "",
    purchase_price: 0,
    sale_price: 0,
    active: true,
  })

  const [isAddDiscountDialogOpen, setIsAddDiscountDialogOpen] = useState(false)
  const [newDiscount, setNewDiscount] = useState<Partial<SupplierDiscount>>({
    supplier_id: supplierId,
    product_id: "",
    discount_percentage: 0,
    start_date: "",
    end_date: "",
    notes: "",
  })

  useEffect(() => {
    const fetchSupplierData = async () => {
      try {
        setLoading(true)

        // Obtener datos del proveedor
        const supplierData = await suppliersService.getSupplierById(supplierId)
        setSupplier(supplierData)

        // Obtener productos del proveedor
        const productsData = await suppliersService.getSupplierProducts(supplierId)
        setProducts(productsData)

        // Obtener descuentos del proveedor
        const discountsData = await suppliersService.getSupplierDiscounts(supplierId)
        setDiscounts(discountsData)

        // Obtener facturas del proveedor
        const invoicesData = await invoicesService.getInvoicesBySupplier(supplierId)
        setInvoices(invoicesData)
      } catch (err: any) {
        console.error("Error fetching supplier data:", err)
        setError(err.message || "Error al cargar los datos del proveedor")
      } finally {
        setLoading(false)
      }
    }

    fetchSupplierData()
  }, [supplierId])

  const handleAddProduct = async () => {
    try {
      if (!newProduct.product_name || !newProduct.purchase_price) {
        toast({
          title: "Error",
          description: "El nombre del producto y el precio de compra son obligatorios",
          variant: "destructive",
        })
        return
      }

      const createdProduct = await suppliersService.createSupplierProduct(
        newProduct as Omit<SupplierProduct, "id" | "created_at" | "updated_at">,
      )
      setProducts([...products, createdProduct])
      setIsAddProductDialogOpen(false)
      setNewProduct({
        supplier_id: supplierId,
        product_name: "",
        description: "",
        sku: "",
        purchase_price: 0,
        sale_price: 0,
        active: true,
      })

      toast({
        title: "Producto agregado",
        description: "El producto ha sido agregado exitosamente",
      })
    } catch (err: any) {
      console.error("Error creating product:", err)
      toast({
        title: "Error",
        description: err.message || "Error al agregar el producto",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      await suppliersService.deleteSupplierProduct(id)
      setProducts(products.filter((product) => product.id !== id))

      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado exitosamente",
      })
    } catch (err: any) {
      console.error("Error deleting product:", err)
      toast({
        title: "Error",
        description: err.message || "Error al eliminar el producto",
        variant: "destructive",
      })
    }
  }

  const handleAddDiscount = async () => {
    try {
      if (!newDiscount.discount_percentage) {
        toast({
          title: "Error",
          description: "El porcentaje de descuento es obligatorio",
          variant: "destructive",
        })
        return
      }

      const createdDiscount = await suppliersService.createSupplierDiscount(
        newDiscount as Omit<SupplierDiscount, "id" | "created_at" | "updated_at">,
      )
      setDiscounts([...discounts, createdDiscount])
      setIsAddDiscountDialogOpen(false)
      setNewDiscount({
        supplier_id: supplierId,
        product_id: "",
        discount_percentage: 0,
        start_date: "",
        end_date: "",
        notes: "",
      })

      toast({
        title: "Descuento agregado",
        description: "El descuento ha sido agregado exitosamente",
      })
    } catch (err: any) {
      console.error("Error creating discount:", err)
      toast({
        title: "Error",
        description: err.message || "Error al agregar el descuento",
        variant: "destructive",
      })
    }
  }

  const handleDeleteDiscount = async (id: string) => {
    try {
      await suppliersService.deleteSupplierDiscount(id)
      setDiscounts(discounts.filter((discount) => discount.id !== id))

      toast({
        title: "Descuento eliminado",
        description: "El descuento ha sido eliminado exitosamente",
      })
    } catch (err: any) {
      console.error("Error deleting discount:", err)
      toast({
        title: "Error",
        description: err.message || "Error al eliminar el descuento",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    )
  }

  if (!supplier) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center">
            <Button asChild variant="outline" className="mr-4">
              <Link href="/proveedores-pagos/proveedores">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
            <h2 className="text-3xl font-bold tracking-tight">Proveedor no encontrado</h2>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p>El proveedor solicitado no existe o ha sido eliminado.</p>
              <Button asChild className="mt-4">
                <Link href="/proveedores-pagos/proveedores">Ver todos los proveedores</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button asChild variant="outline" className="mr-4">
              <Link href="/proveedores-pagos/proveedores">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{supplier.name}</h2>
              <p className="text-muted-foreground">Detalles del proveedor y sus productos</p>
            </div>
          </div>
          <Button asChild>
            <Link href={`/proveedores-pagos/proveedores/${supplierId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Proveedor
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {supplier.contact_name && (
                  <div className="flex items-start">
                    <div className="mr-2 mt-0.5">👤</div>
                    <div>
                      <p className="font-medium">Persona de Contacto</p>
                      <p className="text-sm text-muted-foreground">{supplier.contact_name}</p>
                    </div>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-start">
                    <Phone className="mr-2 h-4 w-4 mt-1" />
                    <div>
                      <p className="font-medium">Teléfono</p>
                      <p className="text-sm text-muted-foreground">{supplier.phone}</p>
                    </div>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-start">
                    <Mail className="mr-2 h-4 w-4 mt-1" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{supplier.email}</p>
                    </div>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-start">
                    <MapPin className="mr-2 h-4 w-4 mt-1" />
                    <div>
                      <p className="font-medium">Dirección</p>
                      <p className="text-sm text-muted-foreground">{supplier.address}</p>
                    </div>
                  </div>
                )}
                {supplier.tax_id && (
                  <div className="flex items-start">
                    <FileText className="mr-2 h-4 w-4 mt-1" />
                    <div>
                      <p className="font-medium">ID Fiscal / CUIT</p>
                      <p className="text-sm text-muted-foreground">{supplier.tax_id}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Acuerdo Comercial</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-start">
                    <CreditCard className="mr-2 h-4 w-4 mt-1" />
                    <div>
                      <p className="font-medium">Método de Pago</p>
                      <p className="text-sm text-muted-foreground">{supplier.payment_method || "No especificado"}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <CalendarClock className="mr-2 h-4 w-4 mt-1" />
                    <div>
                      <p className="font-medium">Términos de Pago</p>
                      <p className="text-sm text-muted-foreground">{supplier.payment_terms || "No especificado"}</p>
                    </div>
                  </div>
                </div>
                {supplier.notes && (
                  <div className="col-span-2">
                    <p className="font-medium">Notas</p>
                    <p className="text-sm text-muted-foreground">{supplier.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="discounts">Descuentos</TabsTrigger>
            <TabsTrigger value="invoices">Facturas</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Productos</CardTitle>
                  <CardDescription>Productos suministrados por este proveedor</CardDescription>
                </div>
                <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Producto
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Agregar Nuevo Producto</DialogTitle>
                      <DialogDescription>
                        Ingresa los datos del producto que suministra este proveedor.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label htmlFor="product_name">Nombre del Producto *</Label>
                        <Input
                          id="product_name"
                          value={newProduct.product_name}
                          onChange={(e) => setNewProduct({ ...newProduct, product_name: e.target.value })}
                          placeholder="Nombre del producto"
                        />
                      </div>
                      <div>
                        <Label htmlFor="sku">SKU / Código</Label>
                        <Input
                          id="sku"
                          value={newProduct.sku}
                          onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                          placeholder="Código o SKU del producto"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Descripción</Label>
                        <Input
                          id="description"
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                          placeholder="Descripción del producto"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="purchase_price">Precio de Compra *</Label>
                          <Input
                            id="purchase_price"
                            type="number"
                            value={newProduct.purchase_price}
                            onChange={(e) => setNewProduct({ ...newProduct, purchase_price: Number(e.target.value) })}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="sale_price">Precio de Venta</Label>
                          <Input
                            id="sale_price"
                            type="number"
                            value={newProduct.sale_price}
                            onChange={(e) => setNewProduct({ ...newProduct, sale_price: Number(e.target.value) })}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddProductDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddProduct}>Guardar Producto</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Precio Compra</TableHead>
                        <TableHead className="text-right">Precio Venta</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">
                            No hay productos registrados para este proveedor
                          </TableCell>
                        </TableRow>
                      ) : (
                        products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{product.product_name}</p>
                                {product.description && (
                                  <p className="text-sm text-muted-foreground">{product.description}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{product.sku || "—"}</TableCell>
                            <TableCell className="text-right">${product.purchase_price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">${product.sale_price?.toFixed(2) || "—"}</TableCell>
                            <TableCell className="text-center">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  product.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                }`}
                              >
                                {product.active ? "Activo" : "Inactivo"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta acción no se puede deshacer. ¿Realmente quieres eliminar este producto?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>
                                        Eliminar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discounts" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Descuentos</CardTitle>
                  <CardDescription>Descuentos acordados con este proveedor</CardDescription>
                </div>
                <Dialog open={isAddDiscountDialogOpen} onOpenChange={setIsAddDiscountDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Descuento
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Agregar Nuevo Descuento</DialogTitle>
                      <DialogDescription>
                        Ingresa los datos del descuento acordado con este proveedor.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label htmlFor="product_id">Producto (opcional)</Label>
                        <select
                          id="product_id"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={newDiscount.product_id || ""}
                          onChange={(e) => setNewDiscount({ ...newDiscount, product_id: e.target.value || undefined })}
                        >
                          <option value="">Todos los productos</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.product_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="discount_percentage">Porcentaje de Descuento *</Label>
                        <Input
                          id="discount_percentage"
                          type="number"
                          value={newDiscount.discount_percentage}
                          onChange={(e) =>
                            setNewDiscount({ ...newDiscount, discount_percentage: Number(e.target.value) })
                          }
                          placeholder="0.00"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start_date">Fecha de Inicio</Label>
                          <Input
                            id="start_date"
                            type="date"
                            value={newDiscount.start_date}
                            onChange={(e) => setNewDiscount({ ...newDiscount, start_date: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="end_date">Fecha de Fin</Label>
                          <Input
                            id="end_date"
                            type="date"
                            value={newDiscount.end_date}
                            onChange={(e) => setNewDiscount({ ...newDiscount, end_date: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="notes">Notas</Label>
                        <Input
                          id="notes"
                          value={newDiscount.notes}
                          onChange={(e) => setNewDiscount({ ...newDiscount, notes: e.target.value })}
                          placeholder="Detalles adicionales sobre el descuento"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDiscountDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddDiscount}>Guardar Descuento</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Descuento</TableHead>
                        <TableHead>Fecha Inicio</TableHead>
                        <TableHead>Fecha Fin</TableHead>
                        <TableHead>Notas</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {discounts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">
                            No hay descuentos registrados para este proveedor
                          </TableCell>
                        </TableRow>
                      ) : (
                        discounts.map((discount) => {
                          const product = products.find((p) => p.id === discount.product_id)

                          return (
                            <TableRow key={discount.id}>
                              <TableCell>{product ? product.product_name : "Todos los productos"}</TableCell>
                              <TableCell className="text-right">{discount.discount_percentage}%</TableCell>
                              <TableCell>
                                {discount.start_date ? new Date(discount.start_date).toLocaleDateString() : "—"}
                              </TableCell>
                              <TableCell>
                                {discount.end_date ? new Date(discount.end_date).toLocaleDateString() : "—"}
                              </TableCell>
                              <TableCell>{discount.notes || "—"}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta acción no se puede deshacer. ¿Realmente quieres eliminar este descuento?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteDiscount(discount.id)}>
                                          Eliminar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Facturas</CardTitle>
                  <CardDescription>Facturas registradas de este proveedor</CardDescription>
                </div>
                <Button asChild>
                  <Link href={`/proveedores-pagos/pagos/nueva?supplier=${supplierId}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Factura
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nº Factura</TableHead>
                        <TableHead>Fecha Emisión</TableHead>
                        <TableHead>Fecha Vencimiento</TableHead>
                        <TableHead className="text-right">Monto Total</TableHead>
                        <TableHead>Local</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center">
                            No hay facturas registradas para este proveedor
                          </TableCell>
                        </TableRow>
                      ) : (
                        invoices.map((invoice) => {
                          // Determinar el estado de la factura
                          let status = "Pendiente"
                          let statusClass = "bg-yellow-100 text-yellow-800"

                          if (invoice.payments && invoice.payments.length > 0) {
                            const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.payment_amount, 0)
                            if (totalPaid >= invoice.total_amount) {
                              status = "Pagada"
                              statusClass = "bg-green-100 text-green-800"
                            } else if (totalPaid > 0) {
                              status = "Parcial"
                              statusClass = "bg-blue-100 text-blue-800"
                            }
                          }

                          return (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                              <TableCell>{new Date(invoice.issue_date).toLocaleDateString()}</TableCell>
                              <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                              <TableCell className="text-right">${invoice.total_amount.toFixed(2)}</TableCell>
                              <TableCell>{invoice.local || "—"}</TableCell>
                              <TableCell className="text-center">
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
                                >
                                  {status}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button asChild variant="ghost" size="icon">
                                    <Link href={`/proveedores-pagos/pagos/${invoice.id}`}>
                                      <Eye className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
