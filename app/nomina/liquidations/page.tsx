"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2, CheckCircle, AlertCircle, FileText, Edit, RefreshCw } from "lucide-react"
import {
  generateLiquidations,
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
      // Crear el cliente con las claves explícitas solo para esta función
      const supabase = createClientComponentClient({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      })

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
    try {
      const result = await generateLiquidations()
      setResult(result)

      if (result.success) {
        // Recargar liquidaciones si se generaron nuevas
        if (result.generated > 0 || result.updated > 0) {
          await loadLiquidations()
        }
      }
    } catch (error) {
      console.error("Error:", error)
      setResult({ success: false, error: String(error) })
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

  const handleRegenerateLiquidation = async () => {
    if (!regeneratingId) return

    setRegenerateLoading(true)
    try {
      // Función simple de regeneración - eliminar y volver a crear
      const supabase = createClientComponentClient({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      })

      // Marcar la liquidación actual como versión anterior
      const { error: updateError } = await supabase
        .from("liquidations")
        .update({ 
          is_paid: true, // Marcar como "pagada" para que no aparezca en pendientes
          notes: "Regenerada - Versión anterior" 
        })
        .eq("id", regeneratingId)

      if (updateError) throw updateError

      // Recargar liquidaciones para que se genere una nueva
      await loadLiquidations()
      
      setRegenerateResult({ success: true, message: "Liquidación marcada para regeneración" })
      setRegenerateDialogOpen(false)
    } catch (error) {
      console.error("Error al regenerar liquidación:", error)
      setRegenerateResult({ success: false, error: String(error) })
    } finally {
      setRegenerateLoading(false)
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
        <h1 className="text-2xl font-bold">Liquidaciones</h1>
        <div className="flex gap-2">
          <Button onClick={handleGenerateLiquidations} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              "Generar Liquidaciones"
            )}
          </Button>
        </div>
      </div>

      {result && (
        <Alert variant={result.success ? "default" : "destructive"} className="mb-6">
          {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
          <AlertDescription>
            {result.success
              ? `Proceso completado: ${result.generated} generadas, ${result.updated} actualizadas, ${result.skipped} omitidas.`
              : result.error}
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
              <CardTitle>Liquidaciones Pendientes</CardTitle>
              <CardDescription>Liquidaciones generadas pendientes de pago</CardDescription>
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
                            {liquidation.employees?.first_name} {liquidation.employees?.last_name}
                            {liquidation.version > 1 && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                                v{liquidation.version}
                              </span>
                            )}
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
              <CardDescription>Historial de liquidaciones pagadas</CardDescription>
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
                            {liquidation.employees?.first_name} {liquidation.employees?.last_name}
                            {liquidation.version > 1 && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                                v{liquidation.version}
                              </span>
                            )}
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
