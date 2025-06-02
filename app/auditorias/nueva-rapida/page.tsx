"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { db } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Save } from 'lucide-react'

// Lista de locales
const locales = [
  { id: "cabildo", name: "BR Cabildo" },
  { id: "carranza", name: "BR Carranza" },
  { id: "pacifico", name: "BR Pacífico" },
  { id: "lavalle", name: "BR Lavalle" },
  { id: "rivadavia", name: "BR Rivadavia" },
  { id: "aguero", name: "BR Aguero" },
  { id: "dorrego", name: "BR Dorrego" },
  { id: "dean_dennys", name: "Dean & Dennys" },
]

// Lista de turnos
const turnos = [
  { id: "morning", name: "Mañana" },
  { id: "afternoon", name: "Tarde" },
  { id: "night", name: "Noche" },
]

// Opciones de puntuación
const puntajeOptions = [
  { value: 5, label: "Excelente (5)" },
  { value: 4, label: "Bueno (4)" },
  { value: 3, label: "Regular (3)" },
  { value: 2, label: "Deficiente (2)" },
  { value: 1, label: "Crítico (1)" },
  { value: 0, label: "No Aplica (0)" },
]

// Categorías para auditoría rápida
const categoriasRapidas = [
  {
    id: "limpieza",
    name: "Limpieza",
    items: [
      { id: "limpieza_pisos", name: "Pisos limpios", description: "Los pisos están limpios y sin residuos" },
      { id: "limpieza_mesas", name: "Mesas y sillas", description: "Mesas y sillas limpias y en buen estado" },
      { id: "limpieza_banos", name: "Baños", description: "Baños limpios y con insumos completos" },
      { id: "limpieza_cocina", name: "Cocina", description: "Área de cocina limpia y ordenada" },
    ],
  },
  {
    id: "presentacion",
    name: "Presentación",
    items: [
      { id: "uniforme", name: "Uniforme del personal", description: "Personal con uniforme completo y en buen estado" },
      { id: "higiene_personal", name: "Higiene personal", description: "Personal con buena higiene y presentación" },
      { id: "presentacion_productos", name: "Presentación de productos", description: "Productos bien presentados y etiquetados" },
    ],
  },
  {
    id: "atencion",
    name: "Atención al Cliente",
    items: [
      { id: "saludo", name: "Saludo y bienvenida", description: "Se saluda correctamente a los clientes" },
      { id: "tiempo_atencion", name: "Tiempo de atención", description: "Tiempo de espera adecuado" },
      { id: "resolucion_problemas", name: "Resolución de problemas", description: "Se resuelven adecuadamente los problemas" },
    ],
  },
  {
    id: "procesos",
    name: "Procesos",
    items: [
      { id: "preparacion", name: "Preparación de alimentos", description: "Se siguen los procedimientos de preparación" },
      { id: "manejo_caja", name: "Manejo de caja", description: "Procedimientos de caja correctos" },
      { id: "control_stock", name: "Control de stock", description: "Inventario actualizado y controlado" },
    ],
  },
  {
    id: "seguridad",
    name: "Seguridad",
    items: [
      { id: "extintores", name: "Extintores", description: "Extintores en buen estado y accesibles" },
      { id: "salidas_emergencia", name: "Salidas de emergencia", description: "Salidas de emergencia señalizadas y despejadas" },
      { id: "elementos_seguridad", name: "Elementos de seguridad", description: "Elementos de seguridad en buen estado" },
    ],
  },
]

export default function NuevaAuditoriaRapidaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("limpieza")
  const [categories, setCategories] = useState(categoriasRapidas)
  
  // Estado para los datos de la auditoría
  const [auditData, setAuditData] = useState({
    localId: "",
    localName: "",
    auditor: "",
    date: format(new Date(), "yyyy-MM-dd"),
    shift: "morning",
    generalObservations: "",
    type: "rapida", // Tipo de auditoría: rápida
    categories: categoriasRapidas.map(category => ({
      ...category,
      score: 0,
      maxScore: category.items.length * 5,
      items: category.items.map(item => ({
        ...item,
        score: 0,
        maxScore: 5,
        observations: ""
      }))
    }))
  })

  // Calcular puntaje total
  const totalScore = auditData.categories.reduce((acc, category) => 
    acc + category.items.reduce((sum, item) => sum + item.score, 0), 0)
  
  const maxScore = auditData.categories.reduce((acc, category) => 
    acc + category.items.reduce((sum, item) => sum + item.maxScore, 0), 0)
  
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

  // Función para obtener el color de la barra según el porcentaje
  const getProgressColor = (percentage) => {
    if (percentage >= 81) return "bg-green-700" // Verde oscuro
    if (percentage >= 61) return "bg-green-500" // Verde claro
    if (percentage >= 41) return "bg-yellow-500" // Amarillo
    if (percentage >= 21) return "bg-orange-500" // Naranja
    return "bg-red-500" // Rojo
  }

  // Manejar cambios en los campos generales
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setAuditData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Manejar cambios en el select
  const handleSelectChange = (name, value) => {
    setAuditData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'localId' && { 
        localName: locales.find(local => local.id === value)?.name || "" 
      })
    }))
  }

  // Manejar cambios en el puntaje de un ítem
  const handleItemScoreChange = (categoryId, itemId, score) => {
    setAuditData(prev => {
      const newCategories = prev.categories.map(category => {
        if (category.id === categoryId) {
          const newItems = category.items.map(item => {
            if (item.id === itemId) {
              return { ...item, score }
            }
            return item
          })

          // Recalcular el puntaje de la categoría
          const categoryScore = newItems.reduce((acc, item) => acc + item.score, 0)

          return {
            ...category,
            items: newItems,
            score: categoryScore
          }
        }
        return category
      })

      return { ...prev, categories: newCategories }
    })
  }

  // Manejar cambios en las observaciones de un ítem
  const handleItemObservationsChange = (categoryId, itemId, observations) => {
    setAuditData(prev => {
      const newCategories = prev.categories.map(category => {
        if (category.id === categoryId) {
          const newItems = category.items.map(item => {
            if (item.id === itemId) {
              return { ...item, observations }
            }
            return item
          })

          return { ...category, items: newItems }
        }
        return category
      })

      return { ...prev, categories: newCategories }
    })
  }

  // Guardar la auditoría
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!auditData.localId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un local",
        variant: "destructive"
      })
      return
    }

    if (!auditData.auditor) {
      toast({
        title: "Error",
        description: "Debes ingresar el nombre del auditor",
        variant: "destructive"
      })
      return
    }

    try {
      setIsLoading(true)

      // Preparar datos para guardar
      const dataToSave = {
        localId: auditData.localId,
        localName: auditData.localName,
        auditor: auditData.auditor,
        auditorName: auditData.auditor,
        date: new Date(auditData.date).toISOString(),
        shift: auditData.shift,
        generalObservations: auditData.generalObservations,
        categories: auditData.categories,
        totalScore,
        maxScore,
        percentage,
        type: "rapida" // Especificar que es una auditoría rápida
      }

      console.log("Guardando auditoría rápida:", dataToSave)

      // Guardar en la base de datos
      const result = await db.audits.create({
        data: dataToSave
      })

      console.log("Auditoría rápida guardada:", result)

      toast({
        title: "Auditoría guardada",
        description: "La auditoría rápida se ha guardado correctamente"
      })

      // Redireccionar a la página de auditorías
      router.push("/auditorias")
    } catch (error) {
      console.error("Error al guardar la auditoría:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar la auditoría. Por favor, intente nuevamente.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout isLoading={isLoading}>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Nueva Auditoría Rápida</h1>
            <p className="text-muted-foreground">Complete el formulario para registrar una nueva auditoría rápida</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/auditorias")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Guardando..." : "Guardar Auditoría"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Información general */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Datos básicos de la auditoría</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="localId">Local</Label>
                <Select
                  value={auditData.localId}
                  onValueChange={(value) => handleSelectChange("localId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar local" />
                  </SelectTrigger>
                  <SelectContent>
                    {locales.map((local) => (
                      <SelectItem key={local.id} value={local.id}>
                        {local.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="auditor">Auditor</Label>
                <Input
                  id="auditor"
                  name="auditor"
                  value={auditData.auditor}
                  onChange={handleInputChange}
                  placeholder="Nombre del auditor"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input 
                  id="date" 
                  name="date" 
                  type="date" 
                  value={auditData.date} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shift">Turno</Label>
                <Select
                  value={auditData.shift}
                  onValueChange={(value) => handleSelectChange("shift", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar turno" />
                  </SelectTrigger>
                  <SelectContent>
                    {turnos.map((turno) => (
                      <SelectItem key={turno.id} value={turno.id}>
                        {turno.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="generalObservations">Observaciones Generales</Label>
                <Textarea
                  id="generalObservations"
                  name="generalObservations"
                  value={auditData.generalObservations}
                  onChange={handleInputChange}
                  placeholder="Observaciones generales de la auditoría"
                  rows={4}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start">
              <div className="w-full mb-2">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Puntaje Total:</span>
                  <span className="text-sm font-medium">
                    {totalScore} / {maxScore} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-white border rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${getProgressColor(percentage)}`} 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Completa todas las categorías para finalizar la auditoría</p>
            </CardFooter>
          </Card>

          {/* Categorías y puntajes */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Evaluación por Categorías</CardTitle>
              <CardDescription>Califica cada ítem de 0 a 5 puntos</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-4">
                  {auditData.categories.map((category) => (
                    <TabsTrigger key={category.id} value={category.id}>
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {auditData.categories.map((category) => (
                  <TabsContent key={category.id} value={category.id} className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">{category.name}</h3>
                      <span className="text-sm font-medium">
                        {category.score} / {category.maxScore} puntos
                      </span>
                    </div>

                    {category.items.map((item) => (
                      <div key={item.id} className="space-y-4 border-b pb-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <Label className="text-base">{item.name}</Label>
                            <span className="text-sm font-medium">
                              {item.score} / {item.maxScore}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                        </div>

                        <RadioGroup 
                          value={item.score.toString()} 
                          onValueChange={(value) => handleItemScoreChange(category.id, item.id, parseInt(value))}
                          className="flex flex-wrap gap-4"
                        >
                          {puntajeOptions.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.value.toString()} id={`${item.id}-${option.value}`} />
                              <Label htmlFor={`${item.id}-${option.value}`} className="font-normal">
                                {option.label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>

                        <Textarea
                          placeholder="Observaciones (opcional)"
                          value={item.observations}
                          onChange={(e) => handleItemObservationsChange(category.id, item.id, e.target.value)}
                          rows={2}
                        />
                      </div>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}