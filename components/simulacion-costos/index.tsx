"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ProductSimulation from "./product-simulation"
import SupplierPrices from "./supplier-prices"
import SimulationReports from "./simulation-reports"

export default function SimulacionCostos() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Simulación de Precios y Rentabilidad</CardTitle>
          <CardDescription>
            Simule diferentes escenarios de precios y calcule la rentabilidad de sus productos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="simulation" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="simulation">Simulación de Precios</TabsTrigger>
              <TabsTrigger value="suppliers">Precios de Proveedores</TabsTrigger>
              <TabsTrigger value="reports">Reportes</TabsTrigger>
            </TabsList>

            <TabsContent value="simulation" className="mt-6">
              <ProductSimulation />
            </TabsContent>

            <TabsContent value="suppliers" className="mt-6">
              <SupplierPrices />
            </TabsContent>

            <TabsContent value="reports" className="mt-6">
              <SimulationReports />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

