"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface GenerateDiscrepanciesButtonProps {
  localId?: number
}

export function GenerateDiscrepanciesButton({ localId }: GenerateDiscrepanciesButtonProps) {
  // Construir la URL basada en si tenemos un localId o no
  const href = localId ? `/conciliacion/generar?localId=${localId}` : "/conciliacion/generar"

  return (
    <Link href={href} passHref>
      <Button as="a">
        <Plus className="mr-2 h-4 w-4" />
        Generar Discrepancias
      </Button>
    </Link>
  )
}
