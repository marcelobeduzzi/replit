"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { db } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react"
// Importar la nueva función para preparar fechas para la base de datos
import { prepareForDatabase } from "@/lib/date-utils"

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

// Categorías predefinidas
const categoriasPredefinidas = [
  {
    id: "limpieza",
    name: "Limpieza y Orden",
    items: [
      { id: "limpieza_pisos", name: "Pisos limpios", maxScore: 5 },
      { id: "limpieza_mesas", name: "Mesas y sillas", maxScore: 5 },
      { id: "limpieza_banos", name: "Baños", maxScore: 5 },
      { id: "limpieza_cocina", name: "Cocina", maxScore: 5 },
      { id: "limpieza_vitrinas", name: "Vitrinas y exhibidores", maxScore: 5 },
      { id: "orden_general", name: "Orden general", maxScore: 5 },
    ],
  },
  {
    id: "presentacion",
    name: "Presentación del Personal",
    items: [
      { id: "uniforme", name: "Uniforme completo y limpio", maxScore: 5 },
      { id: "higiene_personal", name: "Higiene personal", maxScore: 5 },
      { id: "identificacion", name: "Identificación visible", maxScore: 5 },
      { id: "comportamiento", name: "Comportamiento profesional", maxScore: 5 },
    ],
  },
  {
    id: "atencion",
    name: "Atención al Cliente",
    items: [
      { id: "saludo", name: "Saludo y bienvenida", maxScore: 5 },
      { id: "tiempo_espera", name: "Tiempo de espera", maxScore: 5 },
      { id: "conocimiento", name: "Conocimiento de productos", maxScore: 5 },
      { id: "resolucion", name: "Resolución de problemas", maxScore: 5 },
      { id: "despedida", name: "Despedida", maxScore: 5 },
    ],
  },
  {
    id: "productos",
    name: "Calidad de Productos",
    items: [
      { id: "presentacion_productos", name: "Presentación de productos", maxScore: 5 },
      { id: "frescura", name: "Frescura de ingredientes", maxScore: 5 },
      { id: "temperatura", name: "Temperatura adecuada", maxScore: 5 },
      { id: "sabor", name: "Sabor", maxScore: 5 },
      { id: "consistencia", name: "Consistencia", maxScore: 5 },
    ],
  },
  {
    id: "procesos",
    name: "Procesos Operativos",
    items: [
      { id: "preparacion", name: "Preparación de alimentos", maxScore: 5 },
      { id: "manejo_caja", name: "Manejo de caja", maxScore: 5 },
      { id: "control_stock", name: "Control de stock", maxScore: 5 },
      { id: "limpieza_equipos", name: "Limpieza de equipos", maxScore: 5 },
      { id: "mantenimiento", name: "Mantenimiento preventivo", maxScore: 5 },
    ],
  },
]

