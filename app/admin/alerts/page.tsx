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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { mockAlerts, mockUsers } from "@/lib/mock-data"
import { dbService } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Package, DollarSign, RefreshCcw } from "lucide-react"
import { supabase } from "@/lib/supabase-client"

export default function AlertsPage() {
  const { toast } = useToast()
  const [alerts, setAlerts] = useState([])
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [resolution, setResolution] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [resolutionType, setResolutionType] = useState("manual")
  const [showStockAdjustmentDialog, setShowStockAdjustmentDialog] = useState(false)
  const [showEmployeeDeductionDialog, setShowEmployeeDeductionDialog] = useState(false)
  const [stockAdjustment, setStockAdjustment] = useState({
    productId: "",
    quantity: 0,
    notes: "",
  })
  const [employeeDeduction, setEmployeeDeduction] = useState({
    amount: 0,
    employees: {},
    notes: "",
  })
  const [availableEmployees, setAvailableEmployees] = useState([])

  // Cargar alertas al montar el componente
  useEffect(() => {
    loadAlerts()
  }, [toast])

  // Función para cargar alertas
  const loadAlerts = async () => {
    setLoading(true)
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

  // Función para refrescar la lista de alertas
  const refreshAlerts = async () => {
    setRefreshing(true)
    try {
      await loadAlerts()
      toast({
        title: "Alertas actualizadas",
        description: "La lista de alertas ha sido actualizada correctamente.",
      })
    } catch (error) {
      console.error("Error al refrescar alertas:", error)
      toast({
        title: "Error",
        description: "No se pudieron actualizar las alertas.",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  // Cuando se selecciona una alerta, cargar los empleados disponibles
  useEffect(() => {
    if (selectedAlert && selectedAlert.type === "stock") {
      loadEmployeesForAlert(selectedAlert)
    }
  }, [selectedAlert])

  // Cargar empleados activos para la alerta seleccionada
  const loadEmployeesForAlert = async (alert) => {
    try {
      // Obtener empleados activos de la base de datos
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("status", "active")
        .in("role", ["empleado", "encargado"])

      if (error) throw error

      // Procesar los datos de empleados
      const employees =
        data?.map((emp) => ({
          id: emp.id.toString(),
          name: emp.name || emp.full_name || "Sin nombre",
          email: emp.email || "",
          role: emp.role || "empleado",
          branch: emp.branch || emp.location || "",
        })) || []

      setAvailableEmployees(employees)

      // Resetear las selecciones de empleados
      setEmployeeDeduction({
        amount: alert.monetary_value || 0,
        employees: {},
        notes: "",
      })
    } catch (error) {
      console.error("Error al cargar empleados:", error)
      // Fallback a datos de ejemplo
      const employees = mockUsers.filter((user) => user.role === "empleado" || user.role === "encargado")
      setAvailableEmployees(employees)
    }
  }

  const handleResolveAlert = async (id) => {
    try {
      const now = new Date().toISOString()

      // Si es resolución con ajuste de stock
      if (resolutionType === "stock-adjustment" && selectedAlert.type === "stock") {
        await handleStockAdjustment(id, now)
        return
      }

      // Si es resolución con deducción a empleados
      if (resolutionType === "employee-deduction" && selectedAlert.type === "stock") {
        await handleEmployeeDeduction(id, now)
        return
      }

      // Resolución manual estándar
      const updatedAlert = {
        ...selectedAlert,
        status: "resuelta",
        resolution,
        resolvedBy: "user-5", // En un caso real, sería el ID del usuario actual
        resolvedAt: now,
        updatedAt: now,
      }

      // Intentar actualizar en la base de datos
      try {
        const { error } = await dbService.supabase
          .from("alerts")
          .update({
            status: "resuelta",
            resolution,
            resolved_by: "user-5",
            resolved_at: now,
            updated_at: now,
          })
          .eq("id", id)

        if (error) throw error
      } catch (dbError) {
        console.error("Error al actualizar alerta en la base de datos:", dbError)
        // Continuar con la actualización local aunque falle la BD
      }

      // Actualizar el estado local
      setAlerts(alerts.map((alert) => (alert.id === id ? updatedAlert : alert)))

      setSelectedAlert(null)
      setResolution("")
      setResolutionType("manual")

      toast({
        title: "Alerta resuelta",
        description: "La alerta ha sido marcada como resuelta correctamente.",
      })
    } catch (error) {
      console.error("Error al resolver alerta:", error)
      toast({
        title: "Error",
        description: "No se pudo resolver la alerta. Intente nuevamente.",
        variant: "destructive",
      })
    }
  }

  // Función para manejar el ajuste de stock
  const handleStockAdjustment = async (alertId, timestamp) => {
    try {
      // Validar datos
      if (!stockAdjustment.productId || stockAdjustment.quantity <= 0) {
        toast({
          title: "Error",
          description: "Por favor complete todos los campos del ajuste de stock.",
          variant: "destructive",
        })
        return
      }

      // En un caso real, aquí realizaríamos el ajuste en la base de datos de inventario

      // Preparar la resolución con los detalles del ajuste
      const adjustmentResolution = `Ajuste de stock realizado: ${stockAdjustment.quantity} unidades agregadas al inventario. ${stockAdjustment.notes ? `Notas: ${stockAdjustment.notes}` : ""}`

      // Actualizar la alerta con la resolución
      const updatedAlert = {
        ...selectedAlert,
        status: "resuelta",
        resolution: adjustmentResolution,
        resolvedBy: "user-5",
        resolvedAt: timestamp,
        updatedAt: timestamp,
      }

      // Intentar actualizar en la base de datos
      try {
        const { error } = await dbService.supabase
          .from("alerts")
          .update({
            status: "resuelta",
            resolution: adjustmentResolution,
            resolved_by: "user-5",
            resolved_at: timestamp,
            updated_at: timestamp,
          })
          .eq("id", alertId)

        if (error) throw error
      } catch (dbError) {
        console.error("Error al actualizar alerta en la base de datos:", dbError)
      }

      // Actualizar el estado local
      setAlerts(alerts.map((alert) => (alert.id === alertId ? updatedAlert : alert)))

      // Limpiar el estado
      setSelectedAlert(null)
      setStockAdjustment({
        productId: "",
        quantity: 0,
        notes: "",
      })
      setShowStockAdjustmentDialog(false)
      setResolutionType("manual")

      toast({
        title: "Stock ajustado",
        description: "El ajuste de stock ha sido realizado y la alerta ha sido resuelta.",
      })
    } catch (error) {
      console.error("Error al realizar ajuste de stock:", error)
      toast({
        title: "Error",
        description: "No se pudo realizar el ajuste de stock.",
        variant: "destructive",
      })
    }
  }

  // Función para manejar la deducción a empleados
  const handleEmployeeDeduction = async (alertId, timestamp) => {
    try {
      // Validar datos
      const selectedEmployees = Object.entries(employeeDeduction.employees)
        .filter(([_, isSelected]) => isSelected)
        .map(([id, _]) => id)

      if (selectedEmployees.length === 0 || employeeDeduction.amount <= 0) {
        toast({
          title: "Error",
          description: "Por favor seleccione al menos un empleado y especifique un monto válido.",
          variant: "destructive",
        })
        return
      }

      // En un caso real, aquí registraríamos la deducción en el sistema de nómina

      // Calcular el monto por empleado
      const amountPerEmployee = employeeDeduction.amount / selectedEmployees.length

      // Obtener nombres de empleados
      const employeeNames = selectedEmployees
        .map((id) => {
          const employee = availableEmployees.find((u) => u.id === id)
          return employee ? employee.name : id
        })
        .join(", ")

      // Preparar la resolución con los detalles de la deducción
      const deductionResolution = `Deducción aplicada: ${formatCurrency(employeeDeduction.amount)} distribuido entre ${selectedEmployees.length} empleados (${formatCurrency(amountPerEmployee)} c/u). Empleados: ${employeeNames}. ${employeeDeduction.notes ? `Notas: ${employeeDeduction.notes}` : ""}`

      // Actualizar la alerta con la resolución
      const updatedAlert = {
        ...selectedAlert,
        status: "resuelta",
        resolution: deductionResolution,
        resolvedBy: "user-5",
        resolvedAt: timestamp,
        updatedAt: timestamp,
      }

      // Intentar actualizar en la base de datos
      try {
        const { error } = await dbService.supabase
          .from("alerts")
          .update({
            status: "resuelta",
            resolution: deductionResolution,
            resolved_by: "user-5",
            resolved_at: timestamp,
            updated_at: timestamp,
          })
          .eq("id", alertId)

        if (error) throw error
      } catch (dbError) {
        console.error("Error al actualizar alerta en la base de datos:", dbError)
      }

      // Actualizar el estado local
      setAlerts(alerts.map((alert) => (alert.id === alertId ? updatedAlert : alert)))

      // Limpiar el estado
      setSelectedAlert(null)
      setEmployeeDeduction({
        amount: 0,
        employees: {},
        notes: "",
      })
      setShowEmployeeDeductionDialog(false)
      setResolutionType("manual")

      toast({
        title: "Deducción aplicada",
        description: "La deducción ha sido registrada y la alerta ha sido resuelta.",
      })
    } catch (error) {
      console.error("Error al aplicar deducción:", error)
      toast({
        title: "Error",
        description: "No se pudo aplicar la deducción a los empleados.",
        variant: "destructive",
      })
    }
  }

  // Manejar selección/deselección de empleados
  const handleEmployeeSelection = (employeeId) => {
    setEmployeeDeduction((prev) => ({
      ...prev,
      employees: {
        ...prev.employees,
        [employeeId]: !prev.employees[employeeId],
      },
    }))
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "alta":
        return "destructive"
      case "media":
        return "warning"
      case "baja":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pendiente":
        return "destructive"
      case "revisada":
        return "warning"
      case "resuelta":
        return "success"
      default:
        return "secondary"
    }
  }

  const filteredAlerts = alerts.filter((alert) => {
    if (activeTab === "all") return true
    if (activeTab === "pending") return alert.status === "pendiente"
    if (activeTab === "reviewed") return alert.status === "revisada"
    if (activeTab === "resolved") return alert.status === "resuelta"
    if (activeTab === "stock") return alert.type === "stock"
    if (activeTab === "cash") return alert.type === "caja"
    if (activeTab === "decomiso") return alert.type === "decomiso"
    return true
  })

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return ""
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Alertas del Sistema</h1>
        </div>
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Cargando alertas...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Alertas del Sistema</h1>
        <Button variant="outline" onClick={refreshAlerts} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
          Actualizar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="reviewed">Revisadas</TabsTrigger>
          <TabsTrigger value="resolved">Resueltas</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="cash">Caja</TabsTrigger>
          <TabsTrigger value="decomiso">Decomisos</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>Alertas {activeTab !== "all" ? `(${activeTab})` : ""}</CardTitle>
              <CardDescription>Gestiona las alertas generadas por el sistema de control anti-robo</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredAlerts.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">No hay alertas que coincidan con los filtros</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Turno</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Severidad</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>{new Date(alert.date).toLocaleDateString()}</TableCell>
                        <TableCell>{alert.localName}</TableCell>
                        <TableCell>{alert.shift}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {alert.type === "stock"
                              ? "Stock"
                              : alert.type === "caja"
                                ? "Caja"
                                : alert.type === "decomiso"
                                  ? "Decomiso"
                                  : alert.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getSeverityColor(alert.severity)}>{alert.severity.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>
                          {alert.description}
                          {alert.monetaryValue && (
                            <div className="text-sm text-red-500 mt-1">
                              Impacto financiero: {formatCurrency(alert.monetaryValue)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(alert.status)}>
                            {alert.status === "pendiente"
                              ? "Pendiente"
                              : alert.status === "revisada"
                                ? "Revisada"
                                : alert.status === "resuelta"
                                  ? "Resuelta"
                                  : alert.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {alert.status !== "resuelta" ? (
                            <Button variant="outline" size="sm" onClick={() => setSelectedAlert(alert)}>
                              Resolver
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => setSelectedAlert(alert)}>
                              Ver detalles
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo para resolver alerta */}
      <Dialog
        open={selectedAlert !== null && !showStockAdjustmentDialog && !showEmployeeDeductionDialog}
        onOpenChange={(open) => !open && setSelectedAlert(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAlert?.status !== "resuelta" ? "Resolver Alerta" : "Detalles de Alerta"}</DialogTitle>
            <DialogDescription>
              {selectedAlert?.status !== "resuelta"
                ? "Selecciona cómo deseas resolver esta alerta."
                : "Información detallada de la alerta y su resolución."}
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <>
              <div className="space-y-2 mb-4">
                <p>
                  <strong>Tipo:</strong>{" "}
                  {selectedAlert.type === "stock"
                    ? "Stock"
                    : selectedAlert.type === "caja"
                      ? "Caja"
                      : selectedAlert.type === "decomiso"
                        ? "Decomiso"
                        : selectedAlert.type}
                </p>
                <p>
                  <strong>Descripción:</strong> {selectedAlert.description}
                </p>
                <p>
                  <strong>Fecha:</strong> {new Date(selectedAlert.date).toLocaleDateString()}
                </p>
                <p>
                  <strong>Local:</strong> {selectedAlert.localName}
                </p>
                <p>
                  <strong>Turno:</strong> {selectedAlert.shift}
                </p>
                <p>
                  <strong>Severidad:</strong> {selectedAlert.severity.toUpperCase()}
                </p>

                {selectedAlert.monetaryValue && (
                  <p>
                    <strong>Impacto financiero:</strong> {formatCurrency(selectedAlert.monetaryValue)}
                  </p>
                )}

                {selectedAlert.context && (
                  <p>
                    <strong>Contexto:</strong> {selectedAlert.context}
                  </p>
                )}

                {selectedAlert.status === "resuelta" && (
                  <>
                    <p>
                      <strong>Resolución:</strong> {selectedAlert.resolution}
                    </p>
                    <p>
                      <strong>Resuelto por:</strong>{" "}
                      {mockUsers.find((user) => user.id === selectedAlert.resolvedBy)?.name || selectedAlert.resolvedBy}
                    </p>
                    <p>
                      <strong>Fecha de resolución:</strong> {new Date(selectedAlert.resolvedAt).toLocaleString()}
                    </p>
                  </>
                )}
              </div>

              {selectedAlert.status !== "resuelta" && (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tipo de resolución</Label>
                      <RadioGroup value={resolutionType} onValueChange={setResolutionType} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="manual" id="manual" />
                          <Label htmlFor="manual">Resolución manual</Label>
                        </div>

                        {selectedAlert.type === "stock" && (
                          <>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="stock-adjustment" id="stock-adjustment" />
                              <Label htmlFor="stock-adjustment" className="flex items-center">
                                <Package className="h-4 w-4 mr-2" />
                                Ajustar stock
                              </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="employee-deduction" id="employee-deduction" />
                              <Label htmlFor="employee-deduction" className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-2" />
                                Deducción a empleados
                              </Label>
                            </div>
                          </>
                        )}
                      </RadioGroup>
                    </div>

                    {resolutionType === "manual" && (
                      <Textarea
                        placeholder="Ingresa la resolución de esta alerta..."
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        rows={4}
                      />
                    )}
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                      Cancelar
                    </Button>

                    {resolutionType === "stock-adjustment" ? (
                      <Button
                        onClick={() => {
                          setShowStockAdjustmentDialog(true)
                          // Pre-llenar con datos de la alerta
                          if (selectedAlert.difference_amount) {
                            setStockAdjustment({
                              productId: "default-product",
                              quantity: Math.abs(selectedAlert.difference_amount),
                              notes: "",
                            })
                          }
                        }}
                      >
                        Continuar con ajuste de stock
                      </Button>
                    ) : resolutionType === "employee-deduction" ? (
                      <Button
                        onClick={() => {
                          setShowEmployeeDeductionDialog(true)
                          // Pre-llenar con datos de la alerta
                          if (selectedAlert.monetaryValue) {
                            setEmployeeDeduction({
                              ...employeeDeduction,
                              amount: selectedAlert.monetaryValue,
                            })
                          }
                        }}
                      >
                        Continuar con deducción
                      </Button>
                    ) : (
                      <Button onClick={() => handleResolveAlert(selectedAlert.id)} disabled={!resolution.trim()}>
                        Resolver Alerta
                      </Button>
                    )}
                  </DialogFooter>
                </>
              )}

              {selectedAlert.status === "resuelta" && (
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                    Cerrar
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo para ajuste de stock */}
      <Dialog open={showStockAdjustmentDialog} onOpenChange={(open) => !open && setShowStockAdjustmentDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajuste de Stock</DialogTitle>
            <DialogDescription>
              Completa los detalles para realizar el ajuste de stock y resolver la alerta.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product">Producto</Label>
              <Select
                value={stockAdjustment.productId}
                onValueChange={(value) => setStockAdjustment({ ...stockAdjustment, productId: value })}
              >
                <SelectTrigger id="product">
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default-product">Producto de la alerta</SelectItem>
                  <SelectItem value="product-1">Empanadas</SelectItem>
                  <SelectItem value="product-2">Pizzas Muzzarella</SelectItem>
                  <SelectItem value="product-3">Pizzas Doble Muzzarella</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad a ajustar</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={stockAdjustment.quantity}
                onChange={(e) =>
                  setStockAdjustment({ ...stockAdjustment, quantity: Number.parseInt(e.target.value) || 0 })
                }
              />
              <p className="text-xs text-muted-foreground">
                Ingresa la cantidad de unidades que se agregarán al inventario.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionales</Label>
              <Textarea
                id="notes"
                placeholder="Notas sobre el ajuste de stock..."
                value={stockAdjustment.notes}
                onChange={(e) => setStockAdjustment({ ...stockAdjustment, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowStockAdjustmentDialog(false)
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => handleResolveAlert(selectedAlert.id)}
              disabled={!stockAdjustment.productId || stockAdjustment.quantity <= 0}
            >
              Realizar Ajuste y Resolver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para deducción a empleados */}
      <Dialog
        open={showEmployeeDeductionDialog}
        onOpenChange={(open) => !open && setShowEmployeeDeductionDialog(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Deducción a Empleados</DialogTitle>
            <DialogDescription>
              Selecciona los empleados a los que se aplicará la deducción y el monto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto total a deducir</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                value={employeeDeduction.amount}
                onChange={(e) =>
                  setEmployeeDeduction({ ...employeeDeduction, amount: Number.parseFloat(e.target.value) || 0 })
                }
              />
              <p className="text-xs text-muted-foreground">
                Este monto se distribuirá entre los empleados seleccionados.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Empleados del turno</Label>
              <div className="border rounded-md p-3 mt-1 max-h-40 overflow-y-auto">
                {availableEmployees.length > 0 ? (
                  <div className="space-y-2">
                    {availableEmployees.map((employee) => (
                      <div key={employee.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`employee-${employee.id}`}
                          checked={!!employeeDeduction.employees[employee.id]}
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
              <p className="text-xs text-muted-foreground">
                {Object.values(employeeDeduction.employees).filter(Boolean).length > 0
                  ? `El monto se repartirá entre ${Object.values(employeeDeduction.employees).filter(Boolean).length} empleados`
                  : "Selecciona los empleados a los que se aplicará la deducción"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deduction-notes">Notas adicionales</Label>
              <Textarea
                id="deduction-notes"
                placeholder="Notas sobre la deducción..."
                value={employeeDeduction.notes}
                onChange={(e) => setEmployeeDeduction({ ...employeeDeduction, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEmployeeDeductionDialog(false)
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => handleResolveAlert(selectedAlert.id)}
              disabled={
                Object.values(employeeDeduction.employees).filter(Boolean).length === 0 || employeeDeduction.amount <= 0
              }
            >
              Aplicar Deducción y Resolver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}





