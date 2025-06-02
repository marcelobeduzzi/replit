"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SimpleDatePickerProps {
  date: Date
  setDate: (date: Date) => void
  className?: string
}

export function SimpleDatePicker({ date, setDate, className }: SimpleDatePickerProps) {
  // Función para formatear la fecha en formato local DD/MM/YYYY
  const formatLocalDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Función para parsear una fecha en formato DD/MM/YYYY
  const parseLocalDate = (dateStr: string): Date | null => {
    const parts = dateStr.split("/")
    if (parts.length !== 3) return null

    const day = Number.parseInt(parts[0], 10)
    const month = Number.parseInt(parts[1], 10) - 1 // Meses en JS son 0-11
    const year = Number.parseInt(parts[2], 10)

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null

    // Crear fecha local sin manipulación de zona horaria
    const newDate = new Date(year, month, day)

    // Verificar que la fecha es válida
    if (newDate.getDate() !== day || newDate.getMonth() !== month || newDate.getFullYear() !== year) {
      return null // Fecha inválida (como 31 de febrero)
    }

    return newDate
  }

  // Estado para el valor del input
  const [inputValue, setInputValue] = useState(formatLocalDate(date))

  // Actualizar el input cuando cambia la fecha externa
  useEffect(() => {
    setInputValue(formatLocalDate(date))
  }, [date])

  // Manejar cambio en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  // Manejar cuando el input pierde el foco
  const handleBlur = () => {
    const newDate = parseLocalDate(inputValue)
    if (newDate) {
      setDate(newDate)
    } else {
      // Si la fecha es inválida, restaurar al valor anterior
      setInputValue(formatLocalDate(date))
    }
  }

  // Manejar cuando se presiona Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleBlur()
    }
  }

  // Establecer fecha a hoy
  const setToday = () => {
    const today = new Date()
    const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    setDate(localToday)
    setInputValue(formatLocalDate(localToday))
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className="relative w-[140px]">
        <CalendarIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="DD/MM/AAAA"
          className="pl-8"
        />
      </div>
      <Button type="button" variant="outline" size="sm" onClick={setToday}>
        Hoy
      </Button>
    </div>
  )
}













