"use client"

import { DashboardLayout } from "@/app/dashboard-layout"
import { BalanceForm } from "@/components/balance-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function NewBalancePage() {
  const router = useRouter()

  // En una aplicación real, estos valores vendrían de una selección previa
  // o de un contexto/estado global
  const localId = "local-1"
  const localName = "BR Cabildo"

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.push("/balances")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Nuevo Balance</h2>
              <p className="text-muted-foreground">{localName}</p>
            </div>
          </div>
        </div>

        <BalanceForm localId={localId} localName={localName} />
      </div>
    </DashboardLayout>
  )
}
