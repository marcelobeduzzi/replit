"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/app/dashboard-layout"
import { BalanceForm } from "@/components/balance-form"
import { balanceService } from "@/lib/balance-service"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function EditBalancePage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const { toast } = useToast()
  const [localId, setLocalId] = useState("")
  const [localName, setLocalName] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBalance = async () => {
      setIsLoading(true)
      try {
        const balance = await balanceService.getBalanceById(id)
        if (!balance) {
          toast({
            title: "Error",
            description: "No se encontró el balance solicitado",
            variant: "destructive",
          })
          router.push("/balances")
          return
        }

        setLocalId(balance.localId)
        setLocalName(balance.local)
      } catch (error) {
        console.error("Error al cargar datos del balance:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del balance",
          variant: "destructive",
        })
        router.push("/balances")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalance()
  }, [id, router, toast])

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            <span className="ml-2">Cargando datos del balance...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.push(`/balances/${id}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Editar Balance</h2>
              <p className="text-muted-foreground">{localName}</p>
            </div>
          </div>
        </div>

        <BalanceForm localId={localId} localName={localName} balanceId={id} />
      </div>
    </DashboardLayout>
  )
}
