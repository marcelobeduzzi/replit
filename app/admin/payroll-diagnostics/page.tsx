"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle, XCircle, Database, Calculator, RefreshCw, Code } from "lucide-react"
import { payrollService } from "@/lib/payroll-service"
import PayrollDiagnostics from "@/lib/payroll-diagnostics"

export default function PayrollDiagnosticsPage() {
  const [payrolls, setPayrolls] = useState<any[]>([])
  const [selectedPayrollId, setSelectedPayrollId] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>("structure")
  const [results, setResults] = useState<any>({
    structure: null,
    calculation: null,
    fixedValues: null,
    recalculate: null,
    sqlUpdate: null,
  })

  // Cargar nóminas al iniciar
  useEffect(() => {
    loadPayrolls()
  }, [])

  const loadPayrolls = async () => {
    try {
      setLoading(true)
      // Obtener el mes y año actual
      const now = new Date()
      const currentMonth = now.getMonth() + 1
      const currentYear = now.getFullYear()

      // Obtener las nóminas del mes actual
      const data = await payrollService.getPayrollsByPeriod(currentMonth, currentYear, false)
      setPayrolls(data)

      // Seleccionar la primera nómina por defecto
      if (data.length > 0 && !selectedPayrollId) {
        setSelectedPayrollId(data[0].id)
      }
    } catch (error) {
      console.error("Error al cargar nóminas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las nóminas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Ejecutar diagnóstico de estructura de tabla
  const runStructureCheck = async () => {
    try {
      setLoading(true)
      const result = await PayrollDiagnostics.checkPayrollTableStructure()
      setResults({ ...results, structure: result })
      toast({
        title: "Diagnóstico completado",
        description: "Verificación de estructura finalizada",
      })
    } catch (error) {
      console.error("Error en diagnóstico de estructura:", error)
      toast({
        title: "Error",
        description: "Error al verificar la estructura de la tabla",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Ejecutar diagnóstico de cálculo
  const runCalculationCheck = async () => {
    if (!selectedPayrollId) {
      toast({
        title: "Error",
        description: "Seleccione una nómina primero",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const result = await PayrollDiagnostics.diagnosticCalculateAdjustments(selectedPayrollId)
      setResults({ ...results, calculation: result })
      toast({
        title: "Diagnóstico completado",
        description: "Cálculo de ajustes finalizado",
      })
    } catch (error) {
      console.error("Error en diagnóstico de cálculo:", error)
      toast({
        title: "Error",
        description: "Error al calcular ajustes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Ejecutar prueba con valores fijos
  const runFixedValuesTest = async () => {
    if (!selectedPayrollId) {
      toast({
        title: "Error",
        description: "Seleccione una nómina primero",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const result = await PayrollDiagnostics.testUpdateWithFixedValues(selectedPayrollId)
      setResults({ ...results, fixedValues: result })
      toast({
        title: "Prueba completada",
        description: "Actualización con valores fijos finalizada",
      })
    } catch (error) {
      console.error("Error en prueba con valores fijos:", error)
      toast({
        title: "Error",
        description: "Error al actualizar con valores fijos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Ejecutar prueba de recálculo completo
  const runRecalculateTest = async () => {
    if (!selectedPayrollId) {
      toast({
        title: "Error",
        description: "Seleccione una nómina primero",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const result = await PayrollDiagnostics.testRecalculateAndSave(selectedPayrollId)
      setResults({ ...results, recalculate: result })
      toast({
        title: "Prueba completada",
        description: "Recálculo y guardado finalizado",
      })
    } catch (error) {
      console.error("Error en prueba de recálculo:", error)
      toast({
        title: "Error",
        description: "Error al recalcular y guardar",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Ejecutar prueba de SQL directo
  const runSqlTest = async () => {
    if (!selectedPayrollId) {
      toast({
        title: "Error",
        description: "Seleccione una nómina primero",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const result = await PayrollDiagnostics.testDirectSqlUpdate(selectedPayrollId)
      setResults({ ...results, sqlUpdate: result })
      toast({
        title: "Prueba completada",
        description: "Actualización SQL directa finalizada",
      })
    } catch (error) {
      console.error("Error en prueba SQL:", error)
      toast({
        title: "Error",
        description: "Error al ejecutar SQL directo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Diagnóstico de Nóminas</h1>
          <p className="text-muted-foreground">Herramientas para diagnosticar problemas con deducciones y adiciones</p>
        </div>
        <Button onClick={loadPayrolls} disabled={loading}>
          {loading ? "Cargando..." : "Actualizar"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Nómina</CardTitle>
            <CardDescription>Elija una nómina para diagnosticar</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedPayrollId}
              onValueChange={setSelectedPayrollId}
              disabled={loading || payrolls.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una nómina" />
              </SelectTrigger>
              <SelectContent>
                {payrolls.map((payroll) => (
                  <SelectItem key={payroll.id} value={payroll.id}>
                    {payroll.employeeName || `Empleado ${payroll.employeeId || payroll.employee_id}`} - {payroll.month}/
                    {payroll.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Estructura</CardTitle>
            <CardDescription>Verificar tabla</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={runStructureCheck} disabled={loading}>
              <Database className="mr-2 h-4 w-4" />
              Verificar Estructura
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Cálculos</CardTitle>
            <CardDescription>Probar cálculos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={runCalculationCheck}
              disabled={loading || !selectedPayrollId}
            >
              <Calculator className="mr-2 h-4 w-4" />
              Probar Cálculos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Guardado</CardTitle>
            <CardDescription>Probar guardado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={runFixedValuesTest}
              disabled={loading || !selectedPayrollId}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Valores Fijos
            </Button>
            <Button variant="outline" className="w-full" onClick={runSqlTest} disabled={loading || !selectedPayrollId}>
              <Code className="mr-2 h-4 w-4" />
              SQL Directo
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="structure">Estructura</TabsTrigger>
          <TabsTrigger value="calculation">Cálculos</TabsTrigger>
          <TabsTrigger value="fixedValues">Valores Fijos</TabsTrigger>
          <TabsTrigger value="recalculate">Recálculo</TabsTrigger>
          <TabsTrigger value="sqlUpdate">SQL Directo</TabsTrigger>
        </TabsList>

        {/* Pestaña de Estructura */}
        <TabsContent value="structure">
          <Card>
            <CardHeader>
              <CardTitle>Diagnóstico de Estructura</CardTitle>
              <CardDescription>Verifica la estructura de la tabla payroll</CardDescription>
            </CardHeader>
            <CardContent>
              {results.structure ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Campos Críticos</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <span className="mr-2">Campo deductions:</span>
                          {results.structure.hasDeductions ? (
                            <Badge variant="success" className="bg-green-100 text-green-800">
                              Existe
                            </Badge>
                          ) : (
                            <Badge variant="destructive">No existe</Badge>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className="mr-2">Campo additions:</span>
                          {results.structure.hasAdditions ? (
                            <Badge variant="success" className="bg-green-100 text-green-800">
                              Existe
                            </Badge>
                          ) : (
                            <Badge variant="destructive">No existe</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Campos Similares</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Posibles deducciones:</span>
                          {results.structure.possibleDeductionsFields.length > 0 ? (
                            <div className="mt-1">
                              {results.structure.possibleDeductionsFields.map((field: string) => (
                                <Badge key={field} className="mr-2 mb-2">
                                  {field}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground mt-1">No se encontraron campos similares</p>
                          )}
                        </div>
                        <div>
                          <span className="font-medium">Posibles adiciones:</span>
                          {results.structure.possibleAdditionsFields.length > 0 ? (
                            <div className="mt-1">
                              {results.structure.possibleAdditionsFields.map((field: string) => (
                                <Badge key={field} className="mr-2 mb-2">
                                  {field}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground mt-1">No se encontraron campos similares</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-2">Estructura Completa</h3>
                    <div className="bg-muted p-4 rounded-md overflow-auto max-h-60">
                      <pre className="text-xs">{JSON.stringify(results.structure.structure, null, 2)}</pre>
                    </div>
                  </div>

                  {results.structure.samplePayroll && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Muestra de Nómina</h3>
                      <div className="bg-muted p-4 rounded-md overflow-auto max-h-60">
                        <pre className="text-xs">{JSON.stringify(results.structure.samplePayroll, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Ejecute el diagnóstico de estructura para ver los resultados</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={runStructureCheck} disabled={loading}>
                {loading ? "Ejecutando..." : "Ejecutar Diagnóstico"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Pestaña de Cálculos */}
        <TabsContent value="calculation">
          <Card>
            <CardHeader>
              <CardTitle>Diagnóstico de Cálculos</CardTitle>
              <CardDescription>Verifica el cálculo de deducciones y adiciones</CardDescription>
            </CardHeader>
            <CardContent>
              {results.calculation ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Información de la Nómina</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Empleado:</span>
                          <p className="text-muted-foreground">
                            {results.calculation.employee.firstName} {results.calculation.employee.lastName}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Período:</span>
                          <p className="text-muted-foreground">
                            {results.calculation.payroll.month}/{results.calculation.payroll.year}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Registros de asistencia:</span>
                          <p className="text-muted-foreground">{results.calculation.attendances}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Resultados del Cálculo</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Deducciones calculadas:</span>
                          <p className="text-lg">{results.calculation.calculation.deductions}</p>
                        </div>
                        <div>
                          <span className="font-medium">Adiciones calculadas:</span>
                          <p className="text-lg">{results.calculation.calculation.additions}</p>
                        </div>
                        <div>
                          <span className="font-medium">Detalles generados:</span>
                          <p className="text-lg">{results.calculation.calculation.detailsCount}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {results.calculation.details && results.calculation.details.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-lg font-medium mb-2">Muestra de Detalles</h3>
                        <div className="space-y-2">
                          {results.calculation.details.map((detail: any, index: number) => (
                            <div key={index} className="bg-muted p-3 rounded-md">
                              <div className="flex justify-between">
                                <span className="font-medium">{detail.concept}</span>
                                <Badge variant={detail.type === "deduction" ? "destructive" : "default"}>
                                  {detail.type === "deduction" ? "Deducción" : "Adición"}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground text-sm">{detail.notes}</p>
                              <p className="text-right font-medium">
                                {detail.type === "deduction" ? "-" : "+"}
                                {detail.amount}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-2">Datos Completos</h3>
                    <div className="bg-muted p-4 rounded-md overflow-auto max-h-60">
                      <pre className="text-xs">{JSON.stringify(results.calculation, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Ejecute el diagnóstico de cálculos para ver los resultados</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={runCalculationCheck} disabled={loading || !selectedPayrollId}>
                {loading ? "Ejecutando..." : "Ejecutar Diagnóstico"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Pestaña de Valores Fijos */}
        <TabsContent value="fixedValues">
          <Card>
            <CardHeader>
              <CardTitle>Prueba con Valores Fijos</CardTitle>
              <CardDescription>Verifica si se pueden guardar valores fijos en la nómina</CardDescription>
            </CardHeader>
            <CardContent>
              {results.fixedValues ? (
                <div className="space-y-4">
                  <Alert
                    variant={
                      results.fixedValues.success.deductions && results.fixedValues.success.additions
                        ? "success"
                        : "destructive"
                    }
                  >
                    {results.fixedValues.success.deductions && results.fixedValues.success.additions ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>
                      {results.fixedValues.success.deductions && results.fixedValues.success.additions
                        ? "Prueba exitosa"
                        : "Prueba fallida"}
                    </AlertTitle>
                    <AlertDescription>
                      {results.fixedValues.success.deductions && results.fixedValues.success.additions
                        ? "Los valores se guardaron correctamente"
                        : "Los valores no se guardaron correctamente"}
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Valores Originales</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Deducciones:</span>
                          <p className="text-lg">{results.fixedValues.before.deductions}</p>
                        </div>
                        <div>
                          <span className="font-medium">Adiciones:</span>
                          <p className="text-lg">{results.fixedValues.before.additions}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Valores de Prueba</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Deducciones:</span>
                          <p className="text-lg">{results.fixedValues.testValues.deductions}</p>
                        </div>
                        <div>
                          <span className="font-medium">Adiciones:</span>
                          <p className="text-lg">{results.fixedValues.testValues.additions}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Valores Guardados</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Deducciones:</span>
                          <p className="text-lg">{results.fixedValues.after.deductions}</p>
                          {results.fixedValues.success.deductions ? (
                            <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="ml-2 h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Adiciones:</span>
                          <p className="text-lg">{results.fixedValues.after.additions}</p>
                          {results.fixedValues.success.additions ? (
                            <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="ml-2 h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-2">Datos Completos</h3>
                    <div className="bg-muted p-4 rounded-md overflow-auto max-h-60">
                      <pre className="text-xs">{JSON.stringify(results.fixedValues, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Ejecute la prueba con valores fijos para ver los resultados</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={runFixedValuesTest} disabled={loading || !selectedPayrollId}>
                {loading ? "Ejecutando..." : "Ejecutar Prueba"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Pestaña de Recálculo */}
        <TabsContent value="recalculate">
          <Card>
            <CardHeader>
              <CardTitle>Prueba de Recálculo</CardTitle>
              <CardDescription>Verifica el proceso completo de recálculo y guardado</CardDescription>
            </CardHeader>
            <CardContent>
              {results.recalculate ? (
                <div className="space-y-4">
                  <Alert
                    variant={
                      results.recalculate.changed.deductions || results.recalculate.changed.additions
                        ? "success"
                        : "default"
                    }
                  >
                    {results.recalculate.changed.deductions || results.recalculate.changed.additions ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>
                      {results.recalculate.changed.deductions || results.recalculate.changed.additions
                        ? "Valores actualizados"
                        : "Sin cambios"}
                    </AlertTitle>
                    <AlertDescription>
                      {results.recalculate.changed.deductions || results.recalculate.changed.additions
                        ? "Los valores se recalcularon y guardaron correctamente"
                        : "No hubo cambios en los valores recalculados"}
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Valores Antes</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Deducciones:</span>
                          <p className="text-lg">{results.recalculate.before.deductions}</p>
                        </div>
                        <div>
                          <span className="font-medium">Adiciones:</span>
                          <p className="text-lg">{results.recalculate.before.additions}</p>
                        </div>
                        <div>
                          <span className="font-medium">Salario Final en Mano:</span>
                          <p className="text-lg">{results.recalculate.before.finalHandSalary}</p>
                        </div>
                        <div>
                          <span className="font-medium">Salario Total:</span>
                          <p className="text-lg">{results.recalculate.before.totalSalary}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Valores Después</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Deducciones:</span>
                          <p className="text-lg">{results.recalculate.after.deductions}</p>
                          {results.recalculate.changed.deductions ? (
                            <Badge className="ml-2 bg-yellow-100 text-yellow-800">Cambió</Badge>
                          ) : null}
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Adiciones:</span>
                          <p className="text-lg">{results.recalculate.after.additions}</p>
                          {results.recalculate.changed.additions ? (
                            <Badge className="ml-2 bg-yellow-100 text-yellow-800">Cambió</Badge>
                          ) : null}
                        </div>
                        <div>
                          <span className="font-medium">Salario Final en Mano:</span>
                          <p className="text-lg">{results.recalculate.after.finalHandSalary}</p>
                        </div>
                        <div>
                          <span className="font-medium">Salario Total:</span>
                          <p className="text-lg">{results.recalculate.after.totalSalary}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-2">Datos Completos</h3>
                    <div className="bg-muted p-4 rounded-md overflow-auto max-h-60">
                      <pre className="text-xs">{JSON.stringify(results.recalculate, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Ejecute la prueba de recálculo para ver los resultados</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={runRecalculateTest} disabled={loading || !selectedPayrollId}>
                {loading ? "Ejecutando..." : "Ejecutar Prueba"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Pestaña de SQL Directo */}
        <TabsContent value="sqlUpdate">
          <Card>
            <CardHeader>
              <CardTitle>Prueba de SQL Directo</CardTitle>
              <CardDescription>Verifica la actualización directa mediante SQL</CardDescription>
            </CardHeader>
            <CardContent>
              {results.sqlUpdate ? (
                <div className="space-y-4">
                  <Alert
                    variant={
                      results.sqlUpdate.success.deductions && results.sqlUpdate.success.additions
                        ? "success"
                        : "destructive"
                    }
                  >
                    {results.sqlUpdate.success.deductions && results.sqlUpdate.success.additions ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>
                      {results.sqlUpdate.success.deductions && results.sqlUpdate.success.additions
                        ? "Prueba exitosa"
                        : "Prueba fallida"}
                    </AlertTitle>
                    <AlertDescription>
                      {results.sqlUpdate.success.deductions && results.sqlUpdate.success.additions
                        ? "Los valores se guardaron correctamente mediante SQL directo"
                        : "Los valores no se guardaron correctamente mediante SQL directo"}
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Valores Originales</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Deducciones:</span>
                          <p className="text-lg">{results.sqlUpdate.before.deductions}</p>
                        </div>
                        <div>
                          <span className="font-medium">Adiciones:</span>
                          <p className="text-lg">{results.sqlUpdate.before.additions}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Valores de Prueba</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Deducciones:</span>
                          <p className="text-lg">{results.sqlUpdate.testValues.deductions}</p>
                        </div>
                        <div>
                          <span className="font-medium">Adiciones:</span>
                          <p className="text-lg">{results.sqlUpdate.testValues.additions}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Valores Guardados</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Deducciones:</span>
                          <p className="text-lg">{results.sqlUpdate.after.deductions}</p>
                          {results.sqlUpdate.success.deductions ? (
                            <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="ml-2 h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Adiciones:</span>
                          <p className="text-lg">{results.sqlUpdate.after.additions}</p>
                          {results.sqlUpdate.success.additions ? (
                            <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="ml-2 h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-2">Resultado SQL</h3>
                    <div className="bg-muted p-4 rounded-md overflow-auto max-h-60">
                      <pre className="text-xs">{JSON.stringify(results.sqlUpdate.sqlResult, null, 2)}</pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Datos Completos</h3>
                    <div className="bg-muted p-4 rounded-md overflow-auto max-h-60">
                      <pre className="text-xs">{JSON.stringify(results.sqlUpdate, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Ejecute la prueba de SQL directo para ver los resultados</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={runSqlTest} disabled={loading || !selectedPayrollId}>
                {loading ? "Ejecutando..." : "Ejecutar Prueba"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
