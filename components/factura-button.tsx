"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { tusFacturasService } from "@/lib/tusfacturas-service"
import { Receipt, Loader2, Download, Settings } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

interface FacturaButtonProps {
  venta: any // Tipo de la venta
  onSuccess?: (facturaData: any) => void
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export function FacturaButton({ venta, onSuccess, className, variant = "outline" }: FacturaButtonProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    data?: any
  } | null>(null)
  const [showCredentialsError, setShowCredentialsError] = useState(false)

  // Verificar credenciales al cargar el componente
  console.log("FacturaButton - Credenciales actuales:", tusFacturasService.getCredentials())

  // Nuevos estados para los datos del cliente
  const [clienteData, setClienteData] = useState({
    documento_tipo: "DNI",
    condicion_iva: "CF", // Consumidor Final por defecto
    documento_nro: venta.customerDocument || venta.cliente?.documento || "11111111",
    razon_social: venta.customerName || venta.cliente?.nombre || "Consumidor Final",
  })

  // Nuevo estado para el tipo de comprobante
  const [tipoComprobante, setTipoComprobante] = useState("FACTURA B")

  const handleGenerarFactura = async () => {
    console.log("Iniciando generación de factura")

    // Verificar credenciales antes de continuar
    const hasCredentials = tusFacturasService.hasCredentials()
    console.log("¿Tiene credenciales?", hasCredentials)

    if (!hasCredentials) {
      console.log("No hay credenciales configuradas, mostrando error")
      setShowCredentialsError(true)
      toast({
        title: "Error de configuración",
        description: "No se han configurado las credenciales para TusFacturasAPP. Vaya a Configuración > Facturación.",
        variant: "destructive",
      })
      return
    }

    // Validar que el número de documento sea válido cuando es DNI
    if (clienteData.documento_tipo === "DNI" && (clienteData.documento_nro === "0" || !clienteData.documento_nro)) {
      toast({
        title: "Error de validación",
        description: "Para DNI, el número de documento debe ser mayor a cero",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setResult(null)

    try {
      // Convertir la venta al formato de TusFacturas
      const { cliente, comprobante } = tusFacturasService.convertirVentaAFactura(venta)

      // Sobrescribir con los datos actualizados del cliente
      cliente.documento_tipo = clienteData.documento_tipo
      cliente.condicion_iva = clienteData.condicion_iva
      cliente.documento_nro = clienteData.documento_nro
      cliente.razon_social = clienteData.razon_social

      // Sobrescribir el tipo de comprobante
      comprobante.tipo = tipoComprobante

      // Mostrar los datos que se enviarán
      console.log("Datos que se enviarán a TusFacturasAPP:", { cliente, comprobante })

      // Generar la factura
      const response = await tusFacturasService.generarFactura(cliente, comprobante)

      // Mostrar la respuesta completa
      console.log("Respuesta completa de TusFacturasAPP:", response)

      if (response.error) {
        setResult({
          success: false,
          message: `Error al generar factura: ${response.errores?.join(", ") || "Error desconocido"}`,
        })

        toast({
          title: "Error al generar factura",
          description: response.errores?.join(", ") || "Error desconocido",
          variant: "destructive",
        })
      } else {
        setResult({
          success: true,
          message: `Factura generada correctamente. ${
            response.cae ? `CAE: ${response.cae}` : "Comprobante de prueba (sin CAE)"
          }`,
          data: response,
        })

        toast({
          title: "Factura generada correctamente",
          description: response.cae ? `CAE: ${response.cae}` : "Comprobante de prueba generado con éxito",
        })

        // Llamar al callback de éxito si existe
        if (onSuccess) {
          onSuccess(response)
        }
      }
    } catch (error) {
      console.error("Error al generar factura:", error)
      setResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
      })

      toast({
        title: "Error",
        description: `Error al generar factura: ${error instanceof Error ? error.message : "Error desconocido"}`,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGoToConfig = () => {
    setOpen(false)
    setShowCredentialsError(false)
    router.push("/configuracion/facturacion")
  }

  return (
    <>
      {/* Botón simple que abre el diálogo */}
      <Button
        variant={variant}
        className={className}
        onClick={() => {
          console.log("Botón Generar Factura clickeado")
          setOpen(true)
          setResult(null)
          setShowCredentialsError(false)
        }}
      >
        <Receipt className="mr-2 h-4 w-4" />
        Generar Factura
      </Button>

      {/* Diálogo separado */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generar Factura Electrónica</DialogTitle>
            <DialogDescription>
              Complete los datos para generar la factura electrónica a través de TusFacturasAPP.
            </DialogDescription>
          </DialogHeader>

          {showCredentialsError ? (
            <div className="py-6">
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error de configuración</AlertTitle>
                <AlertDescription>
                  No se han configurado las credenciales para TusFacturasAPP. Es necesario configurarlas antes de poder
                  generar facturas.
                </AlertDescription>
              </Alert>

              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleGoToConfig}>
                  <Settings className="mr-2 h-4 w-4" />
                  Ir a Configuración
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-4">
              <div className="space-y-4">
                {/* Formulario de datos del cliente */}
                <div className="space-y-4 border p-3 rounded-md">
                  <h3 className="text-sm font-medium">Datos del Cliente</h3>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="documento_tipo">Tipo de Documento</Label>
                      <Select
                        value={clienteData.documento_tipo}
                        onValueChange={(value) => setClienteData({ ...clienteData, documento_tipo: value })}
                      >
                        <SelectTrigger id="documento_tipo">
                          <SelectValue placeholder="Tipo de documento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DNI">DNI</SelectItem>
                          <SelectItem value="CUIT">CUIT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="documento_nro">Número de Documento</Label>
                      <Input
                        id="documento_nro"
                        value={clienteData.documento_nro}
                        onChange={(e) => setClienteData({ ...clienteData, documento_nro: e.target.value })}
                        placeholder="Ingrese número"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="razon_social">Nombre/Razón Social</Label>
                    <Input
                      id="razon_social"
                      value={clienteData.razon_social}
                      onChange={(e) => setClienteData({ ...clienteData, razon_social: e.target.value })}
                      placeholder="Nombre del cliente"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="condicion_iva">Condición IVA</Label>
                    <Select
                      value={clienteData.condicion_iva}
                      onValueChange={(value) => setClienteData({ ...clienteData, condicion_iva: value })}
                    >
                      <SelectTrigger id="condicion_iva">
                        <SelectValue placeholder="Condición IVA" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CF">Consumidor Final</SelectItem>
                        <SelectItem value="RI">Responsable Inscripto</SelectItem>
                        <SelectItem value="EX">Exento</SelectItem>
                        <SelectItem value="MO">Monotributo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tipo de comprobante */}
                <div className="space-y-2">
                  <Label htmlFor="tipo_comprobante">Tipo de Comprobante</Label>
                  <Select value={tipoComprobante} onValueChange={setTipoComprobante}>
                    <SelectTrigger id="tipo_comprobante">
                      <SelectValue placeholder="Tipo de comprobante" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FACTURA B">Factura B</SelectItem>
                      <SelectItem value="FACTURA C">Factura C</SelectItem>
                      <SelectItem value="FACTURA A">Factura A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Total</p>
                    <p className="text-sm font-bold">${(venta.totalAmount || venta.total || 0).toFixed(2)}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Punto de Venta</p>
                    <Badge variant="outline">{tusFacturasService.getPuntoVentaFormateado()}</Badge>
                  </div>
                </div>

                <Separator />

                {result && (
                  <Alert variant={result.success ? "default" : "destructive"}>
                    {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
                    <AlertDescription>{result.message}</AlertDescription>
                  </Alert>
                )}

                {result?.success && result?.data?.comprobante_nro && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm font-medium text-green-800">Comprobante Nº: {result.data.comprobante_nro}</p>
                    {result.data.cae && (
                      <>
                        <p className="text-sm text-green-700">CAE: {result.data.cae}</p>
                        <p className="text-sm text-green-700">Vencimiento CAE: {result.data.vencimiento_cae}</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {!showCredentialsError && (
            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cerrar
              </Button>
              {!result?.success ? (
                <Button onClick={handleGenerarFactura} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    "Generar Factura"
                  )}
                </Button>
              ) : (
                <Button variant="outline" disabled={!result?.data?.comprobante_nro}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar PDF
                </Button>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
