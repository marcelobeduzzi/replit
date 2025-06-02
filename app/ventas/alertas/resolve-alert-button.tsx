'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { salesService } from "@/lib/sales-service"
import { CheckCircle2 } from 'lucide-react'

interface ResolveAlertButtonProps {
  alertId: string
}

export function ResolveAlertButton({ alertId }: ResolveAlertButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleResolve = async () => {
    setIsLoading(true)
    try {
      await salesService.resolveStockAlert(alertId)
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error al resolver alerta:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Resolver
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolver Alerta de Stock</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas marcar esta alerta como resuelta? Esta acción no modificará el inventario actual.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleResolve} disabled={isLoading}>
            {isLoading ? "Resolviendo..." : "Resolver Alerta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}