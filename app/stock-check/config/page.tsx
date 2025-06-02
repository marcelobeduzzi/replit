import { Suspense } from "react"
import { ProductConfigForm } from "./product-config-form"
import { LocationsForm } from "./locations-form"
import { ManagersForm } from "./managers-form"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard-layout"

export const metadata = {
  title: "Configuración de Planilla de Stock",
}

export default function StockSheetConfigPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Configuración de Planilla de Stock</h1>

        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="locations">Locales</TabsTrigger>
            <TabsTrigger value="managers">Encargados</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-4">
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <ProductConfigForm />
            </Suspense>
          </TabsContent>

          <TabsContent value="locations" className="mt-4">
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <LocationsForm />
            </Suspense>
          </TabsContent>

          <TabsContent value="managers" className="mt-4">
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <ManagersForm />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

