"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface SalesDataDisplayProps {
  salesData: any
  onContinue: () => void
}

export function SalesDataDisplay({ salesData, onContinue }: SalesDataDisplayProps) {
  // Agrupar ventas por producto
  const productSales = salesData.items.reduce((acc, item) => {
    if (!acc[item.productId]) {
      acc[item.productId] = {
        productName: item.productName,
        quantity: 0,
        totalAmount: 0,
      }
    }

    acc[item.productId].quantity += item.quantity
    acc[item.productId].totalAmount += item.totalPrice

    return acc
  }, {})

  // Agrupar ventas por método de pago
  const paymentMethodSales = salesData.items.reduce((acc, item) => {
    if (!acc[item.paymentMethod]) {
      acc[item.paymentMethod] = 0
    }

    acc[item.paymentMethod] += item.totalPrice

    return acc
  }, {})

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  return (
    <div>
      <Tabs defaultValue="by-product" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="by-product">Por Producto</TabsTrigger>
          <TabsTrigger value="by-payment">Por Método de Pago</TabsTrigger>
        </TabsList>

        <TabsContent value="by-product">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.values(productSales).map((sale: any) => (
                <TableRow key={sale.productName}>
                  <TableCell>{sale.productName}</TableCell>
                  <TableCell className="text-right">{sale.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(sale.totalAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="by-payment">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Método de Pago</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(paymentMethodSales).map(([method, amount]) => (
                <TableRow key={method}>
                  <TableCell>{method}</TableCell>
                  <TableCell className="text-right">{formatCurrency(amount as number)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-medium">
                <TableCell>Total General</TableCell>
                <TableCell className="text-right">{formatCurrency(salesData.totalAmount)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={onContinue}>Continuar</Button>
      </div>
    </div>
  )
}

