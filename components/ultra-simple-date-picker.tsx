"use client"

import { useState, useEffect } from "react"
import { format, parse } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"

interface UltraSimpleDatePickerProps {
  value: string // formato "YYYY-MM-DD"
  onChange: (value: string) => void
  className?: string
}

export function UltraSimpleDatePicker({ value, onChange, className }: UltraSimpleDatePickerProps) {
  // Convertir el string de fecha a objeto Date
  const parseDate = (dateString: string): Date | undefined => {
    try {
      if (!dateString) return undefined
      // Asumimos que dateString viene en formato YYYY-MM-DD
      return parse(dateString, "yyyy-MM-dd", new Date())
    } catch (error) {
      console.error("Error al parsear fecha:", error)
      return undefined
    }
  }

  // Estado local para la fecha como objeto Date
  const [date, setDate] = useState<Date | undefined>(parseDate(value))

  // Actualizar el estado local cuando cambia la prop value
  useEffect(() => {
    setDate(parseDate(value))
  }, [value])

  // Manejar el cambio de fecha
  const handleDateChange = (newDate: Date) => {
    setDate(newDate)
    // Convertir la fecha a string en formato YYYY-MM-DD
    const formattedDate = format(newDate, "yyyy-MM-dd")
    onChange(formattedDate)
  }

  // Establecer fecha a hoy
  const setToday = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")

    const todayFormatted = `${year}-${month}-${day}`
    onChange(todayFormatted)
    setDate(today)
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="w-[140px]">
        <DatePicker
          date={date}
          onDateChange={handleDateChange}
          placeholder="DD/MM/AAAA"
          format="dd/MM/yyyy"
          className="w-full"
        />
      </div>
      <Button type="button" variant="outline" size="sm" onClick={setToday}>
        Hoy
      </Button>
    </div>
  )
}

export default UltraSimpleDatePicker