import { LoadingSpinner } from "@/components/loading-spinner"

export default function Loading() {
  return (
    <div className="flex-1 p-8 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  )
}
