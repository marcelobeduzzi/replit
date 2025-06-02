"use client"

import { useState } from "react"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Download, Gift, Users, Star, ArrowUpDown } from 'lucide-react'
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Datos de ejemplo para clientes
const clientes = [
 {
   id: "1",
   nombre: "Juan Pérez",
   apellido: "González",
   barrio: "Palermo",
   telefono: "+54 11 1234-5678",
   email: "juan.perez@gmail.com",
   puntos: 250,
   ultimaCompra: "15/03/2024",
 },
 {
   id: "2",
   nombre: "María",
   apellido: "López",
   barrio: "Recoleta",
   telefono: "+54 11 2345-6789",
   email: "maria.lopez@gmail.com",
   puntos: 180,
   ultimaCompra: "20/03/2024",
 },
 {
   id: "3",
   nombre: "Carlos",
   apellido: "Rodríguez",
   barrio: "Belgrano",
   telefono: "+54 11 3456-7890",
   email: "carlos.rodriguez@gmail.com",
   puntos: 320,
   ultimaCompra: "10/03/2024",
 },
 {
   id: "4",
   nombre: "Ana",
   apellido: "Martínez",
   barrio: "Caballito",
   telefono: "+54 11 4567-8901",
   email: "ana.martinez@gmail.com",
   puntos: 150,
   ultimaCompra: "25/03/2024",
 },
 {
   id: "5",
   nombre: "Roberto",
   apellido: "Sánchez",
   barrio: "Almagro",
   telefono: "+54 11 5678-9012",
   email: "roberto.sanchez@gmail.com",
   puntos: 420,
   ultimaCompra: "05/03/2024",
 },
]

// Datos de ejemplo para canjes
const canjes = [
 {
   id: "1",
   cliente: "Juan Pérez",
   premio: "Descuento 10%",
   puntosRequeridos: 100,
   fecha: "18/03/2024",
   local: "BR Cabildo",
 },
 {
   id: "2",
   cliente: "María López",
   premio: "Postre gratis",
   puntosRequeridos: 150,
   fecha: "22/03/2024",
   local: "BR Carranza",
 },
 {
   id: "3",
   cliente: "Carlos Rodríguez",
   premio: "Descuento 20%",
   puntosRequeridos: 200,
   fecha: "12/03/2024",
   local: "BR Pacifico",
 },
 {
   id: "4",
   cliente: "Roberto Sánchez",
   premio: "2x1 en bebidas",
   puntosRequeridos: 120,
   fecha: "08/03/2024",
   local: "BR Lavalle",
 },
]

// Datos de ejemplo para premios disponibles
const premiosDisponibles = [
 {
   id: "1",
   nombre: "Descuento 10%",
   descripcion: "10% de descuento en tu próxima compra",
   puntosRequeridos: 100,
   disponible: true,
 },
 {
   id: "2",
   nombre: "Postre gratis",
   descripcion: "Un postre gratis con tu pedido",
   puntosRequeridos: 150,
   disponible: true,
 },
 {
   id: "3",
   nombre: "Descuento 20%",
   descripcion: "20% de descuento en tu próxima compra",
   puntosRequeridos: 200,
   disponible: true,
 },
 {
   id: "4",
   nombre: "2x1 en bebidas",
   descripcion: "Dos bebidas por el precio de una",
   puntosRequeridos: 120,
   disponible: true,
 },
 {
   id: "5",
   nombre: "Plato principal gratis",
   descripcion: "Un plato principal gratis con la compra de otro",
   puntosRequeridos: 300,
   disponible: true,
 },
]

