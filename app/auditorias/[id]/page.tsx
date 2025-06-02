"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db } from "@/lib/db"
import { generateAuditReport } from "@/lib/export-utils"
import { ArrowLeft, Download, Printer } from "lucide-react"

export default function AuditDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [audit, setAudit] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("resumen")

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        setIsLoading(true)
        const auditData = await db.audits.findUnique({
          where: { id: params.id },
        })

        console.log("Datos de auditoría cargados:", auditData)

        // Asegurarse de que los datos estén completos
        if (auditData) {
          // Asegurarse de que categories sea un array
          if (!auditData.categories) {
            auditData.categories = []
          }

          // Asegurarse de que localName esté disponible
          if (!auditData.localName && auditData.local_name) {
            auditData.localName = auditData.local_name
          }

          // Asegurarse de que auditorName esté disponible
          if (!auditData.auditorName && auditData.auditor_name) {
            auditData.auditorName = auditData.auditor_name
          }

          // Si aún no hay auditorName, usar auditor
          if (!auditData.auditorName && auditData.auditor) {
            auditData.auditorName = auditData.auditor
          }
        }

        setAudit(auditData)
      } catch (error) {
        console.error("Error al cargar la auditoría:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAudit()
  }, [params.id])

  const handleExportPDF = () => {
    if (audit) {
      generateAuditReport(audit)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <DashboardLayout isLoading={true}>
        <div className="container mx-auto py-6">
          <p>Cargando datos de la auditoría...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!audit) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Auditoría no encontrada</h1>
            <Button variant="outline" onClick={() => router.push("/auditorias")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
          <p>No se pudo encontrar la auditoría solicitada.</p>
        </div>
      </DashboardLayout>
    )
  }

  // Formatear fecha
  const formattedDate = audit.date
    ? format(new Date(audit.date), "dd 'de' MMMM 'de' yyyy", { locale: es })
    : "Fecha desconocida"

  // Asegurarse de que categories sea un array
  const categories = Array.isArray(audit.categories) ? audit.categories : []

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Detalles de Auditoría</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={() => router.push("/auditorias")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Datos básicos de la auditoría</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Local</p>
                  <p className="text-lg font-medium">{audit.localName || audit.local_name || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha</p>
                  <p className="text-lg font-medium">{formattedDate}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Auditor</p>
                  <p className="text-lg font-medium">
                    {audit.auditorName || audit.auditor_name || audit.auditor || "No especificado"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Puntaje</p>
                  <p className="text-lg font-medium">
                    {audit.totalScore || 0} / {audit.maxScore || 0} ({audit.percentage || 0}%)
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Observaciones Generales</p>
                <p className="text-sm mt-1">
                  {audit.notes || audit.observations || audit.generalObservations || "Sin observaciones"}
                </p>
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Calificación General</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      (audit.percentage || 0) >= 80
                        ? "bg-green-500"
                        : (audit.percentage || 0) >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${audit.percentage || 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-right mt-1">{audit.percentage || 0}%</p>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Resultados por Categoría</CardTitle>
              <CardDescription>Desglose de puntajes por categoría</CardDescription>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-muted-foreground">No hay datos de categorías disponibles.</p>
              ) : (
                <div className="space-y-6">
                  {categories.map((category: any, index: number) => {
                    if (!category) return null

                    const categoryScore = category.score || 0
                    const categoryMaxScore = category.maxScore || 1 // Evitar división por cero
                    const percentage = Math.round((categoryScore / categoryMaxScore) * 100)

                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">{category.name || `Categoría ${index + 1}`}</h3>
                          <span className="text-sm">
                            {categoryScore} / {categoryMaxScore} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              percentage >= 80 ? "bg-green-500" : percentage >= 60 ? "bg-yellow-500" : "bg-red-500"
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detalle por Categorías</CardTitle>
            <CardDescription>Evaluación detallada de cada ítem</CardDescription>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <p className="text-muted-foreground">No hay datos detallados disponibles.</p>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-4">
                  <TabsTrigger value="resumen">Resumen</TabsTrigger>
                  {categories.map((category: any, index: number) => {
                    if (!category) return null
                    return (
                      <TabsTrigger key={index} value={`cat-${index}`}>
                        {category.name || `Categoría ${index + 1}`}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>

                <TabsContent value="resumen" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {categories.map((category: any, index: number) => {
                      if (!category) return null

                      const categoryScore = category.score || 0
                      const categoryMaxScore = category.maxScore || 1
                      const percentage = Math.round((categoryScore / categoryMaxScore) * 100)

                      return (
                        <Card key={index}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{category.name || `Categoría ${index + 1}`}</CardTitle>
                            <CardDescription>
                              {categoryScore} / {categoryMaxScore} puntos ({percentage}%)
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                              <div
                                className={`h-2 rounded-full ${
                                  percentage >= 80 ? "bg-green-500" : percentage >= 60 ? "bg-yellow-500" : "bg-red-500"
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>

                            {Array.isArray(category.items) && category.items.length > 0 ? (
                              <ul className="space-y-1 text-sm">
                                {category.items.map((item: any, itemIndex: number) => {
                                  if (!item) return null
                                  return (
                                    <li key={itemIndex} className="flex justify-between">
                                      <span>{item.name || `Ítem ${itemIndex + 1}`}</span>
                                      <span>
                                        {item.score || 0} / {item.maxScore || 0}
                                      </span>
                                    </li>
                                  )
                                })}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground">No hay ítems en esta categoría.</p>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </TabsContent>

                {categories.map((category: any, index: number) => {
                  if (!category) return null

                  return (
                    <TabsContent key={index} value={`cat-${index}`} className="space-y-6">
                      <h3 className="text-xl font-bold">{category.name || `Categoría ${index + 1}`}</h3>

                      {Array.isArray(category.items) && category.items.length > 0 ? (
                        <div className="space-y-6">
                          {category.items.map((item: any, itemIndex: number) => {
                            if (!item) return null

                            const itemScore = item.score || 0
                            const itemMaxScore = item.maxScore || 1
                            const itemPercentage = Math.round((itemScore / itemMaxScore) * 100)

                            return (
                              <div key={itemIndex} className="border-b pb-4">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="font-medium">{item.name || `Ítem ${itemIndex + 1}`}</h4>
                                  <span>
                                    {itemScore} / {itemMaxScore} ({itemPercentage}%)
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      itemPercentage >= 80
                                        ? "bg-green-500"
                                        : itemPercentage >= 60
                                          ? "bg-yellow-500"
                                          : "bg-red-500"
                                    }`}
                                    style={{ width: `${itemPercentage}%` }}
                                  ></div>
                                </div>
                                {item.observations && (
                                  <div className="mt-2">
                                    <p className="text-sm text-muted-foreground">Observaciones:</p>
                                    <p className="text-sm">{item.observations}</p>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No hay ítems en esta categoría.</p>
                      )}
                    </TabsContent>
                  )
                })}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}









