"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AutoReconcilePanel } from "./auto-reconcile-panel"
import { AnalisisConciliacion } from "./analisis-conciliacion"

interface ConciliationTabContentProps {
  stockDiscrepancies: any[]
  cashDiscrepancies: any[]
  reconciliationResults: any
  onRunReconciliation: () => void
  onSaveReconciliations: () => void
  isLoading: boolean
  date?: string
  localName?: string
}

export function ConciliationTabContent({
  stockDiscrepancies,
  cashDiscrepancies,
  reconciliationResults,
  onRunReconciliation,
  onSaveReconciliations,
  isLoading,
  date,
  localName,
}: ConciliationTabContentProps) {
  const [activeTab, setActiveTab] = useState("analysis")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid grid-cols-2">
        <TabsTrigger value="analysis">Análisis de Compensación</TabsTrigger>
        <TabsTrigger value="auto">Conciliación Automática</TabsTrigger>
      </TabsList>

      <TabsContent value="analysis">
        <AnalisisConciliacion
          stockDiscrepancies={stockDiscrepancies}
          cashDiscrepancies={cashDiscrepancies}
          fecha={date}
          local={localName}
        />
      </TabsContent>

      <TabsContent value="auto">
        <AutoReconcilePanel
          stockDiscrepancies={stockDiscrepancies}
          cashDiscrepancies={cashDiscrepancies}
          reconciliationResults={reconciliationResults}
          onRunReconciliation={onRunReconciliation}
          onSaveReconciliations={onSaveReconciliations}
          isLoading={isLoading}
        />
      </TabsContent>
    </Tabs>
  )
}