import { DashboardLayout } from "@/app/dashboard-layout"
import { GenerateDiscrepanciesContent } from "@/components/conciliacion/generate-discrepancies-content"

export default function GenerarDiscrepanciasPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Generación de Discrepancias</h1>
        <GenerateDiscrepanciesContent />
      </div>
    </DashboardLayout>
  )
}