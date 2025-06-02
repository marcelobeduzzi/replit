"use client"

import { useState } from "react"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export default function ProbarCalculosPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [payrollId, setPayrollId] = useState("")
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [results, setResults] = useState<any>(null)
  const { toast } = useToast()

  const handleFixSinglePayroll = async () => {
    if (!payrollId) {
      toast({
        title: "Error",
        description: "Por favor ingrese un ID de nómina válido",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/payroll/fix-deductions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payrollId }),
      })

      const data = await response.json()
      setResults(data)

      if (response.ok) {
        toast({
          title: "Éxito",
          description: `Se procesó la nómina correctamente. Arregladas: ${data.fixed}, Errores: ${data.errors}`,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al procesar la nómina",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar la solicitud",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFixPeriodPayrolls = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/payroll/fix-deductions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ month, year }),
      })

      const data = await response.json()
      setResults(data)

      if (response.ok) {
        toast({
          title: "Éxito",
          description: `Se procesaron ${data.total} nóminas. Arregladas: ${data.fixed}, Errores: ${data.errors}`,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al procesar las nóminas",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar la solicitud",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFixAllPayrolls = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/payroll/fix-deductions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      const data = await response.json()
      setResults(data)

      if (response.ok) {
        toast({
          title: "Éxito",
          description: `Se procesaron ${data.total} nóminas. Arregladas: ${data.fixed}, Errores: ${data.errors}`,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al procesar las nóminas",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar la solicitud",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Generar años para el selector (año actual y 5 años anteriores)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i)

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Probar Cálculos de Nómina</h2>
            <p className="text-muted-foreground">
              Herramienta para corregir los valores de deducciones y adiciones en las nóminas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Corregir Nómina Específica</CardTitle>
              <CardDescription>Ingrese el ID de la nómina que desea corregir</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payrollId">ID de Nómina</Label>
                  <Input
                    id="payrollId"
                    placeholder="Ej: 123e4567-e89b-12d3-a456-426614174000"
                    value={payrollId}
                    onChange={(e) => setPayrollId(e.target.value)}
                  />
                </div>
                <Button onClick={handleFixSinglePayroll} disabled={isLoading || !payrollId}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Corregir Nómina
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Corregir Nóminas por Período</CardTitle>
              <CardDescription>Seleccione el mes y año para corregir todas las nóminas de ese período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month">Mes</Label>
                    <Select value={month.toString()} onValueChange={(value) => setMonth(Number(value))}>
                      <SelectTrigger id="month">
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
                  <div className="space-y-2">
                    <Label htmlFor="year">Año</Label>
                    <Select value={year.toString()} onValueChange={(value) => setYear(Number(value))}>
                      <SelectTrigger id="year">
                        <SelectValue placeholder="Seleccionar año" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y} value={y.toString()}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleFixPeriodPayrolls} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Corregir Nóminas del Período
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Corregir Todas las Nóminas</CardTitle>
              <CardDescription>
                Corregir todas las nóminas en la base de datos (limitado a las 100 más recientes)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleFixAllPayrolls} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Corregir Todas las Nóminas
              </Button>
            </CardContent>
          </Card>

          {results && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados</CardTitle>
                <CardDescription>Resultados de la operación</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Total procesadas:</span> {results.total}
                  </p>
                  <p>
                    <span className="font-medium">Corregidas:</span> {results.fixed}
                  </p>
                  <p>
                    <span className="font-medium">Errores:</span> {results.errors}
                  </p>
                  {results.details && results.details.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Detalles:</h4>
                      <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                        <pre className="text-xs">{JSON.stringify(results.details, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
