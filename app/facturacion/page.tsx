"use client"

import { useState } from "react"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart } from "@/components/charts"
import { formatCurrency } from "@/lib/export-utils"
import { Plus, Download, Calendar, TrendingUp, DollarSign } from 'lucide-react'
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog"

// Datos de ejemplo para facturación
const facturacionData = [
 {
   id: "1",
   local: "BR Cabildo",
   mes: 1,
   año: 2024,
   ingresos: 1250000,
   cambio: 5.2,
 },
 {
   id: "2",
   local: "BR Carranza",
   mes: 1,
   año: 2024,
   ingresos: 980000,
   cambio: 3.8,
 },
 {
   id: "3",
   local: "BR Pacifico",
   mes: 1,
   año: 2024,
   ingresos: 1100000,
   cambio: -2.1,
 },
 {
   id: "4",
   local: "BR Lavalle",
   mes: 1,
   año: 2024,
   ingresos: 850000,
   cambio: 7.5,
 },
 {
   id: "5",
   local: "BR Rivadavia",
   mes: 1,
   año: 2024,
   ingresos: 920000,
   cambio: 1.2,
 },
]

// Datos para el gráfico
const chartData = {
 labels: ["BR Cabildo", "BR Carranza", "BR Pacifico", "BR Lavalle", "BR Rivadavia"],
 datasets: [
   {
     label: "Ingresos Mensuales",
     data: [1250000, 980000, 1100000, 850000, 920000],
     backgroundColor: "rgba(59, 130, 246, 0.5)",
     borderColor: "rgb(59, 130, 246)",
     borderWidth: 1,
   },
 ],
}

