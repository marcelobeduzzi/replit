"use client"

import { DatePicker as UIDatePicker } from "@/components/ui/date-picker"
import type { Locale } from "date-fns"

// Interfaz para mantener compatibilidad con el código existente
interface DatePickerProps {
  date: Date | undefined
  onDateChange: (date: Date) => void
  placeholder?: string
  format?: string
  disabled?: boolean
  locale?: Locale
  className?: string
}

// Componente que reexporta el DatePicker unificado
export function DatePicker(props: DatePickerProps) {
  return <UIDatePicker {...props} />
}

// Exportación por defecto para compatibilidad con diferentes estilos de importación
export default DatePicker