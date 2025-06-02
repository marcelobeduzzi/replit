"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { mockUsers, mockAlerts } from "@/lib/mock-data"
import { dbService } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"

// Tipos de acciones correctivas
const actionTypes = [
  { id: "stock-adjustment", name: "Ajuste de Stock" },
  { id: "employee-deduction", name: "Deducción a Empleado" },
  { id: "training", name: "Capacitación" },
  { id: "process-change", name: "Cambio de Proceso" },
  { id: "warning", name: "Advertencia" },
  { id: "other", name: "Otro" },
]

// Datos de ejemplo para acciones correctivas
const mockActions = [
  {
    id: "action-1",
    alertId: mockAlerts[0].id,
    type: "stock-adjustment",
    description: "Ajuste de inventario para corregir faltante de 10 unidades de Empanadas",
    amount: 5000,
    status: "completada",
    assignedTo: "user-1",
    createdBy: "user-5",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Se realizó el ajuste en el sistema y se notificó al encargado del local.",
  },
  {
    id: "action-2",
    alertId: mockAlerts[1].id,
    type: "employee-deduction",
    description: "Deducción de $6,500 al empleado responsable por faltante en caja",
    amount: 6500,
    status: "pendiente",
    assignedTo: "user-2",
    createdBy: "user-5",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: null,
    notes: "Pendiente de aprobación por RRHH.",
  },
  {
    id: "action-3",
    alertId: mockAlerts[2].id,
    type: "training",
    description: "Capacitación sobre procedimientos de decomiso para el personal del local",
    amount: 0,
    status: "en-progreso",
    assignedTo: "user-3",
    createdBy: "user-5",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: null,
    notes: "Programada para el próximo viernes.",
  },
]