export default function NuevaAuditoriaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const [auditConfig, setAuditConfig] = useState(null)

  // Estado para los datos de la auditoría
  const [auditData, setAuditData] = useState({
    localId: "",
    localName: "",
    auditor: "",
    managerName: "",
    date: format(new Date(), "yyyy-MM-dd"),
    shift: "morning",
    generalObservations: "",
    type: "detallada", // Tipo de auditoría: detallada
    categories: categoriasPredefinidas.map((category) => ({
      ...category,
      score: 0,
      maxScore: category.items.reduce((acc, item) => acc + item.maxScore, 0),
      items: category.items.map((item) => ({
        ...item,
        score: 0,
        observations: "",
      })),
    })),
  })

  // Cargar configuración de auditoría - Modificado para manejar el error
  useEffect(() => {
    const fetchAuditConfig = async () => {
      try {
        // Verificar si existe el método findFirst en auditConfig
        if (typeof db.auditConfig?.findFirst === "function") {
          const config = await db.auditConfig.findFirst()
          if (config) {
            setAuditConfig(config)

            // Si hay categorías configuradas, usarlas
            if (config.categories && config.categories.length > 0) {
              setAuditData((prev) => ({
                ...prev,
                categories: config.categories.map((category) => ({
                  ...category,
                  score: 0,
                  items: category.items.map((item) => ({
                    ...item,
                    score: 0,
                    observations: "",
                  })),
                })),
              }))
            }
          }
        } else {
          console.log("Usando categorías predefinidas (auditConfig no disponible)")
        }
      } catch (error) {
        console.error("Error al cargar configuración de auditoría:", error)
        // Continuar con las categorías predefinidas
      }
    }

    fetchAuditConfig()
  }, [])

  // Calcular puntaje total
  const totalScore = auditData.categories.reduce(
    (acc, category) => acc + category.items.reduce((sum, item) => sum + item.score, 0),
    0,
  )

  const maxScore = auditData.categories.reduce(
    (acc, category) => acc + category.items.reduce((sum, item) => sum + item.maxScore, 0),
    0,
  )

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
    setAuditData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Manejar cambios en el select
  const handleSelectChange = (name, value) => {
    setAuditData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "localId" && {
        localName: locales.find((local) => local.id === value)?.name || "",
      }),
    }))
  }

  // Manejar cambios en el puntaje de un ítem
  const handleItemScoreChange = (categoryId, itemId, score) => {
    setAuditData((prev) => {
      const newCategories = prev.categories.map((category) => {
        if (category.id === categoryId) {
          const newItems = category.items.map((item) => {
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
            score: categoryScore,
          }
        }
        return category
      })

      return { ...prev, categories: newCategories }
    })
  }

  // Manejar cambios en las observaciones de un ítem
  const handleItemObservationsChange = (categoryId, itemId, observations) => {
    setAuditData((prev) => {
      const newCategories = prev.categories.map((category) => {
        if (category.id === categoryId) {
          const newItems = category.items.map((item) => {
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

  // Agregar una nueva categoría
  const handleAddCategory = () => {
    const newCategoryId = `category_${Date.now()}`
    const newCategory = {
      id: newCategoryId,
      name: "Nueva Categoría",
      score: 0,
      maxScore: 0,
      items: [],
    }

    setAuditData((prev) => ({
      ...prev,
      categories: [...prev.categories, newCategory],
    }))

    // Cambiar a la nueva pestaña
    setActiveTab(newCategoryId)
  }

  // Editar nombre de categoría
  const handleCategoryNameChange = (categoryId, name) => {
    setAuditData((prev) => ({
      ...prev,
      categories: prev.categories.map((category) => (category.id === categoryId ? { ...category, name } : category)),
    }))
  }

  // Eliminar categoría
  const handleDeleteCategory = (categoryId) => {
    setAuditData((prev) => ({
      ...prev,
      categories: prev.categories.filter((category) => category.id !== categoryId),
    }))

    // Cambiar a la pestaña general
    setActiveTab("general")
  }

  // Agregar un nuevo ítem a una categoría
  const handleAddItem = (categoryId) => {
    const newItemId = `item_${Date.now()}`
    const newItem = {
      id: newItemId,
      name: "Nuevo Ítem",
      score: 0,
      maxScore: 5,
      observations: "",
    }

    setAuditData((prev) => {
      const newCategories = prev.categories.map((category) => {
        if (category.id === categoryId) {
          const newItems = [...category.items, newItem]
          return {
            ...category,
            items: newItems,
            maxScore: newItems.reduce((acc, item) => acc + item.maxScore, 0),
          }
        }
        return category
      })

      return { ...prev, categories: newCategories }
    })
  }

  // Editar nombre de ítem
  const handleItemNameChange = (categoryId, itemId, name) => {
    setAuditData((prev) => {
      const newCategories = prev.categories.map((category) => {
        if (category.id === categoryId) {
          const newItems = category.items.map((item) => {
            if (item.id === itemId) {
              return { ...item, name }
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

  // Editar puntaje máximo de ítem
  const handleItemMaxScoreChange = (categoryId, itemId, maxScore) => {
    setAuditData((prev) => {
      const newCategories = prev.categories.map((category) => {
        if (category.id === categoryId) {
          const newItems = category.items.map((item) => {
            if (item.id === itemId) {
              return { ...item, maxScore }
            }
            return item
          })

          // Recalcular el puntaje máximo de la categoría
          const categoryMaxScore = newItems.reduce((acc, item) => acc + item.maxScore, 0)

          return {
            ...category,
            items: newItems,
            maxScore: categoryMaxScore,
          }
        }
        return category
      })

      return { ...prev, categories: newCategories }
    })
  }

  // Eliminar ítem
  const handleDeleteItem = (categoryId, itemId) => {
    setAuditData((prev) => {
      const newCategories = prev.categories.map((category) => {
        if (category.id === categoryId) {
          const newItems = category.items.filter((item) => item.id !== itemId)

          // Recalcular el puntaje y puntaje máximo de la categoría
          const categoryScore = newItems.reduce((acc, item) => acc + item.score, 0)
          const categoryMaxScore = newItems.reduce((acc, item) => acc + item.maxScore, 0)

          return {
            ...category,
            items: newItems,
            score: categoryScore,
            maxScore: categoryMaxScore,
          }
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
        variant: "destructive",
      })
      return
    }

    if (!auditData.auditor) {
      toast({
        title: "Error",
        description: "Debes ingresar el nombre del auditor",
        variant: "destructive",
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
        managerName: auditData.managerName,
        // Usar la nueva función para preparar la fecha para la base de datos
        date: prepareForDatabase(auditData.date),
        shift: auditData.shift,
        generalObservations: auditData.generalObservations,
        categories: auditData.categories,
        totalScore,
        maxScore,
        percentage,
        type: "detallada", // Especificar que es una auditoría detallada
      }

      console.log("Guardando auditoría:", dataToSave)

      // Guardar en la base de datos
      const result = await db.audits.create({
        data: dataToSave,
      })

      console.log("Auditoría guardada:", result)

      toast({
        title: "Auditoría guardada",
        description: "La auditoría se ha guardado correctamente",
      })

      // Redireccionar a la página de auditorías
      router.push("/auditorias")
    } catch (error) {
      console.error("Error al guardar la auditoría:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar la auditoría. Por favor, intente nuevamente.",
        variant: "destructive",
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
            <h1 className="text-3xl font-bold">Nueva Auditoría Detallada</h1>
            <p className="text-muted-foreground">Complete el formulario para registrar una nueva auditoría detallada</p>
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList className="flex-1">
              <TabsTrigger value="general">Información General</TabsTrigger>
              {auditData.categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
            <Button variant="outline" size="sm" onClick={handleAddCategory}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Categoría
            </Button>
          </div>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
                <CardDescription>Datos básicos de la auditoría</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="localId">Local</Label>
                    <Select value={auditData.localId} onValueChange={(value) => handleSelectChange("localId", value)}>
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
                    <Label htmlFor="date">Fecha</Label>
                    <Input id="date" name="date" type="date" value={auditData.date} onChange={handleInputChange} />
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
                    <Label htmlFor="shift">Turno</Label>
                    <Select value={auditData.shift} onValueChange={(value) => handleSelectChange("shift", value)}>
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
                    <Label htmlFor="managerName">Encargado del Local</Label>
                    <Input
                      id="managerName"
                      name="managerName"
                      value={auditData.managerName}
                      onChange={handleInputChange}
                      placeholder="Nombre del encargado"
                    />
                  </div>
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

                <Separator className="my-4" />

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Resumen de Puntajes</h3>
                  <div className="space-y-4">
                    {auditData.categories.map((category) => (
                      <div key={category.id} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{category.name}</span>
                          <span className="text-sm">
                            {category.score} / {category.maxScore} (
                            {category.maxScore > 0 ? Math.round((category.score / category.maxScore) * 100) : 0}%)
                          </span>
                        </div>
                        <div className="w-full bg-white border rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${getProgressColor(category.maxScore > 0 ? (category.score / category.maxScore) * 100 : 0)}`}
                            style={{
                              width: `${category.maxScore > 0 ? (category.score / category.maxScore) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}

                    <Separator className="my-2" />

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-medium">Puntaje Total</span>
                        <span className="text-base font-medium">
                          {totalScore} / {maxScore} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-white border rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${getProgressColor(percentage)}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {auditData.categories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Input
                        value={category.name}
                        onChange={(e) => handleCategoryNameChange(category.id, e.target.value)}
                        className="text-xl font-semibold h-auto py-1 px-2"
                      />
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription>
                      Puntaje: {category.score} / {category.maxScore} (
                      {category.maxScore > 0 ? Math.round((category.score / category.maxScore) * 100) : 0}%)
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleAddItem(category.id)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Ítem
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {category.items.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No hay ítems en esta categoría</p>
                      <Button variant="outline" className="mt-4" onClick={() => handleAddItem(category.id)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Ítem
                      </Button>
                    </div>
                  ) : (
                    category.items.map((item) => (
                      <div key={item.id} className="space-y-4 border-b pb-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <Input
                              value={item.name}
                              onChange={(e) => handleItemNameChange(category.id, item.id, e.target.value)}
                              className="font-medium mb-2"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col items-end">
                              <Label htmlFor={`maxScore-${item.id}`} className="mb-1 text-sm">
                                Puntaje Máximo: {item.maxScore}
                              </Label>
                              <Select
                                value={item.maxScore.toString()}
                                onValueChange={(value) =>
                                  handleItemMaxScoreChange(category.id, item.id, Number.parseInt(value))
                                }
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[1, 2, 3, 4, 5, 10].map((value) => (
                                    <SelectItem key={value} value={value.toString()}>
                                      {value}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteItem(category.id, item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor={`score-${item.id}`}>
                              Puntaje: {item.score} / {item.maxScore}
                            </Label>
                            <span className="text-sm font-medium">
                              {Math.round((item.score / item.maxScore) * 100)}%
                            </span>
                          </div>
                          <Slider
                            id={`score-${item.id}`}
                            min={0}
                            max={item.maxScore}
                            step={1}
                            value={[item.score]}
                            onValueChange={(value) => handleItemScoreChange(category.id, item.id, value[0])}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`observations-${item.id}`}>Observaciones</Label>
                          <Textarea
                            id={`observations-${item.id}`}
                            value={item.observations}
                            onChange={(e) => handleItemObservationsChange(category.id, item.id, e.target.value)}
                            placeholder="Observaciones sobre este ítem"
                            rows={3}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  )
}















