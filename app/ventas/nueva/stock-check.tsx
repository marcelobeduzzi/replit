'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from 'lucide-react'
import { salesService } from "@/lib/sales-service"

interface StockCheckProps {
  items: Array<{
    productId: string
    quantity: number
    price: number
  }>
  onStockCheck: (hasStock: boolean) => void
}

export function StockCheck({ items, onStockCheck }: StockCheckProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<React.ReactNode | null>(null)

  const checkStock = async () => {
    // Verificar que haya items válidos para verificar
    const validItems = items.filter(item => 
      item.productId && item.quantity > 0
    )
    
    if (validItems.length === 0) {
      onStockCheck(true) // No hay items para verificar, permitir continuar
      setError(null)
      return
    }

    setIsChecking(true)
    setError(null)

    try {
      const stockCheck = await salesService.checkStockForSale(validItems)
      
      if (!stockCheck.hasStock) {
        setError(
          <div>
            <p>No hay suficiente stock para los siguientes productos:</p>
            <ul className="mt-2 list-disc pl-5">
              {stockCheck.insufficientStock.map(item => (
                <li key={item.productId}>
                  <strong>{item.name}</strong>
                  {item.variantName && ` - ${item.variantName}`}
                  <span className="ml-2">
                    (Solicitado: {item.requested}, Disponible: {item.available})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )
        onStockCheck(false)
      } else {
        setError(null)
        onStockCheck(true)
      }
    } catch (error) {
      console.error("Error al verificar stock:", error)
      setError("Error al verificar el stock disponible")
      onStockCheck(false)
    } finally {
      setIsChecking(false)
    }
  }

  // Verificar stock cuando cambian los items
  useEffect(() => {
    // Debounce para no hacer demasiadas verificaciones
    const timer = setTimeout(() => {
      checkStock()
    }, 500)
    
    return () => clearTimeout(timer)
  }, [items])

  if (!error) return null

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error de Stock</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )
}