export default function FacturacionPage() {
 const [selectedMonth, setSelectedMonth] = useState<string>("1")
 const [selectedYear, setSelectedYear] = useState<string>("2024")
 const [isDialogOpen, setIsDialogOpen] = useState(false)
 const [newFacturacion, setNewFacturacion] = useState({
   local: "BR Cabildo",
   mes: 1,
   año: 2024,
   ingresos: 0,
 })

 const handleSubmit = () => {
   // Aquí iría la lógica para guardar los datos
   console.log("Guardando datos:", newFacturacion)
   setIsDialogOpen(false)
 }

 // Calcular total de ingresos
 const totalIngresos = facturacionData.reduce((sum, item) => sum + item.ingresos, 0)

 return (
   <DashboardLayout>
     <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
       <div className="flex items-center justify-between">
         <div>
           <h2 className="text-3xl font-bold tracking-tight">Facturación</h2>
           <p className="text-muted-foreground">Gestiona los ingresos mensuales por local</p>
         </div>
         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
           <DialogTrigger asChild>
             <Button>
               <Plus className="mr-2 h-4 w-4" />
               Registrar Ingresos
             </Button>
           </DialogTrigger>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Registrar Ingresos Mensuales</DialogTitle>
               <DialogDescription>Ingresa los datos de facturación del local</DialogDescription>
             </DialogHeader>
             <div className="grid gap-4 py-4">
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="local">Local</Label>
                   <Select
                     value={newFacturacion.local}
                     onValueChange={(value) => setNewFacturacion({ ...newFacturacion, local: value })}
                   >
                     <SelectTrigger id="local">
                       <SelectValue placeholder="Seleccionar local" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="BR Cabildo">BR Cabildo</SelectItem>
                       <SelectItem value="BR Carranza">BR Carranza</SelectItem>
                       <SelectItem value="BR Pacifico">BR Pacifico</SelectItem>
                       <SelectItem value="BR Lavalle">BR Lavalle</SelectItem>
                       <SelectItem value="BR Rivadavia">BR Rivadavia</SelectItem>
                       <SelectItem value="BR Aguero">BR Aguero</SelectItem>
                       <SelectItem value="BR Dorrego">BR Dorrego</SelectItem>
                       <SelectItem value="Dean & Dennys">Dean & Dennys</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="mes">Mes</Label>
                   <Select
                     value={newFacturacion.mes.toString()}
                     onValueChange={(value) => setNewFacturacion({ ...newFacturacion, mes: parseInt(value) })}
                   >
                     <SelectTrigger id="mes">
                       <SelectValue placeholder="Seleccionar mes" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="1">Enero</SelectItem>
                       <SelectItem value="2">Febrero</SelectItem>
                       <SelectItem value="3">Marzo</SelectItem>
                       <SelectItem value="4">Abril</SelectItem>
                       <SelectItem value="5">Mayo</SelectItem>
                       <SelectItem value="6">Junio</SelectItem>
                       <SelectItem value="7">Julio</SelectItem>
                       <SelectItem value="8">Agosto</SelectItem>
                       <SelectItem value="9">Septiembre</SelectItem>
                       <SelectItem value="10">Octubre</SelectItem>
                       <SelectItem value="11">Noviembre</SelectItem>
                       <SelectItem value="12">Diciembre</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="año">Año</Label>
                   <Select
                     value={newFacturacion.año.toString()}
                     onValueChange={(value) => setNewFacturacion({ ...newFacturacion, año: parseInt(value) })}
                   >
                     <SelectTrigger id="año">
                       <SelectValue placeholder="Seleccionar año" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="2023">2023</SelectItem>
                       <SelectItem value="2024">2024</SelectItem>
                       <SelectItem value="2025">2025</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="ingresos">Ingresos Totales</Label>
                   <Input
                     id="ingresos"
                     type="number"
                     value={newFacturacion.ingresos}
                     onChange={(e) => setNewFacturacion({ ...newFacturacion, ingresos: parseInt(e.target.value) || 0 })}
                     placeholder="0"
                   />
                 </div>
               </div>
             </div>
             <DialogFooter>
               <Button onClick={handleSubmit}>Guardar</Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
       </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
             <DollarSign className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{formatCurrency(totalIngresos)}</div>
             <p className="text-xs text-muted-foreground">+8.2% respecto al mes anterior</p>
           </CardContent>
         </Card>
         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Promedio por Local</CardTitle>
             <TrendingUp className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">
               {formatCurrency(totalIngresos / facturacionData.length)}
             </div>
             <p className="text-xs text-muted-foreground">+3.1% respecto al mes anterior</p>
           </CardContent>
         </Card>
         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Período</CardTitle>
             <Calendar className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">
               {selectedMonth === "1"
                 ? "Enero"
                 : selectedMonth === "2"
                 ? "Febrero"
                 : selectedMonth === "3"
                 ? "Marzo"
                 : selectedMonth === "4"
                 ? "Abril"
                 : selectedMonth === "5"
                 ? "Mayo"
                 : selectedMonth === "6"
                 ? "Junio"
                 : selectedMonth === "7"
                 ? "Julio"
                 : selectedMonth === "8"
                 ? "Agosto"
                 : selectedMonth === "9"
                 ? "Septiembre"
                 : selectedMonth === "10"
                 ? "Octubre"
                 : selectedMonth === "11"
                 ? "Noviembre"
                 : "Diciembre"}{" "}
               {selectedYear}
             </div>
             <p className="text-xs text-muted-foreground">Período actual</p>
           </CardContent>
         </Card>
       </div>

       <Card>
         <CardHeader>
           <CardTitle>Ingresos por Local</CardTitle>
           <CardDescription>Comparativa de ingresos mensuales por local</CardDescription>
         </CardHeader>
         <CardContent className="h-80">
           <BarChart data={chartData} />
         </CardContent>
       </Card>

       <Card>
         <CardHeader className="pb-3">
           <CardTitle>Registro de Ingresos</CardTitle>
           <CardDescription>Historial de ingresos mensuales por local</CardDescription>
         </CardHeader>
         <CardContent>
           <div className="flex items-center mb-4 space-x-4">
             <div className="flex items-center space-x-2">
               <Calendar className="h-4 w-4 text-muted-foreground" />
               <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                 <SelectTrigger className="w-32">
                   <SelectValue placeholder="Mes" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="1">Enero</SelectItem>
                   <SelectItem value="2">Febrero</SelectItem>
                   <SelectItem value="3">Marzo</SelectItem>
                   <SelectItem value="4">Abril</SelectItem>
                   <SelectItem value="5">Mayo</SelectItem>
                   <SelectItem value="6">Junio</SelectItem>
                   <SelectItem value="7">Julio</SelectItem>
                   <SelectItem value="8">Agosto</SelectItem>
                   <SelectItem value="9">Septiembre</SelectItem>
                   <SelectItem value="10">Octubre</SelectItem>
                   <SelectItem value="11">Noviembre</SelectItem>
                   <SelectItem value="12">Diciembre</SelectItem>
                 </SelectContent>
               </Select>
               <Select value={selectedYear} onValueChange={setSelectedYear}>
                 <SelectTrigger className="w-32">
                   <SelectValue placeholder="Año" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="2023">2023</SelectItem>
                   <SelectItem value="2024">2024</SelectItem>
                   <SelectItem value="2025">2025</SelectItem>
                 </SelectContent>
               </Select>
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
                   <TableHead>Local</TableHead>
                   <TableHead>Mes</TableHead>
                   <TableHead>Año</TableHead>
                   <TableHead>Ingresos</TableHead>
                   <TableHead>Cambio</TableHead>
                   <TableHead className="text-right">Acciones</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {facturacionData.map((item) => (
                   <TableRow key={item.id}>
                     <TableCell className="font-medium">{item.local}</TableCell>
                     <TableCell>
                       {item.mes === 1
                         ? "Enero"
                         : item.mes === 2
                         ? "Febrero"
                         : item.mes === 3
                         ? "Marzo"
                         : item.mes === 4
                         ? "Abril"
                         : item.mes === 5
                         ? "Mayo"
                         : item.mes === 6
                         ? "Junio"
                         : item.mes === 7
                         ? "Julio"
                         : item.mes === 8
                         ? "Agosto"
                         : item.mes === 9
                         ? "Septiembre"
                         : item.mes === 10
                         ? "Octubre"
                         : item.mes === 11
                         ? "Noviembre"
                         : "Diciembre"}
                     </TableCell>
                     <TableCell>{item.año}</TableCell>
                     <TableCell>{formatCurrency(item.ingresos)}</TableCell>
                     <TableCell>
                       <span
                         className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                           item.cambio > 0
                             ? "bg-green-100 text-green-800"
                             : item.cambio < 0
                             ? "bg-red-100 text-red-800"
                             : "bg-gray-100 text-gray-800"
                         }`}
                       >
                         {item.cambio > 0 ? "+" : ""}
                         {item.cambio}%
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
     </div>
   </DashboardLayout>
 )
}