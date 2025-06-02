"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"

export function QrScanner() {
  const { toast } = useToast()
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<null | {
    employeeId: string
    employeeName: string
    timestamp: string
    type: "entrada" | "salida"
  }>(null)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null)

  // Obtener la geolocalización al cargar el componente
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
          setLocationError(null)
        },
        (error) => {
          console.error("Error getting location:", error)
          setLocationError("No se pudo obtener la ubicación. Por favor, habilita los permisos de ubicación.")
        },
      )
    } else {
      setLocationError("Tu navegador no soporta geolocalización")
    }
  }, [])

  // Inicializar el escáner QR
  useEffect(() => {
    const qrCodeScanner = new Html5Qrcode("qr-reader")
    setHtml5QrCode(qrCodeScanner)

    return () => {
      if (qrCodeScanner.isScanning) {
        qrCodeScanner.stop().catch((error) => console.error("Error stopping scanner:", error))
      }
    }
  }, [])

  const startScanner = () => {
    if (!html5QrCode) return

    setScanning(true)
    setError(null)
    setScanResult(null)

    const qrConfig = { fps: 10, qrbox: { width: 250, height: 250 } }

    html5QrCode.start({ facingMode: "environment" }, qrConfig, onScanSuccess, onScanFailure).catch((err) => {
      console.error("Error starting scanner:", err)
      setError("No se pudo iniciar la cámara. Verifica los permisos.")
      setScanning(false)
    })
  }

  const stopScanner = () => {
    if (html5QrCode && html5QrCode.isScanning) {
      html5QrCode.stop().catch((error) => console.error("Error stopping scanner:", error))
      setScanning(false)
    }
  }

  const onScanSuccess = async (decodedText: string) => {
    // Detener el escáner después de un escaneo exitoso
    stopScanner()

    try {
      // Decodificar el QR (formato esperado: JSON con employeeId)
      const qrData = JSON.parse(decodedText)

      if (!qrData.employeeId) {
        throw new Error("Código QR inválido")
      }

      // Verificar si tenemos la ubicación
      if (!location) {
        throw new Error("No se pudo obtener la ubicación. Intenta nuevamente.")
      }

      // Determinar si es entrada o salida basado en la última acción del empleado
      // En un caso real, esto vendría de una consulta a la base de datos
      const lastAction = await getLastAction(qrData.employeeId)
      const currentAction = lastAction === "entrada" ? "salida" : "entrada"

      // Registrar el fichaje
      const result = await registerClockAction({
        employeeId: qrData.employeeId,
        action: currentAction,
        latitude: location.latitude,
        longitude: location.longitude,
      })

      // Mostrar resultado
      setScanResult({
        employeeId: qrData.employeeId,
        employeeName: result.employeeName,
        timestamp: new Date().toLocaleString(),
        type: currentAction,
      })

      toast({
        title: `${currentAction.charAt(0).toUpperCase() + currentAction.slice(1)} registrada`,
        description: `${result.employeeName} - ${new Date().toLocaleTimeString()}`,
      })
    } catch (err) {
      console.error("Error processing QR:", err)
      setError(err instanceof Error ? err.message : "Error al procesar el código QR")

      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Error al procesar el código QR",
      })
    }
  }

  const onScanFailure = (error: string) => {
    // No hacemos nada en caso de error de escaneo, ya que es normal mientras se busca un QR
    console.log("QR scan error:", error)
  }

  // Función simulada para obtener la última acción del empleado
  const getLastAction = async (employeeId: string): Promise<"entrada" | "salida"> => {
    // Simular una llamada a la API
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulamos que la última acción fue entrada o salida aleatoriamente
        // En un caso real, esto vendría de la base de datos
        const actions: ["entrada", "salida"] = ["entrada", "salida"]
        resolve(actions[Math.floor(Math.random() * actions.length)])
      }, 500)
    })
  }

  // Función simulada para registrar el fichaje
  const registerClockAction = async (data: {
    employeeId: string
    action: "entrada" | "salida"
    latitude: number
    longitude: number
  }) => {
    // Simular una llamada a la API
    return new Promise<{ success: boolean; employeeName: string }>((resolve) => {
      setTimeout(() => {
        // En un caso real, aquí se haría la llamada a la API para registrar el fichaje
        console.log("Registrando fichaje:", data)

        // Simulamos obtener el nombre del empleado
        const employeeNames: Record<string, string> = {
          "emp-1": "Juan Pérez",
          "emp-2": "María López",
          "emp-3": "Carlos Rodríguez",
          default: "Empleado",
        }

        resolve({
          success: true,
          employeeName: employeeNames[data.employeeId] || employeeNames.default,
        })
      }, 1000)
    })
  }

  return (
    <div className="space-y-4">
      {locationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de ubicación</AlertTitle>
          <AlertDescription>{locationError}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {scanResult && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">
            {scanResult.type === "entrada" ? "Entrada registrada" : "Salida registrada"}
          </AlertTitle>
          <AlertDescription className="text-green-700">
            {scanResult.employeeName} - {scanResult.timestamp}
          </AlertDescription>
        </Alert>
      )}

      <div id="qr-reader" className="w-full max-w-sm mx-auto"></div>

      <div className="flex justify-center gap-4">
        {!scanning ? (
          <Button onClick={startScanner} disabled={!!locationError}>
            Iniciar escáner
          </Button>
        ) : (
          <Button variant="outline" onClick={stopScanner}>
            {scanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Detener escáner
              </>
            ) : (
              "Detener escáner"
            )}
          </Button>
        )}
      </div>

      <Card className="mt-4">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Escanea el código QR del empleado para registrar su entrada o salida. El sistema determinará automáticamente
            si es una entrada o salida basándose en la última acción registrada.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

