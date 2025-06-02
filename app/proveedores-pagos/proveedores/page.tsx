"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Download, Edit, Trash2, Eye, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { suppliersService } from "@/lib/services/suppliers-service"
import type { Supplier } from "@/lib/types/suppliers"
import { LoadingSpinner } from "@/components/loading-spinner"
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
import { Textarea } from "@/components/ui/textarea"
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
import { useToast } from "@/components/ui/use-toast"

export default function ProveedoresPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    name: "",
    contact_name: "",
    phone: "",
    email: "",
    address: "",
    tax_id: "",
    payment_method: "",
    payment_terms: "",
    notes: "",
    active: true,
  })

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true)
        const data = await suppliersService.getSuppliers()
        setSuppliers(data)
        setFilteredSuppliers(data)
      } catch (err: any) {
        console.error("Error fetching suppliers:", err)
        setError(err.message || "Error al cargar los proveedores")
      } finally {
        setLoading(false)
      }
    }

    fetchSuppliers()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = suppliers.filter(
        (supplier) =>
          supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (supplier.contact_name && supplier.contact_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredSuppliers(filtered)
    } else {
      setFilteredSuppliers(suppliers)
    }
  }, [searchTerm, suppliers])

  const handleAddSupplier = async () => {
    try {
      if (!newSupplier.name) {
        toast({
          title: "Error",
          description: "El nombre del proveedor es obligatorio",
          variant: "destructive",
        })
        return
      }

      const createdSupplier = await suppliersService.createSupplier(
        newSupplier as Omit<Supplier, "id" | "created_at" | "updated_at">,
      )
      setSuppliers([...suppliers, createdSupplier])
      setIsAddDialogOpen(false)
      setNewSupplier({
        name: "",
        contact_name: "",
        phone: "",
        email: "",
        address: "",
        tax_id: "",
        payment_method: "",
        payment_terms: "",
        notes: "",
        active: true,
      })

      toast({
        title: "Proveedor creado",
        description: "El proveedor ha sido creado exitosamente",
      })
    } catch (err: any) {
      console.error("Error creating supplier:", err)
      toast({
        title: "Error",
        description: err.message || "Error al crear el proveedor",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSupplier = async (id: string) => {
    try {
      await suppliersService.deleteSupplier(id)
      setSuppliers(suppliers.filter((supplier) => supplier.id !== id))

      toast({
        title: "Proveedor eliminado",
        description: "El proveedor ha sido eliminado exitosamente",
      })
    } catch (err: any) {
      console.error("Error deleting supplier:", err)
      toast({
        title: "Error",
        description: err.message || "Error al eliminar el proveedor",
        variant: "destructive",
      })
    }
  }

  const exportToCSV = () => {
    const headers = [
      "Nombre",
      "Contacto",
      "Teléfono",
      "Email",
      "Dirección",
      "ID Fiscal",
      "Método de Pago",
      "Términos de Pago",
      "Notas",
      "Activo",
    ]

    const rows = filteredSuppliers.map((supplier) => [
      supplier.name,
      supplier.contact_name || "",
      supplier.phone || "",
      supplier.email || "",
      supplier.address || "",
      supplier.tax_id || "",
      supplier.payment_method || "",
      supplier.payment_terms || "",
      supplier.notes || "",
      supplier.active ? "Sí" : "No",
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `proveedores_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button asChild variant="outline" className="mr-4">
              <Link href="/proveedores-pagos">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Gestión de Proveedores</h2>
              <p className="text-muted-foreground">Administra la información de tus proveedores</p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Proveedor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Proveedor</DialogTitle>
                <DialogDescription>
                  Ingresa los datos del nuevo proveedor. Los campos marcados con * son obligatorios.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name" className="mb-2">
                      Nombre *
                    </Label>
                    <Input
                      id="name"
                      value={newSupplier.name}
                      onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                      placeholder="Nombre del proveedor"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_name" className="mb-2">
                      Persona de Contacto
                    </Label>
                    <Input
                      id="contact_name"
                      value={newSupplier.contact_name}
                      onChange={(e) => setNewSupplier({ ...newSupplier, contact_name: e.target.value })}
                      placeholder="Nombre del contacto"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax_id" className="mb-2">
                      ID Fiscal / CUIT
                    </Label>
                    <Input
                      id="tax_id"
                      value={newSupplier.tax_id}
                      onChange={(e) => setNewSupplier({ ...newSupplier, tax_id: e.target.value })}
                      placeholder="ID Fiscal o CUIT"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="mb-2">
                      Teléfono
                    </Label>
                    <Input
                      id="phone"
                      value={newSupplier.phone}
                      onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                      placeholder="Teléfono de contacto"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="mb-2">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={newSupplier.email}
                      onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                      placeholder="Email de contacto"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="address" className="mb-2">
                      Dirección
                    </Label>
                    <Input
                      id="address"
                      value={newSupplier.address}
                      onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                      placeholder="Dirección completa"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_method" className="mb-2">
                      Método de Pago
                    </Label>
                    <Input
                      id="payment_method"
                      value={newSupplier.payment_method}
                      onChange={(e) => setNewSupplier({ ...newSupplier, payment_method: e.target.value })}
                      placeholder="Ej: Transferencia, Efectivo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_terms" className="mb-2">
                      Términos de Pago
                    </Label>
                    <Input
                      id="payment_terms"
                      value={newSupplier.payment_terms}
                      onChange={(e) => setNewSupplier({ ...newSupplier, payment_terms: e.target.value })}
                      placeholder="Ej: 30 días, Contado"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="notes" className="mb-2">
                      Notas
                    </Label>
                    <Textarea
                      id="notes"
                      value={newSupplier.notes}
                      onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })}
                      placeholder="Información adicional sobre el proveedor"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddSupplier}>Guardar Proveedor</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Lista de Proveedores</CardTitle>
            <CardDescription>Gestiona la información de tus proveedores y sus acuerdos comerciales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar proveedor..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Método de Pago</TableHead>
                    <TableHead className="hidden md:table-cell">Términos</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        No hay proveedores registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>{supplier.contact_name || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell">{supplier.phone || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell">{supplier.email || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell">{supplier.payment_method || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell">{supplier.payment_terms || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button asChild variant="ghost" size="icon">
                              <Link href={`/proveedores-pagos/proveedores/${supplier.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button asChild variant="ghost" size="icon">
                              <Link href={`/proveedores-pagos/proveedores/${supplier.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
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
                                    Esta acción no se puede deshacer. ¿Realmente quieres eliminar este proveedor?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteSupplier(supplier.id)}>
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
      </div>
    </DashboardLayout>
  )
}