export default function AdminActionsPage() {
  const { toast } = useToast()
  const [alerts, setAlerts] = useState([])
  const [actions, setActions] = useState(mockActions)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [showNewActionDialog, setShowNewActionDialog] = useState(false)
  const [showActionDetailsDialog, setShowActionDetailsDialog] = useState(false)
  const [selectedAction, setSelectedAction] = useState(null)
  const [newAction, setNewAction] = useState({
    type: "",
    description: "",
    amount: 0,
    assignedTo: "",
    notes: "",
    affectedEmployees: [],
  })
  const [shiftEmployees, setShiftEmployees] = useState([])
  const [selectedEmployees, setSelectedEmployees] = useState({})

  // Cargar alertas al montar el componente
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        // Intentar cargar desde la base de datos
        try {
          const { data, error } = await dbService.supabase
            .from("alerts")
            .select("*")
            .order("created_at", { ascending: false })

          if (error) throw error

          if (data && data.length > 0) {
            setAlerts(
              data.map((alert) => ({
                ...alert,
                // Asegurar que las fechas sean strings
                date: alert.date ? new Date(alert.date).toISOString() : new Date().toISOString(),
                createdAt: alert.created_at ? new Date(alert.created_at).toISOString() : new Date().toISOString(),
                updatedAt: alert.updated_at ? new Date(alert.updated_at).toISOString() : new Date().toISOString(),
                resolvedAt: alert.resolved_at ? new Date(alert.resolved_at).toISOString() : null,
              })),
            )
          } else {
            // Si no hay datos en la base de datos, intentar cargar desde localStorage
            const localAlerts = localStorage.getItem("localAlerts")
            if (localAlerts) {
              setAlerts(JSON.parse(localAlerts))
            } else {
              // Si no hay datos en localStorage, usar los datos de mock
              setAlerts(mockAlerts)
            }
          }
        } catch (dbError) {
          console.error("Error al cargar alertas desde la base de datos:", dbError)
          // Intentar cargar desde localStorage
          const localAlerts = localStorage.getItem("localAlerts")
          if (localAlerts) {
            setAlerts(JSON.parse(localAlerts))
          } else {
            // Usar datos de mock como fallback
            setAlerts(mockAlerts)
          }
        }
      } catch (error) {
        console.error("Error al cargar alertas:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las alertas. Se están usando datos de ejemplo.",
          variant: "destructive",
        })
        setAlerts(mockAlerts)
      } finally {
        setLoading(false)
      }
    }

    loadAlerts()
  }, [toast])

  // Cuando se selecciona una alerta, cargar los empleados del turno correspondiente
  useEffect(() => {
    if (selectedAlert) {
      // En un caso real, aquí cargaríamos los empleados del turno desde la base de datos
      // Para este ejemplo, filtramos los empleados de mockUsers
      const employees = mockUsers.filter((user) => user.role === "empleado" || user.role === "encargado")
      setShiftEmployees(employees)

      // Resetear los empleados seleccionados
      setSelectedEmployees({})
    }
  }, [selectedAlert])

  // Función para crear una nueva acción correctiva
  const handleCreateAction = () => {
    if (!newAction.type || !newAction.description || !newAction.assignedTo) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      })
      return
    }

    const actionId = `action-${Date.now()}`
    const now = new Date().toISOString()

    // Si es una deducción a empleado, procesar los empleados seleccionados
    let affectedEmployees = []
    let actionDescription = newAction.description

    if (newAction.type === "employee-deduction") {
      affectedEmployees = Object.entries(selectedEmployees)
        .filter(([_, isSelected]) => isSelected)
        .map(([id, _]) => id)

      if (affectedEmployees.length === 0) {
        toast({
          title: "Error",
          description: "Debes seleccionar al menos un empleado para la deducción.",
          variant: "destructive",
        })
        return
      }

      // Calcular el monto por empleado
      const amountPerEmployee = Number.parseFloat(newAction.amount) / affectedEmployees.length

      // Actualizar la descripción para incluir los empleados afectados
      actionDescription = `Deducción de ${formatCurrency(Number.parseFloat(newAction.amount))} repartido entre ${affectedEmployees.length} empleados (${formatCurrency(amountPerEmployee)} c/u)`
    }

    const action = {
      id: actionId,
      alertId: selectedAlert.id,
      type: newAction.type,
      description: actionDescription,
      amount: Number.parseFloat(newAction.amount) || 0,
      status: "pendiente",
      assignedTo: newAction.assignedTo,
      createdBy: "user-5", // En un caso real, sería el ID del usuario actual
      createdAt: now,
      completedAt: null,
      notes: newAction.notes,
      affectedEmployees: affectedEmployees,
    }

    // Actualizar el estado local
    setActions([...actions, action])

    // Cerrar el diálogo y resetear el formulario
    setShowNewActionDialog(false)
    setNewAction({
      type: "",
      description: "",
      amount: 0,
      assignedTo: "",
      notes: "",
      affectedEmployees: [],
    })
    setSelectedEmployees({})

    toast({
      title: "Acción creada",
      description: "La acción correctiva ha sido creada correctamente.",
    })
  }

  // Función para actualizar el estado de una acción
  const handleUpdateActionStatus = (actionId, newStatus) => {
    const now = new Date().toISOString()

    setActions(
      actions.map((action) => {
        if (action.id === actionId) {
          return {
            ...action,
            status: newStatus,
            completedAt: newStatus === "completada" ? now : action.completedAt,
          }
        }
        return action
      }),
    )

    setShowActionDetailsDialog(false)

    toast({
      title: "Estado actualizado",
      description: `La acción ha sido marcada como ${newStatus}.`,
    })
  }

  // Manejar cambio en el tipo de acción
  const handleActionTypeChange = (type) => {
    setNewAction({ ...newAction, type })

    // Si es ajuste de stock y hay una alerta seleccionada, pre-llenar la descripción
    if (type === "stock-adjustment" && selectedAlert) {
      let description = `Ajuste de stock para corregir `

      if (selectedAlert.type === "stock") {
        description += `faltante de ${Math.abs(selectedAlert.difference_amount || 0)} unidades de producto`
      } else {
        description += `diferencia detectada en ${selectedAlert.type}`
      }

      setNewAction({
        ...newAction,
        type,
        description,
        amount: selectedAlert.monetary_value || 0,
      })
    }

    // Si es deducción a empleado, pre-llenar con el monto de la alerta
    else if (type === "employee-deduction" && selectedAlert) {
      setNewAction({
        ...newAction,
        type,
        description: `Deducción por ${selectedAlert.type === "stock" ? "faltante de stock" : selectedAlert.type === "caja" ? "faltante en caja" : "irregularidad"}`,
        amount: selectedAlert.monetary_value || 0,
      })
    }
  }

  // Manejar selección/deselección de empleados
  const handleEmployeeSelection = (employeeId) => {
    setSelectedEmployees((prev) => ({
      ...prev,
      [employeeId]: !prev[employeeId],
    }))
  }

  // Filtrar acciones según la pestaña activa
  const filteredActions = actions.filter((action) => {
    if (activeTab === "all") return true
    if (activeTab === "pending") return action.status === "pendiente"
    if (activeTab === "in-progress") return action.status === "en-progreso"
    if (activeTab === "completed") return action.status === "completada"
    if (activeTab === "stock") return action.type === "stock-adjustment"
    if (activeTab === "employee") return action.type === "employee-deduction"
    return true
  })

  // Formatear moneda
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return ""
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  // Obtener nombre de usuario
  const getUserName = (userId) => {
    const user = mockUsers.find((u) => u.id === userId)
    return user ? user.name : userId
  }

  // Obtener nombre de tipo de acción
  const getActionTypeName = (typeId) => {
    const type = actionTypes.find((t) => t.id === typeId)
    return type ? type.name : typeId
  }

  // Obtener alerta relacionada
  const getRelatedAlert = (alertId) => {
    return alerts.find((a) => a.id === alertId) || {}
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Acciones Correctivas</h1>
        </div>
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p>Cargando datos...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Acciones Correctivas</h1>
        <Button
          onClick={() => {
            setSelectedAlert(null)
            setShowNewActionDialog(true)
          }}
        >
          Nueva Acción
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="in-progress">En Progreso</TabsTrigger>
          <TabsTrigger value="completed">Completadas</TabsTrigger>
          <TabsTrigger value="stock">Ajustes de Stock</TabsTrigger>
          <TabsTrigger value="employee">Deducciones</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>Acciones Correctivas {activeTab !== "all" ? `(${activeTab})` : ""}</CardTitle>
              <CardDescription>Gestiona las acciones correctivas para resolver alertas</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredActions.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">No hay acciones que coincidan con los filtros</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Asignado a</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Alerta</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActions.map((action) => {
                      const relatedAlert = getRelatedAlert(action.alertId)
                      return (
                        <TableRow key={action.id}>
                          <TableCell>{new Date(action.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getActionTypeName(action.type)}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{action.description}</TableCell>
                          <TableCell>{action.amount > 0 ? formatCurrency(action.amount) : "-"}</TableCell>
                          <TableCell>{getUserName(action.assignedTo)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                action.status === "pendiente"
                                  ? "destructive"
                                  : action.status === "en-progreso"
                                    ? "warning"
                                    : "success"
                              }
                            >
                              {action.status === "pendiente"
                                ? "Pendiente"
                                : action.status === "en-progreso"
                                  ? "En Progreso"
                                  : "Completada"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {relatedAlert.id && (
                              <Badge
                                variant={
                                  relatedAlert.severity === "alta"
                                    ? "destructive"
                                    : relatedAlert.severity === "media"
                                      ? "warning"
                                      : "secondary"
                                }
                                className="cursor-pointer"
                                onClick={() => setSelectedAlert(relatedAlert)}
                              >
                                {relatedAlert.type}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAction(action)
                                setShowActionDetailsDialog(true)
                              }}
                            >
                              Ver detalles
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo para crear nueva acción */}
      <Dialog open={showNewActionDialog} onOpenChange={setShowNewActionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Acción Correctiva</DialogTitle>
            <DialogDescription>
              {selectedAlert
                ? `Crear acción correctiva para la alerta: ${selectedAlert.title}`
                : "Crear una nueva acción correctiva"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!selectedAlert && (
              <div>
                <Label htmlFor="alert">Alerta Relacionada</Label>
                <Select onValueChange={(value) => setSelectedAlert(alerts.find((a) => a.id === value))}>
                  <SelectTrigger id="alert">
                    <SelectValue placeholder="Seleccionar alerta" />
                  </SelectTrigger>
                  <SelectContent>
                    {alerts
                      .filter((a) => a.status !== "resuelta")
                      .map((alert) => (
                        <SelectItem key={alert.id} value={alert.id}>
                          {alert.title} ({alert.localName})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="type">Tipo de Acción</Label>
              <Select onValueChange={handleActionTypeChange}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Describe la acción correctiva"
                value={newAction.description}
                onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="amount">Monto (si aplica)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={newAction.amount}
                onChange={(e) => setNewAction({ ...newAction, amount: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">Dejar en 0 si no aplica un monto</p>
            </div>

            {newAction.type === "employee-deduction" && selectedAlert && (
              <div>
                <Label>Empleados del Turno</Label>
                <div className="border rounded-md p-3 mt-1 max-h-40 overflow-y-auto">
                  {shiftEmployees.length > 0 ? (
                    <div className="space-y-2">
                      {shiftEmployees.map((employee) => (
                        <div key={employee.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`employee-${employee.id}`}
                            checked={!!selectedEmployees[employee.id]}
                            onCheckedChange={() => handleEmployeeSelection(employee.id)}
                          />
                          <Label htmlFor={`employee-${employee.id}`} className="cursor-pointer">
                            {employee.name} ({employee.role})
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay empleados disponibles para este turno</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Object.values(selectedEmployees).filter(Boolean).length > 0
                    ? `El monto se repartirá entre ${Object.values(selectedEmployees).filter(Boolean).length} empleados`
                    : "Selecciona los empleados a los que se aplicará la deducción"}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="assignedTo">Asignar a</Label>
              <Select onValueChange={(value) => setNewAction({ ...newAction, assignedTo: value })}>
                <SelectTrigger id="assignedTo">
                  <SelectValue placeholder="Seleccionar responsable" />
                </SelectTrigger>
                <SelectContent>
                  {mockUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notas Adicionales</Label>
              <Textarea
                id="notes"
                placeholder="Notas adicionales sobre la acción"
                value={newAction.notes}
                onChange={(e) => setNewAction({ ...newAction, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewActionDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateAction}
              disabled={!selectedAlert || !newAction.type || !newAction.description || !newAction.assignedTo}
            >
              Crear Acción
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para ver detalles de acción */}
      <Dialog open={showActionDetailsDialog} onOpenChange={setShowActionDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles de Acción Correctiva</DialogTitle>
            <DialogDescription>Información detallada de la acción correctiva</DialogDescription>
          </DialogHeader>

          {selectedAction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">{getActionTypeName(selectedAction.type)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Creación</p>
                  <p className="font-medium">{new Date(selectedAction.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge
                    variant={
                      selectedAction.status === "pendiente"
                        ? "destructive"
                        : selectedAction.status === "en-progreso"
                          ? "warning"
                          : "success"
                    }
                  >
                    {selectedAction.status === "pendiente"
                      ? "Pendiente"
                      : selectedAction.status === "en-progreso"
                        ? "En Progreso"
                        : "Completada"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monto</p>
                  <p className="font-medium">
                    {selectedAction.amount > 0 ? formatCurrency(selectedAction.amount) : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Asignado a</p>
                  <p className="font-medium">{getUserName(selectedAction.assignedTo)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Creado por</p>
                  <p className="font-medium">{getUserName(selectedAction.createdBy)}</p>
                </div>
                {selectedAction.completedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Completado</p>
                    <p className="font-medium">{new Date(selectedAction.completedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Descripción</p>
                <p>{selectedAction.description}</p>
              </div>

              {selectedAction.affectedEmployees && selectedAction.affectedEmployees.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Empleados Afectados</p>
                  <div className="mt-1">
                    {selectedAction.affectedEmployees.map((employeeId) => (
                      <Badge key={employeeId} variant="outline" className="mr-1 mb-1">
                        {getUserName(employeeId)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedAction.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notas</p>
                  <p>{selectedAction.notes}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Alerta Relacionada</p>
                {getRelatedAlert(selectedAction.alertId).id ? (
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={
                          getRelatedAlert(selectedAction.alertId).severity === "alta"
                            ? "destructive"
                            : getRelatedAlert(selectedAction.alertId).severity === "media"
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {getRelatedAlert(selectedAction.alertId).severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{getRelatedAlert(selectedAction.alertId).type}</Badge>
                    </div>
                    <p className="font-medium">{getRelatedAlert(selectedAction.alertId).title}</p>
                    <p className="text-sm">{getRelatedAlert(selectedAction.alertId).description}</p>
                  </div>
                ) : (
                  <p>No se encontró la alerta relacionada</p>
                )}
              </div>

              {selectedAction.status !== "completada" && (
                <div className="flex justify-end gap-2 mt-4">
                  {selectedAction.status === "pendiente" && (
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateActionStatus(selectedAction.id, "en-progreso")}
                    >
                      Marcar En Progreso
                    </Button>
                  )}
                  <Button onClick={() => handleUpdateActionStatus(selectedAction.id, "completada")}>
                    Marcar como Completada
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo para ver detalles de alerta */}
      <Dialog
        open={selectedAlert !== null && !showNewActionDialog}
        onOpenChange={(open) => !open && setSelectedAlert(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles de Alerta</DialogTitle>
            <DialogDescription>Información detallada de la alerta seleccionada</DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      selectedAlert.severity === "alta"
                        ? "destructive"
                        : selectedAlert.severity === "media"
                          ? "warning"
                          : "secondary"
                    }
                  >
                    {selectedAlert.severity.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">{selectedAlert.type}</Badge>
                  <Badge
                    variant={
                      selectedAlert.status === "pendiente"
                        ? "destructive"
                        : selectedAlert.status === "revisada"
                          ? "warning"
                          : "success"
                    }
                  >
                    {selectedAlert.status === "pendiente"
                      ? "Pendiente"
                      : selectedAlert.status === "revisada"
                        ? "Revisada"
                        : "Resuelta"}
                  </Badge>
                </div>
                <h3 className="text-lg font-medium">{selectedAlert.title}</h3>
                <p>{selectedAlert.description}</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p>{new Date(selectedAlert.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Local</p>
                    <p>{selectedAlert.localName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Turno</p>
                    <p className="capitalize">{selectedAlert.shift}</p>
                  </div>
                  {selectedAlert.monetaryValue && (
                    <div>
                      <p className="text-sm text-muted-foreground">Impacto Financiero</p>
                      <p className="text-red-500 font-medium">{formatCurrency(selectedAlert.monetaryValue)}</p>
                    </div>
                  )}
                </div>
                {selectedAlert.context && (
                  <div>
                    <p className="text-sm text-muted-foreground">Contexto</p>
                    <p className="text-sm">{selectedAlert.context}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    setShowNewActionDialog(true)
                  }}
                >
                  Crear Acción Correctiva
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}



