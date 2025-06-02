"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StockCountForm } from "@/components/stock/stock-count-form"
import { DecomisoForm } from "@/components/stock/decomiso-form"
import { StockEntryForm } from "@/components/stock/stock-entry-form"
import { SalesDataDisplay } from "@/components/stock/sales-data-display"
import { StockReconciliation } from "@/components/stock/stock-reconciliation"
import { AlertsDisplay } from "@/components/stock/alerts-display"
import { useToast } from "@/hooks/use-toast"
import { mockSalesData } from "@/lib/mock-data"

import { InitialSetupForm } from "@/components/stock/initial-setup-form"
import { EntryList } from "@/components/stock/entry-list"

export default function StockControlPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("stock-inicial")
  const [showInitialSetup, setShowInitialSetup] = useState(false)
  const [stockData, setStockData] = useState({
    inicial: null,
    ingresos: [],
    decomisos: [],
    ventas: null,
    cierre: null,
  })
  const [isClient, setIsClient] = useState(false)

  // Marcar cuando el componente está en el cliente
  useEffect(() => {
    setIsClient(true)

    // Intentar cargar datos guardados del localStorage
    const savedData = localStorage.getItem("stockControlData")
    if (savedData) {
      setStockData(JSON.parse(savedData))
    }

    // Cargar datos de ventas
    const savedSalesData = localStorage.getItem("testSalesData")
    if (savedSalesData) {
      setStockData((prev) => ({
        ...prev,
        ventas: JSON.parse(savedSalesData),
      }))
    } else {
      setStockData((prev) => ({
        ...prev,
        ventas: mockSalesData,
      }))
    }
  }, [])

  // Guardar cambios en localStorage cuando cambian los datos (solo en el cliente)
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("stockControlData", JSON.stringify(stockData))
    }
  }, [stockData, isClient])

  // Función para simular sincronización con Datalive
  const syncWithDatalive = () => {
    toast({
      title: "Sincronizando con Datalive",
      description: "Obteniendo datos de ventas actualizados...",
    })

    // Determinar el turno actual basado en la hora
    const hour = new Date().getHours()
    const currentShift = hour >= 6 && hour < 14 ? "mañana" : "tarde"

    // Intentar cargar datos de ventas personalizados
    let salesData

    if (isClient) {
      const savedSalesData = localStorage.getItem(`testSalesData_${currentShift}`)

      if (savedSalesData) {
        salesData = JSON.parse(savedSalesData)
      } else {
        // Si no hay datos guardados, usar los datos predeterminados según el turno
        try {
          const { getSalesDataByShift } = require("@/lib/test-sales-data")
          salesData = getSalesDataByShift(currentShift)
        } catch (error) {
          console.error("Error al cargar datos de ventas:", error)
          salesData = mockSalesData
        }
      }
    } else {
      salesData = mockSalesData
    }

    // Actualizar los datos de ventas
    setTimeout(() => {
      setStockData((prev) => ({
        ...prev,
        ventas: salesData,
      }))

      toast({
        title: "Sincronización completada",
        description: `Datos de ventas del turno de ${currentShift} actualizados correctamente`,
      })
    }, 1500)
  }

  // Función para avanzar al siguiente paso
  const goToNextStep = (currentStep) => {
    const steps = ["stock-inicial", "ingresos", "decomisos", "ventas", "stock-cierre", "reconciliacion"]
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setActiveTab(steps[currentIndex + 1])
    }
  }

  // Función para manejar múltiples registros de ingresos
  const handleStockEntrySubmit = (data) => {
    setStockData({ ...stockData, ingresos: [...stockData.ingresos, data] })
    toast({
      title: "Ingreso registrado",
      description: "El ingreso de mercadería ha sido registrado correctamente.",
    })
    // No avanzamos automáticamente para permitir múltiples registros
  }

  // Función para manejar múltiples registros de decomisos
  const handleDecomisoSubmit = (data) => {
    setStockData({ ...stockData, decomisos: [...stockData.decomisos, data] })
    toast({
      title: "Decomiso registrado",
      description: "El decomiso ha sido registrado correctamente.",
    })
    // No avanzamos automáticamente para permitir múltiples registros
  }

  // Función para eliminar un ingreso
  const handleDeleteIngreso = (index) => {
    const newIngresos = [...stockData.ingresos]
    newIngresos.splice(index, 1)
    setStockData({ ...stockData, ingresos: newIngresos })
    toast({
      title: "Ingreso eliminado",
      description: "El registro de ingreso ha sido eliminado correctamente.",
    })
  }

  // Función para eliminar un decomiso
  const handleDeleteDecomiso = (index) => {
    const newDecomisos = [...stockData.decomisos]
    newDecomisos.splice(index, 1)
    setStockData({ ...stockData, decomisos: newDecomisos })
    toast({
      title: "Decomiso eliminado",
      description: "El registro de decomiso ha sido eliminado correctamente.",
    })
  }

  // Función para reiniciar todos los datos
  const handleResetAllData = () => {
    if (confirm("¿Estás seguro de que deseas reiniciar todos los datos? Esta acción no se puede deshacer.")) {
      setStockData({
        inicial: null,
        ingresos: [],
        decomisos: [],
        ventas: stockData.ventas, // Mantener los datos de ventas
        cierre: null,
      })
      toast({
        title: "Datos reiniciados",
        description: "Todos los datos de control de stock han sido reiniciados.",
      })
      setActiveTab("stock-inicial")
    }
  }

  // Si estamos en el servidor o el componente acaba de montarse, mostrar un estado de carga
  if (!isClient) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Control de Stock y Anti-Robo</h1>
        </div>
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p>Cargando datos de control de stock...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Control de Stock y Anti-Robo</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => (window.location.href = "/stock-control/test-data")}>
            Datos de Prueba
          </Button>
          <Button onClick={syncWithDatalive}>Sincronizar con Datalive</Button>
          <Button variant="destructive" onClick={handleResetAllData}>
            Reiniciar Datos
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="configuracion-inicial">Config. Inicial</TabsTrigger>
          <TabsTrigger value="stock-inicial">Stock Inicial</TabsTrigger>
          <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
          <TabsTrigger value="decomisos">Decomisos</TabsTrigger>
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="stock-cierre">Stock Cierre</TabsTrigger>
          <TabsTrigger value="reconciliacion">Reconciliación</TabsTrigger>
        </TabsList>

        <TabsContent value="configuracion-inicial">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Inicial de Stock</CardTitle>
              <CardDescription>
                Configuración inicial de stock supervisada. Esta operación debe ser realizada por un encargado y
                validada por un supervisor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InitialSetupForm
                onSubmit={(data) => {
                  setStockData({ ...stockData, inicial: data })
                  toast({
                    title: "Configuración inicial completada",
                    description: "La configuración inicial de stock ha sido registrada correctamente.",
                  })
                  setActiveTab("stock-inicial")
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock-inicial">
          <Card>
            <CardHeader>
              <CardTitle>Stock Inicial</CardTitle>
              <CardDescription>
                Registra el stock inicial del turno. Este se comparará con el stock de cierre del turno anterior.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StockCountForm
                type="inicial"
                onSubmit={(data) => {
                  setStockData({ ...stockData, inicial: data })
                  goToNextStep("stock-inicial")
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ingresos">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Ingresos de Mercadería</CardTitle>
              <CardDescription>Registra los ingresos de mercadería durante el turno.</CardDescription>
            </CardHeader>
            <CardContent>
              <StockEntryForm onSubmit={handleStockEntrySubmit} />
            </CardContent>
          </Card>

          {stockData.ingresos.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Ingresos Registrados</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToNextStep("ingresos")}
                  disabled={stockData.ingresos.length === 0}
                >
                  Continuar
                </Button>
              </CardHeader>
              <CardContent>
                <EntryList entries={stockData.ingresos} type="ingresos" onDelete={handleDeleteIngreso} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="decomisos">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Decomisos</CardTitle>
              <CardDescription>
                Registra los productos decomisados durante el turno. Recuerda que el máximo aceptable es 1% de las
                unidades vendidas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DecomisoForm salesData={stockData.ventas} onSubmit={handleDecomisoSubmit} />
            </CardContent>
          </Card>

          {stockData.decomisos.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Decomisos Registrados</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToNextStep("decomisos")}
                  disabled={stockData.decomisos.length === 0}
                >
                  Continuar
                </Button>
              </CardHeader>
              <CardContent>
                <EntryList entries={stockData.decomisos} type="decomisos" onDelete={handleDeleteDecomiso} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ventas">
          <Card>
            <CardHeader>
              <CardTitle>Datos de Ventas</CardTitle>
              <CardDescription>
                Información de ventas obtenida de Datalive. Última sincronización: {new Date().toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stockData.ventas ? (
                <SalesDataDisplay salesData={stockData.ventas} onContinue={() => goToNextStep("ventas")} />
              ) : (
                <div className="text-center py-8">
                  <p className="mb-4">No hay datos de ventas disponibles. Sincroniza con Datalive para obtenerlos.</p>
                  <Button onClick={syncWithDatalive}>Sincronizar con Datalive</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock-cierre">
          <Card>
            <CardHeader>
              <CardTitle>Stock de Cierre</CardTitle>
              <CardDescription>
                Registra el stock final del turno. Este debe ser verificado por ambos encargados en el cambio de turno.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StockCountForm
                type="cierre"
                requireSecondaryUser={true}
                onSubmit={(data) => {
                  setStockData({ ...stockData, cierre: data })
                  goToNextStep("stock-cierre")
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reconciliacion">
          <Card>
            <CardHeader>
              <CardTitle>Reconciliación y Control Final</CardTitle>
              <CardDescription>
                Verificación final de stock y caja para detectar posibles discrepancias.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stockData.inicial && stockData.cierre && stockData.ventas ? (
                <StockReconciliation
                  stockData={stockData}
                  onComplete={() => {
                    toast({
                      title: "Control completado",
                      description: "Los datos han sido guardados y las alertas generadas si corresponde.",
                    })
                  }}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="mb-4">
                    Para realizar la reconciliación, necesitas completar el stock inicial, el stock de cierre y tener
                    datos de ventas.
                  </p>
                  {!stockData.inicial && (
                    <Button className="mx-2" onClick={() => setActiveTab("stock-inicial")}>
                      Ir a Stock Inicial
                    </Button>
                  )}
                  {!stockData.ventas && (
                    <Button className="mx-2" onClick={syncWithDatalive}>
                      Sincronizar Ventas
                    </Button>
                  )}
                  {!stockData.cierre && stockData.inicial && stockData.ventas && (
                    <Button className="mx-2" onClick={() => setActiveTab("stock-cierre")}>
                      Ir a Stock de Cierre
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <AlertsDisplay />
      </div>
    </div>
  )
}

