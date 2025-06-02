"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function StockMatrixDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const id = params?.id

  useEffect(() => {
    // Redirigir a la página principal con el ID como parámetro de consulta
    if (id) {
      router.push(`/stock-matrix?id=${id}`)
    } else {
      router.push('/stock-matrix/list')
    }
  }, [id, router])

  return null
}