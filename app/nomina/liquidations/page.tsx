"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2, CheckCircle, AlertCircle, FileText, Edit, RefreshCw } from "lucide-react"
import {
  markLiquidationsAsPaid,
} from "@/lib/liquidation-service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/utils"
import { useRouter } from "next/navigation"

export default function LiquidationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [pendingLiquidations, setPendingLiquidations] = useState<any[]>([])
  const [paidLiquidations, setPaidLiquidations] = useState<any[]>([])
  const [loadingLiquidations, setLoadingLiquidations] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [selectedLiquidations, setSelectedLiquidations] = useState<string[]>([])
  const [paymentDetails, setPaymentDetails] = useState({
    payment_date: format(new Date(), "yyyy-MM-dd"),
    payment_method: "transfer",
    payment_reference: "",
    notes: "",
  })
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false)
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)
  const [regenerateLoading, setRegenerateLoading] = useState(false)
  const [regenerateResult, setRegenerateResult] = useState<any>(null)

  useEffect(() => {
    loadLiquidations()
  }, [])

  const loadLiquidations = async () => {
    setLoadingLiquidations(true)
    try {
      // Crear el cliente Supabase
      const supabase = createClientComponentClient()

      // Cargar liquidaciones pendientes
      const { data: pending, error: pendingError } = await supabase
        .from("liquidations")
        .select(`
          id, 
          employee_id, 
          termination_date, 
          base_salary,
          proportional_vacation,
          proportional_bonus,
          compensation_amount,
          total_amount,
          version,
          previous_version_id,
          employees (
            id,
            first_name,
            last_name,
            status
          )
        `)
        .eq("is_paid", false)
        .order("termination_date", { ascending: false })

      if (pendingError) throw pendingError
      setPendingLiquidations(pending || [])

      // Cargar liquidaciones pagadas
      const { data: paid, error: paidError } = await supabase
        .from("liquidations")
        .select(`
          id, 
          employee_id, 
          termination_date, 
          payment_date,
          payment_method,
          total_amount,
          version,
          previous_version_id,
          employees (
            id,
            first_name,
            last_name
          )
        `)
        .eq("is_paid", true)
        .order("payment_date", { ascending: false })

      if (paidError) throw paidError
      setPaidLiquidations(paid || [])
    } catch (error) {
      console.error("Error al cargar liquidaciones:", error)
    } finally {
      setLoadingLiquidations(false)
    }
  }

  const handleGenerateLiquidations = async () => {
    setLoading(true)
    setResult(null) // Limpiar resultados anteriores

    try {
      console.log("Iniciando generación de liquidaciones automática...")

      const response = await fetch('/api/payroll/liquidation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      console.log("Resultado de generación:", result)

      if (!response.ok) {
        console.error("Error en respuesta:", response.status, result)
        // Intentar mostrar un mensaje más específico
        if (response.status === 401) {
          throw new Error("Error de autenticación. Por favor, recarga la página e intenta nuevamente.")
        }
        throw new Error(result.error || `Error HTTP: ${response.status}`)
      }

      setResult(result)

      if (result.success) {
        // Recargar liquidaciones siempre después de la generación
        await loadLiquidations()

        // Mostrar mensaje de éxito más claro
        if (result.generated === 0 && result.skipped > 0) {
          setResult({
            success: true,
            generated: result.generated,
            skipped: result.skipped,
            message: "No se encontraron empleados elegibles para liquidación o ya tienen liquidaciones generadas."
          })
        }
      }
    } catch (error) {
      console.error("Error al generar liquidaciones:", error)
      setResult({ 
        success: false, 
        error: `Error al generar liquidaciones: ${String(error)}` 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectLiquidation = (liquidationId: string) => {
    setSelectedLiquidations((prev) =>
      prev.includes(liquidationId) ? prev.filter((id) => id !== liquidationId) : [...prev, liquidationId],
    )
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLiquidations(pendingLiquidations.map((liq) => liq.id))
    } else {
      setSelectedLiquidations([])
    }
  }

  const handlePaymentSubmit = async () => {
    if (selectedLiquidations.length === 0) return

    setPaymentLoading(true)
    try {
      const result = await markLiquidationsAsPaid(selectedLiquidations, paymentDetails)

      if (result.success) {
        // Recargar liquidaciones
        await loadLiquidations()
        // Limpiar selección
        setSelectedLiquidations([])
        // Cerrar diálogo
        setPaymentDialogOpen(false)
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error("Error al procesar pago:", error)
      alert(`Error: ${error}`)
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleEditLiquidation = (liquidationId: string) => {
    router.push(`/nomina/liquidations/edit/${liquidationId}`)
  }

  const handleRegenerateLiquidation = async (liquidationId: string) => {
    try {
      setLoading(true)

      console.log(`Regenerando liquidación: ${liquidationId}`)

      const response = await fetch(`/api/payroll/liquidation/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ liquidationId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al regenerar liquidación')
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Liquidación regenerada",
          description: "Los cálculos han sido actualizados correctamente",
        })

        // Recargar los datos inmediatamente
        await loadLiquidations()
      } else {
        throw new Error(result.error || 'Error desconocido')
      }
    } catch (error) {
      console.error('Error regenerating liquidation:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo regenerar la liquidación",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const openRegenerateDialog = (liquidationId: string) => {
    setRegeneratingId(liquidationId)
    setRegenerateDialogOpen(true)
    setRegenerateResult(null)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Liquidaciones</h1>
          <p className="text-muted-foreground">
            Gestiona las liquidaciones de empleados que han finalizado su relación laboral
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerateLiquidations} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              "Generar Liquidaciones Automáticas"
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push("/nomina/liquidations/create")}
            disabled={loading}
          >
            Nueva Liquidación Manual
          </Button>
        </div>
      </div>

      {result && (
        <Alert variant={result.success ? "default" : "destructive"} className="mb-6">
          {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{result.success ? "Proceso Completado" : "Error en la Generación"}</AlertTitle>
          <AlertDescription>
            {result.success ? (
              <div className="space-y-1">
                <p>{result.message || `Se procesaron las liquidaciones automáticamente.`}</p>
                <p className="text-sm">
                  <strong>Generadas:</strong> {result.generated} | 
                  <strong> Actualizadas:</strong> {result.updated || 0} | 
                  <strong> Omitidas:</strong> {result.skipped || 0}
                </p>
                {result.generated > 0 && (
                  <p className="text-sm font-medium text-green-700">
                    Las nuevas liquidaciones aparecen en la pestaña "Pendientes" a continuación.
                  </p>
                )}
              </div>
            ) : (
              result.error
            )}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="paid">Pagadas</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Liquidaciones Pendientes de Pago</CardTitle>
              <CardDescription>
                Liquidaciones de empleados inactivos que han sido calculadas automáticamente y están pendientes de pago
              </CardDescription>
              {selectedLiquidations.length > 0 && (
                <div className="flex justify-end">
                  <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>Marcar como Pagadas ({selectedLiquidations.length})</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Registrar Pago de Liquidaciones</DialogTitle>
                        <DialogDescription>
                          Complete los detalles del pago para las {selectedLiquidations.length} liquidaciones
                          seleccionadas.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="payment_date" className="text-right">
                            Fecha de Pago
                          </Label>
                          <Input
                            id="payment_date"
                            type="date"
                            value={paymentDetails.payment_date}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, payment_date: e.target.value })}
                            className="col-span-3"
                          />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="payment_method" className="text-right">
                            Método de Pago
                          </Label>
                          <Select
                            value={paymentDetails.payment_method}
                            onValueChange={(value) => setPaymentDetails({ ...paymentDetails, payment_method: value })}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Seleccione método de pago" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Efectivo</SelectItem>
                              <SelectItem value="transfer">Transferencia</SelectItem>
                              <SelectItem value="check">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="payment_reference" className="text-right">
                            Referencia
                          </Label>
                          <Input
                            id="payment_reference"
                            value={paymentDetails.payment_reference}
                            onChange={(e) =>
                              setPaymentDetails({ ...paymentDetails, payment_reference: e.target.value })
                            }
                            placeholder="Número de transferencia, cheque, etc."
                            className="col-span-3"
                          />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="notes" className="text-right">
                            Notas
                          </Label>
                          <Textarea
                            id="notes"
                            value={paymentDetails.notes}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, notes: e.target.value })}
                            placeholder="Observaciones adicionales"
                            className="col-span-3"
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handlePaymentSubmit} disabled={paymentLoading}>
                          {paymentLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Procesando...
                            </>
                          ) : (
                            "Confirmar Pago"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {loadingLiquidations ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : pendingLiquidations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No hay liquidaciones pendientes</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            onCheckedChange={(checked: boolean) => handleSelectAll(checked)}
                            checked={
                              selectedLiquidations.length === pendingLiquidations.length &&
                              pendingLiquidations.length > 0
                            }
                          />
                        </TableHead>
                        <TableHead>Empleado</TableHead>
                        <TableHead>Fecha de Egreso</TableHead>
                        <TableHead>Salario Base</TableHead>
                        <TableHead>Vacaciones</TableHead>
                        <TableHead>Aguinaldo</TableHead>
                        <TableHead>Pago Último Mes</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="w-[150px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingLiquidations.map((liquidation) => (
                        <TableRow key={liquidation.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedLiquidations.includes(liquidation.id)}
                              onCheckedChange={() => handleSelectLiquidation(liquidation.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {liquidation.employees?.first_name} {liquidation.employees?.last_name}
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                LIQUIDACIÓN
                              </span>
                              {liquidation.version > 1 && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                                  v{liquidation.version}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {liquidation.termination_date
                              ? format(new Date(liquidation.termination_date), "dd/MM/yyyy")
                              : "-"}
                          </TableCell>
                          <TableCell>{formatCurrency(liquidation.base_salary)}</TableCell>
                          <TableCell>{formatCurrency(liquidation.proportional_vacation)}</TableCell>
                          <TableCell>{formatCurrency(liquidation.proportional_bonus)}</TableCell>
                          <TableCell>{formatCurrency(liquidation.compensation_amount)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(liquidation.total_amount)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="icon" asChild>
                                <a href={`/nomina/liquidations/${liquidation.id}`} target="_blank" rel="noreferrer">
                                  <FileText className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditLiquidation(liquidation.id)}
                                title="Editar liquidación"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openRegenerateDialog(liquidation.id)}
                                title="Regenerar liquidación"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid">
          <Card>
            <CardHeader>
              <CardTitle>Liquidaciones Pagadas</CardTitle>
              <CardDescription>
                Historial completo de liquidaciones que ya han sido abonadas a los empleados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLiquidations ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : paidLiquidations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No hay liquidaciones pagadas</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empleado</TableHead>
                        <TableHead>Fecha de Egreso</TableHead>
                        <TableHead>Fecha de Pago</TableHead>
                        <TableHead>Método de Pago</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="w-[100px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paidLiquidations.map((liquidation) => (
                        <TableRow key={liquidation.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {liquidation.employees?.first_name} {liquidation.employees?.last_name}
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                LIQUIDACIÓN
                              </span>
                              {liquidation.version > 1 && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                                  v{liquidation.version}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {liquidation.termination_date
                              ? format(new Date(liquidation.termination_date), "dd/MM/yyyy")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {liquidation.payment_date ? format(new Date(liquidation.payment_date), "dd/MM/yyyy") : "-"}
                          </TableCell>
                          <TableCell>
                            {liquidation.payment_method === "cash" && "Efectivo"}
                            {liquidation.payment_method === "transfer" && "Transferencia"}
                            {liquidation.payment_method === "check" && "Cheque"}
                            {!liquidation.payment_method && "-"}
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(liquidation.total_amount)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" asChild>
                              <a href={`/nomina/liquidations/${liquidation.id}`} target="_blank" rel="noreferrer">
                                <FileText className="h-4 w-4" />
                              </a>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de regeneración */}
      <Dialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerar Liquidación</DialogTitle>
            <DialogDescription>
              Esta acción regenerará la liquidación con los datos actuales del empleado. La liquidación anterior quedará
              en el historial.
            </DialogDescription>
          </DialogHeader>

          {regenerateResult && (
            <Alert variant={regenerateResult.success ? "default" : "destructive"} className="my-4">
              {regenerateResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{regenerateResult.success ? "Éxito" : "Error"}</AlertTitle>
              <AlertDescription>
                {regenerateResult.success ? "La liquidación ha sido regenerada correctamente." : regenerateResult.error}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenerateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegenerateLiquidation} disabled={regenerateLoading}>
              {regenerateLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Confirmar Regeneración"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}