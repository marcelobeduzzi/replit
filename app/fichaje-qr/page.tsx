"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrScanner } from "@/components/fichaje/qr-scanner"
import { QrGenerator } from "@/components/fichaje/qr-generator"
import { ClockHistory } from "@/components/fichaje/clock-history"

export default function FichajeQrPage() {
  const [activeTab, setActiveTab] = useState("scan")

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Fichaje QR</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scan">Escanear QR</TabsTrigger>
          <TabsTrigger value="generate">Generar QR</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Escanear Código QR</CardTitle>
              <CardDescription>Escanea el código QR del empleado para registrar entrada o salida</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <QrScanner />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generar Códigos QR</CardTitle>
              <CardDescription>Genera códigos QR para los empleados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <QrGenerator />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Fichajes</CardTitle>
              <CardDescription>Consulta el historial de fichajes por QR</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ClockHistory />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

