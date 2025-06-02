import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { StockSheetDetails } from "./stock-sheet-details"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardLayout } from "@/components/dashboard-layout"

interface StockSheetPageProps {
  params: {
    id: string
  }
}

export default function StockSheetPage({ params }: StockSheetPageProps) {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Detalles de Planilla de Stock</h1>
          <Button variant="outline" asChild>
            <Link href="/stock-check">Volver</Link>
          </Button>
        </div>

        <Suspense fallback={<StockSheetDetailsSkeleton />}>
          <StockSheetDetails id={params.id} />
        </Suspense>
      </div>
    </DashboardLayout>
  )
}

function StockSheetDetailsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <div className="rounded-lg border">
        <div className="p-4">
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="p-4">
          {Array(3)
            .fill(null)
            .map((_, i) => (
              <Skeleton key={i} className="h-12 w-full mb-2" />
            ))}
        </div>
      </div>
    </div>
  )
}
