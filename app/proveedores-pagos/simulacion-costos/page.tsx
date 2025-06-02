"use client"

import { DashboardLayout } from "@/app/dashboard-layout"
import SimulacionCostos from "@/components/simulacion-costos"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SimulacionCostosPage() {
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center mb-6">
          <Button asChild variant="outline" size="sm" className="mr-4">
            <Link href="/proveedores-pagos">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Proveedores y Pagos
            </Link>
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Simulación de Precios y Rentabilidad</h2>
        </div>
        <SimulacionCostos />
      </div>
    </DashboardLayout>
  )
}

