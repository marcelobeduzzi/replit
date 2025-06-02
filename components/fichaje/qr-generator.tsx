// components/fichaje/qr-generator.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Download, Printer } from 'lucide-react'
import { QRCodeSVG } from "qrcode.react" // Cambiado de QRCode a QRCodeSVG

// Datos simulados de empleados
const mockEmployees = [
  { id: "emp-1", name: "Juan Pérez", position: "Cajero", location: "BR Cabildo" },
  { id: "emp-2", name: "María López", position: "Cajera", location: "BR Carranza" },
  { id: "emp-3", name: "Carlos Rodríguez", position: "Cocinero", location: "BR Pacífico" },
  { id: "emp-4", name: "Ana Martínez", position: "Encargada", location: "BR Cabildo" },
  { id: "emp-5", name: "Roberto Fernández", position: "Cajero", location: "BR Local 4" },
]

export function QrGenerator() {
  const { toast } = useToast()
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [qrValue, setQrValue] = useState<string>("")
  const [qrSize, setQrSize] = useState<number>(256)

  const handleEmployeeChange = (employeeId: string) => {
    setSelectedEmployee(employeeId)

    // Generar el valor del QR (JSON con el ID del empleado)
    const qrData = { employeeId }
    setQrValue(JSON.stringify(qrData))
  }

  const handleDownload = () => {
    const canvas = document.getElementById("employee-qr-code") as HTMLCanvasElement
    if (!canvas) return

    const pngUrl = canvas.toDataURL("image/png")
    const downloadLink = document.createElement("a")
    downloadLink.href = pngUrl

    const employee = mockEmployees.find((emp) => emp.id === selectedEmployee)
    const fileName = employee ? `qr-${employee.name.toLowerCase().replace(/\s+/g, "-")}.png` : "employee-qr-code.png"

    downloadLink.download = fileName
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)

    toast({
      title: "Código QR descargado",
      description: `El código QR ha sido descargado como ${fileName}`,
    })
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo abrir la ventana de impresión. Verifica que no esté bloqueada por el navegador.",
      })
      return
    }

    const employee = mockEmployees.find((emp) => emp.id === selectedEmployee)

    // Crear contenido HTML para imprimir
    printWindow.document.write(`
      <html>
        <head>
          <title>Código QR - ${employee?.name || "Empleado"}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
            }
            .qr-container {
              margin: 20px auto;
              padding: 15px;
              border: 1px solid #ccc;
              border-radius: 8px;
              display: inline-block;
            }
            h1 {
              font-size: 18px;
              margin-bottom: 5px;
            }
            p {
              margin: 5px 0;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>${employee?.name || "Empleado"}</h1>
            <p>${employee?.position || "Posición"} - ${employee?.location || "Local"}</p>
            <div>
              <img src="${document.getElementById("employee-qr-code")?.toDataURL()}" alt="Código QR" />
            </div>
            <p>Escanea este código para registrar entrada/salida</p>
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()

    // Esperar a que la imagen se cargue antes de imprimir
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="employee-select">Seleccionar Empleado</Label>
        <Select value={selectedEmployee} onValueChange={handleEmployeeChange}>
          <SelectTrigger id="employee-select">
            <SelectValue placeholder="Seleccionar empleado" />
          </SelectTrigger>
          <SelectContent>
            {mockEmployees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.name} - {employee.location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {qrValue && (
        <div className="flex flex-col items-center space-y-4">
          <Card className="w-full max-w-xs mx-auto">
            <CardContent className="pt-6 flex flex-col items-center">
              <QRCodeSVG
                id="employee-qr-code"
                value={qrValue}
                size={qrSize}
                level="H"
                includeMargin={true}
              />
              <div className="mt-4 text-center">
                <p className="font-medium">{mockEmployees.find((emp) => emp.id === selectedEmployee)?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {mockEmployees.find((emp) => emp.id === selectedEmployee)?.position} -
                  {mockEmployees.find((emp) => emp.id === selectedEmployee)?.location}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Genera códigos QR únicos para cada empleado. Estos códigos pueden ser impresos y colocados en tarjetas de
            identificación o guardados en los teléfonos de los empleados.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default QrGenerator