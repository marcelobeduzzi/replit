import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "activo":
      case "pagada":
      case "completado":
        return "bg-green-100 text-green-800"
      case "inactive":
      case "inactivo":
      case "anulada":
      case "cancelado":
        return "bg-red-100 text-red-800"
      case "on_leave":
      case "licencia":
      case "pendiente":
      case "en proceso":
        return "bg-yellow-100 text-yellow-800"
      case "vacation":
      case "vacaciones":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "Activo"
      case "inactive":
        return "Inactivo"
      case "on_leave":
        return "En Licencia"
      case "vacation":
        return "Vacaciones"
      default:
        return status
    }
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        getStatusColor(status),
        className,
      )}
    >
      {getStatusText(status)}
    </span>
  )
}

