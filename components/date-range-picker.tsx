"use client"

import { 
  DateRangePicker as UIDateRangePicker, 
  DatePickerWithRange as UIDatePickerWithRange,
  DateRangePickerProps,
  DatePickerWithRangeProps
} from "@/components/ui/date-range-picker"

// Componente que reexporta el DateRangePicker unificado
export function DateRangePicker(props: DateRangePickerProps) {
  return <UIDateRangePicker {...props} />
}

// Componente que reexporta el DatePickerWithRange unificado
export function DatePickerWithRange(props: DatePickerWithRangeProps) {
  return <UIDatePickerWithRange {...props} />
}

// Exportación por defecto para compatibilidad con diferentes estilos de importación
export default DatePickerWithRange