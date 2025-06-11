
import DashboardLayout from "@/app/dashboard-layout"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function Loading() {
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    </DashboardLayout>
  )
}
