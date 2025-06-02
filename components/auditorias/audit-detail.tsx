"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface AuditDetailProps {
  audit: any
  categoryId?: string
  showAllCategories?: boolean
}

export function AuditDetail({ audit, categoryId, showAllCategories = false }: AuditDetailProps) {
  // Si se especifica una categoría, mostrar solo esa
  const categoriesToShow = categoryId ? audit.categories.filter((cat: any) => cat.id === categoryId) : audit.categories

  // Función para renderizar el badge de tipo
  const renderTypeBadge = (type) => {
    if (type === "rapida") {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Auditoría Rápida</Badge>
    } else {
      return <Badge className="bg-purple-100 text-purple-800 border-purple-300">Auditoría Detallada</Badge>
    }
  }

  // Función para mostrar el turno
  const getTurnoText = (shift) => {
    if (!shift) return "No especificado"
    switch (shift) {
      case "morning": return "Mañana"
      case "afternoon": return "Tarde"
      case "night": return "Noche"
      default: return shift
    }
  }

  return (
    <div className="space-y-6">
      {/* Tipo de auditoría */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Detalles de Auditoría</h3>
          <p className="text-sm text-muted-foreground">
            Turno: {getTurnoText(audit.shift)}
          </p>
        </div>
        {renderTypeBadge(audit.type || "detallada")}
      </div>

      {/* Resumen de categorías */}
      {!categoryId && (
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-medium">Resumen por Categorías</h3>
          <div className="space-y-3">
            {audit.categories.map((category: any) => (
              <div key={category.id} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{category.name}</span>
                  <span className="text-sm">
                    {category.score} / {category.maxScore} ({Math.round((category.score / category.maxScore) * 100)}%)
                  </span>
                </div>
                <Progress
                  value={(category.score / category.maxScore) * 100}
                  className="h-2"
                  indicatorClassName={
                    (category.score / category.maxScore) * 100 >= 80
                      ? "bg-green-500"
                      : (category.score / category.maxScore) * 100 >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detalles de las categorías */}
      {(showAllCategories || categoryId) && (
        <Accordion type="multiple" defaultValue={categoriesToShow.map((cat: any) => cat.id)}>
          {categoriesToShow.map((category: any) => (
            <AccordionItem key={category.id} value={category.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-1 justify-between items-center pr-4">
                  <span>{category.name}</span>
                  <span className="text-sm font-medium">
                    {category.score} / {category.maxScore} ({Math.round((category.score / category.maxScore) * 100)}%)
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {category.items.map((item: any) => (
                    <div key={item.id} className="border-b pb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-sm">
                          {item.score} / {item.maxScore}
                        </span>
                      </div>
                      <Progress
                        value={(item.score / item.maxScore) * 100}
                        className="h-1.5 mb-2"
                        indicatorClassName={
                          (item.score / item.maxScore) * 100 >= 80
                            ? "bg-green-500"
                            : (item.score / item.maxScore) * 100 >= 60
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }
                      />
                      {item.observations && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Observaciones:</p>
                          <p className="text-sm">{item.observations}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}