"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { tusFacturasService, type TusFacturasCredentials } from "@/lib/tusfacturas-service"
import { Loader2, Save, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ConfiguracionFacturacionPage() {
  const { toast } = useToast()
  const [credentials, setCredentials] = useState<TusFacturasCredentials>({
    apitoken: "",
    apikey: "",
    usertoken: "",
  })
  const [puntoVenta, setPuntoVenta] = useState<number>(1)
  const [isSaving, setIsSaving] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  // Cargar credenciales guardadas al iniciar
  useEffect(() => {
    const savedCredentials = tusFacturasService.getCredentials()
    if (savedCredentials) {
      setCredentials(savedCredentials)
    }

    // Mostrar un mensaje de que las credenciales ya están configuradas
    toast({
      title: "Credenciales precargadas",
      description: "Las credenciales de TusFacturasAPP ya están configuradas y listas para usar.",
    })
  }, [toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePuntoVentaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10) || 1
    setPuntoVenta(value)
  }

  const handleSave = () => {
    setIsSaving(true)
    try {
      tusFacturasService.setCredentials(credentials)
      tusFacturasService.setPuntoVenta(puntoVenta)
      toast({
        title: "Configuración guardada",
        description: "Las credenciales de TusFacturasAPP han sido guardadas correctamente.",
      })
    } catch (error) {
      console.error("Error al guardar credenciales:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar las credenciales. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      // Guardar credenciales primero
      tusFacturasService.setCredentials(credentials)
      tusFacturasService.setPuntoVenta(puntoVenta)

      // Crear un cliente y comprobante de prueba
      const cliente = {
        documento_tipo: "DNI",
        condicion_iva: "CF",
        domicilio: "Av. Test 123",
        condicion_pago: "201",
        documento_nro: "11111111",
        razon_social: "Cliente de Prueba",
        provincia: "2",
        email: "test@example.com",
        envia_por_mail: "N" as const,
        rg5329: "N" as const,
      }

      const comprobante = {
        rubro: "Gastronomía",
        tipo: "FACTURA B",
        numero: 0,
        operacion: "V" as const,
        detalle: [
          {
            cantidad: 1,
            afecta_stock: "S" as const,
            actualiza_precio: "N" as const,
            bonificacion_porcentaje: 0,
            producto: {
              descripcion: "Producto de prueba",
              codigo: 1,
              lista_precios: "standard",
              leyenda: "",
              unidad_bulto: 1,
              alicuota: 21,
              actualiza_precio: "N" as const,
              rg5329: "N" as const,
              precio_unitario_sin_iva: 100,
            },
          },
        ],
        fecha: new Date()
          .toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
          .replace(/\//g, "/"),
        vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
          .replace(/\//g, "/"),
        rubro_grupo_contable: "Gastronomía",
        total: 121,
        cotizacion: 1,
        moneda: "PES",
        punto_venta: puntoVenta,
        tributos: [],
      }

      // Enviar solicitud de prueba
      const response = await tusFacturasService.generarFactura(cliente, comprobante)

      if (response.error) {
        setTestResult({
          success: false,
          message: `Error: ${response.errores?.join(", ") || "Error desconocido"}`,
        })
      } else {
        setTestResult({
          success: true,
          message: `Conexión exitosa. Resultado: ${response.resultado || "OK"}`,
        })
      }
    } catch (error) {
      console.error("Error al probar conexión:", error)
      setTestResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Configuración de Facturación Electrónica</h2>
        </div>

        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Credenciales Precargadas</AlertTitle>
          <AlertDescription className="text-green-700">
            Las credenciales de TusFacturasAPP ya están configuradas y listas para usar. No es necesario modificarlas a
            menos que cambien.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="credentials">
          <TabsList>
            <TabsTrigger value="credentials">Credenciales</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
            <TabsTrigger value="help">Ayuda</TabsTrigger>
          </TabsList>

          <TabsContent value="credentials">
            <Card>
              <CardHeader>
                <CardTitle>Credenciales de TusFacturasAPP</CardTitle>
                <CardDescription>
                  Configure las credenciales para conectarse a la API de facturación electrónica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apitoken">API Token</Label>
                  <Input
                    id="apitoken"
                    name="apitoken"
                    value={credentials.apitoken}
                    onChange={handleInputChange}
                    placeholder="Ingrese su API Token"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apikey">API Key</Label>
                  <Input
                    id="apikey"
                    name="apikey"
                    value={credentials.apikey}
                    onChange={handleInputChange}
                    placeholder="Ingrese su API Key"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usertoken">User Token</Label>
                  <Input
                    id="usertoken"
                    name="usertoken"
                    value={credentials.usertoken}
                    onChange={handleInputChange}
                    placeholder="Ingrese su User Token"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="puntoVenta">Punto de Venta</Label>
                  <Input
                    id="puntoVenta"
                    name="puntoVenta"
                    type="number"
                    value={puntoVenta}
                    onChange={handlePuntoVentaChange}
                    placeholder="Ingrese su Punto de Venta"
                  />
                  <p className="text-sm text-muted-foreground">
                    Punto de venta formateado: {puntoVenta.toString().padStart(5, "0")}
                  </p>
                </div>

                {testResult && (
                  <Alert variant={testResult.success ? "default" : "destructive"}>
                    {testResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <AlertTitle>{testResult.success ? "Conexión exitosa" : "Error de conexión"}</AlertTitle>
                    <AlertDescription>{testResult.message}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleTest} disabled={isTesting}>
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Probando...
                    </>
                  ) : (
                    "Probar conexión"
                  )}
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Facturación</CardTitle>
                <CardDescription>Configure los parámetros para la emisión de facturas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Próximamente</AlertTitle>
                  <AlertDescription>
                    La configuración avanzada de facturación estará disponible en futuras actualizaciones.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="help">
            <Card>
              <CardHeader>
                <CardTitle>Ayuda y Soporte</CardTitle>
                <CardDescription>Información sobre la integración con TusFacturasAPP</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">¿Cómo obtener las credenciales?</h3>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>
                      Crea una cuenta en{" "}
                      <a
                        href="https://www.tusfacturas.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        TusFacturasAPP
                      </a>
                    </li>
                    <li>Activa el plan API DEV para pruebas</li>
                    <li>Configura tu CUIT personal con un punto de venta irreal (Ej: 679)</li>
                    <li>Obtén las keys necesarias desde la plataforma web</li>
                  </ol>

                  <h3 className="text-lg font-medium">Consideraciones importantes</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Durante las pruebas, los comprobantes emitidos son ficticios y no se registran en AFIP/ARCA</li>
                    <li>
                      El plan API DEV permite emitir hasta 1.500 facturas electrónicas no válidas legalmente durante 1
                      mes
                    </li>
                    <li>Una vez finalizado el período de prueba, deberás seleccionar una suscripción API</li>
                  </ul>

                  <h3 className="text-lg font-medium">Soporte</h3>
                  <p>
                    Para más información, consulta la{" "}
                    <a
                      href="https://www.tusfacturas.app/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      documentación oficial de la API
                    </a>
                    .
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