export default function PuntosPage() {
 const [activeTab, setActiveTab] = useState("clientes")
 const [searchTerm, setSearchTerm] = useState("")
 const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false)
 const [isNewPremioDialogOpen, setIsNewPremioDialogOpen] = useState(false)
 const [isCanjeDialogOpen, setIsCanjeDialogOpen] = useState(false)
 const [selectedCliente, setSelectedCliente] = useState<string>("")
 const [selectedPremio, setSelectedPremio] = useState<string>("")

 // Estado para nuevo cliente
 const [newCliente, setNewCliente] = useState({
   nombre: "",
   apellido: "",
   barrio: "",
   telefono: "",
   email: "",
 })

 // Estado para nuevo premio
 const [newPremio, setNewPremio] = useState({
   nombre: "",
   descripcion: "",
   puntosRequeridos: 100,
 })

 // Filtrar clientes según término de búsqueda
 const filteredClientes = clientes.filter(
   (cliente) =>
     cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
     cliente.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
     cliente.email.toLowerCase().includes(searchTerm.toLowerCase())
 )

 // Manejar creación de nuevo cliente
 const handleCreateCliente = () => {
   console.log("Nuevo cliente:", newCliente)
   setIsNewClientDialogOpen(false)
   setNewCliente({
     nombre: "",
     apellido: "",
     barrio: "",
     telefono: "",
     email: "",
   })
 }

 // Manejar creación de nuevo premio
 const handleCreatePremio = () => {
   console.log("Nuevo premio:", newPremio)
   setIsNewPremioDialogOpen(false)
   setNewPremio({
     nombre: "",
     descripcion: "",
     puntosRequeridos: 100,
   })
 }

 // Manejar canje de puntos
 const handleCanjePuntos = () => {
   console.log("Canje:", { cliente: selectedCliente, premio: selectedPremio })
   setIsCanjeDialogOpen(false)
   setSelectedCliente("")
   setSelectedPremio("")
 }

 return (
   <DashboardLayout>
     <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
       <div className="flex items-center justify-between">
         <div>
           <h2 className="text-3xl font-bold tracking-tight">Sistema de Puntos</h2>
           <p className="text-muted-foreground">Gestiona los puntos de fidelidad de clientes</p>
         </div>
         <div className="flex space-x-2">
           <Dialog open={isCanjeDialogOpen} onOpenChange={setIsCanjeDialogOpen}>
             <DialogTrigger asChild>
               <Button variant="outline">
                 <Gift className="mr-2 h-4 w-4" />
                 Canjear Puntos
               </Button>
             </DialogTrigger>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>Canjear Puntos</DialogTitle>
                 <DialogDescription>Selecciona un cliente y un premio para realizar el canje</DialogDescription>
               </DialogHeader>
               <div className="grid gap-4 py-4">
                 <div className="space-y-2">
                   <Label htmlFor="cliente">Cliente</Label>
                   <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                     <SelectTrigger id="cliente">
                       <SelectValue placeholder="Seleccionar cliente" />
                     </SelectTrigger>
                     <SelectContent>
                       {clientes.map((cliente) => (
                         <SelectItem key={cliente.id} value={cliente.id}>
                           {cliente.nombre} {cliente.apellido} - {cliente.puntos} puntos
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="premio">Premio</Label>
                   <Select value={selectedPremio} onValueChange={setSelectedPremio}>
                     <SelectTrigger id="premio">
                       <SelectValue placeholder="Seleccionar premio" />
                     </SelectTrigger>
                     <SelectContent>
                       {premiosDisponibles.map((premio) => (
                         <SelectItem key={premio.id} value={premio.id}>
                           {premio.nombre} - {premio.puntosRequeridos} puntos
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               </div>
               <DialogFooter>
                 <Button onClick={handleCanjePuntos}>Canjear</Button>
               </DialogFooter>
             </DialogContent>
           </Dialog>

           <Dialog open={isNewClientDialogOpen} onOpenChange={setIsNewClientDialogOpen}>
             <DialogTrigger asChild>
               <Button>
                 <Plus className="mr-2 h-4 w-4" />
                 Nuevo Cliente
               </Button>
             </DialogTrigger>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>Nuevo Cliente</DialogTitle>
                 <DialogDescription>Ingresa los datos del nuevo cliente</DialogDescription>
               </DialogHeader>
               <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="nombre">Nombre</Label>
                     <Input
                       id="nombre"
                       value={newCliente.nombre}
                       onChange={(e) => setNewCliente({ ...newCliente, nombre: e.target.value })}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="apellido">Apellido</Label>
                     <Input
                       id="apellido"
                       value={newCliente.apellido}
                       onChange={(e) => setNewCliente({ ...newCliente, apellido: e.target.value })}
                     />
                   </div>
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="barrio">Barrio</Label>
                   <Input
                     id="barrio"
                     value={newCliente.barrio}
                     onChange={(e) => setNewCliente({ ...newCliente, barrio: e.target.value })}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="telefono">Teléfono</Label>
                   <Input
                     id="telefono"
                     value={newCliente.telefono}
                     onChange={(e) => setNewCliente({ ...newCliente, telefono: e.target.value })}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="email">Email</Label>
                   <Input
                     id="email"
                     type="email"
                     value={newCliente.email}
                     onChange={(e) => setNewCliente({ ...newCliente, email: e.target.value })}
                   />
                 </div>
               </div>
               <DialogFooter>
                 <Button onClick={handleCreateCliente}>Guardar</Button>
               </DialogFooter>
             </DialogContent>
           </Dialog>
         </div>
       </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
             <Users className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{clientes.length}</div>
             <p className="text-xs text-muted-foreground">+12% respecto al mes anterior</p>
           </CardContent>
         </Card>
         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Puntos Acumulados</CardTitle>
             <Star className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{clientes.reduce((sum, cliente) => sum + cliente.puntos, 0)}</div>
             <p className="text-xs text-muted-foreground">+8% respecto al mes anterior</p>
           </CardContent>
         </Card>
         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Canjes Realizados</CardTitle>
             <Gift className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{canjes.length}</div>
             <p className="text-xs text-muted-foreground">+15% respecto al mes anterior</p>
           </CardContent>
         </Card>
         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Promedio de Puntos</CardTitle>
             <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">
               {Math.round(clientes.reduce((sum, cliente) => sum + cliente.puntos, 0) / clientes.length)}
             </div>
             <p className="text-xs text-muted-foreground">-3% respecto al mes anterior</p>
           </CardContent>
         </Card>
       </div>

       <Tabs value={activeTab} onValueChange={setActiveTab}>
         <TabsList className="grid w-full grid-cols-3">
           <TabsTrigger value="clientes">Clientes</TabsTrigger>
           <TabsTrigger value="canjes">Historial de Canjes</TabsTrigger>
           <TabsTrigger value="premios">Premios Disponibles</TabsTrigger>
         </TabsList>

         <TabsContent value="clientes">
           <Card>
             <CardHeader className="pb-3">
               <CardTitle>Clientes Registrados</CardTitle>
               <CardDescription>Gestiona los clientes del programa de puntos</CardDescription>
             </CardHeader>
             <CardContent>
               <div className="flex items-center mb-4">
                 <div className="relative flex-1 max-w-sm">
                   <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                   <Input
                     type="search"
                     placeholder="Buscar cliente..."
                     className="pl-8"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                   />
                 </div>
                 <div className="ml-auto flex items-center gap-2">
                   <Button variant="outline">
                     <Download className="mr-2 h-4 w-4" />
                     Exportar CSV
                   </Button>
                 </div>
               </div>

               <div className="rounded-md border">
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Nombre</TableHead>
                       <TableHead>Barrio</TableHead>
                       <TableHead>Teléfono</TableHead>
                       <TableHead>Email</TableHead>
                       <TableHead>Puntos</TableHead>
                       <TableHead>Última Compra</TableHead>
                       <TableHead className="text-right">Acciones</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {filteredClientes.map((cliente) => (
                       <TableRow key={cliente.id}>
                         <TableCell className="font-medium">
                           {cliente.nombre} {cliente.apellido}
                         </TableCell>
                         <TableCell>{cliente.barrio}</TableCell>
                         <TableCell>{cliente.telefono}</TableCell>
                         <TableCell>{cliente.email}</TableCell>
                         <TableCell>{cliente.puntos}</TableCell>
                         <TableCell>{cliente.ultimaCompra}</TableCell>
                         <TableCell className="text-right">
                           <Button variant="ghost" size="sm">
                             Editar
                           </Button>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>
             </CardContent>
           </Card>
         </TabsContent>

         <TabsContent value="canjes">
           <Card>
             <CardHeader className="pb-3">
               <CardTitle>Historial de Canjes</CardTitle>
               <CardDescription>Registro de canjes de puntos realizados</CardDescription>
             </CardHeader>
             <CardContent>
               <div className="rounded-md border">
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Cliente</TableHead>
                       <TableHead>Premio</TableHead>
                       <TableHead>Puntos Requeridos</TableHead>
                       <TableHead>Fecha</TableHead>
                       <TableHead>Local</TableHead>
                       <TableHead className="text-right">Acciones</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {canjes.map((canje) => (
                       <TableRow key={canje.id}>
                         <TableCell className="font-medium">{canje.cliente}</TableCell>
                         <TableCell>{canje.premio}</TableCell>
                         <TableCell>{canje.puntosRequeridos}</TableCell>
                         <TableCell>{canje.fecha}</TableCell>
                         <TableCell>{canje.local}</TableCell>
                         <TableCell className="text-right">
                           <Button variant="ghost" size="sm">
                             Ver Detalles
                           </Button>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>
             </CardContent>
           </Card>
         </TabsContent>

         <TabsContent value="premios">
           <Card>
             <CardHeader className="pb-3 flex flex-row items-center justify-between">
               <div>
                 <CardTitle>Premios Disponibles</CardTitle>
                 <CardDescription>Gestiona los premios canjeables por puntos</CardDescription>
               </div>
               <Dialog open={isNewPremioDialogOpen} onOpenChange={setIsNewPremioDialogOpen}>
                 <DialogTrigger asChild>
                   <Button size="sm">
                     <Plus className="mr-2 h-4 w-4" />
                     Nuevo Premio
                   </Button>
                 </DialogTrigger>
                 <DialogContent>
                   <DialogHeader>
                     <DialogTitle>Nuevo Premio</DialogTitle>
                     <DialogDescription>Ingresa los datos del nuevo premio</DialogDescription>
                   </DialogHeader>
                   <div className="grid gap-4 py-4">
                     <div className="space-y-2">
                       <Label htmlFor="nombrePremio">Nombre</Label>
                       <Input
                         id="nombrePremio"
                         value={newPremio.nombre}
                         onChange={(e) => setNewPremio({ ...newPremio, nombre: e.target.value })}
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="descripcionPremio">Descripción</Label>
                       <Input
                         id="descripcionPremio"
                         value={newPremio.descripcion}
                         onChange={(e) => setNewPremio({ ...newPremio, descripcion: e.target.value })}
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="puntosPremio">Puntos Requeridos</Label>
                       <Input
                         id="puntosPremio"
                         type="number"
                         value={newPremio.puntosRequeridos}
                         onChange={(e) =>
                           setNewPremio({ ...newPremio, puntosRequeridos: parseInt(e.target.value) || 0 })
                         }
                       />
                     </div>
                   </div>
                   <DialogFooter>
                     <Button onClick={handleCreatePremio}>Guardar</Button>
                   </DialogFooter>
                 </DialogContent>
               </Dialog>
             </CardHeader>
             <CardContent>
               <div className="rounded-md border">
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Nombre</TableHead>
                       <TableHead>Descripción</TableHead>
                       <TableHead>Puntos Requeridos</TableHead>
                       <TableHead>Estado</TableHead>
                       <TableHead className="text-right">Acciones</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {premiosDisponibles.map((premio) => (
                       <TableRow key={premio.id}>
                         <TableCell className="font-medium">{premio.nombre}</TableCell>
                         <TableCell>{premio.descripcion}</TableCell>
                         <TableCell>{premio.puntosRequeridos}</TableCell>
                         <TableCell>
                           <span
                             className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                               premio.disponible
                                 ? "bg-green-100 text-green-800"
                                 : "bg-red-100 text-red-800"
                             }`}
                           >
                             {premio.disponible ? "Disponible" : "No Disponible"}
                           </span>
                         </TableCell>
                         <TableCell className="text-right">
                           <Button variant="ghost" size="sm">
                             Editar
                           </Button>
                         </TableCell>
                       </TableRow>
                     ))}
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