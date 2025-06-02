"use client"

import { useState, useEffect } from "react"
import { format, addMonths, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Locale } from "date-fns"

// Interfaz principal para mantener compatibilidad con el componente existente
interface DatePickerProps {
  date: Date | undefined
  onDateChange: (date: Date) => void
  placeholder?: string
  format?: string
  disabled?: boolean
  locale?: Locale
  className?: string
  align?: "center" | "start" | "end"
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Seleccionar fecha",
  format: dateFormat = "PPP",
  disabled = false,
  locale = es,
  className,
  align = "start"
}: DatePickerProps) {
  // Estado local para manejar la fecha
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date)
  // Estado para controlar el mes que se muestra en el calendario
  const [currentMonth, setCurrentMonth] = useState<Date>(date || new Date())
  // Estado para controlar si el popover está abierto o cerrado
  const [open, setOpen] = useState(false)

  // Generar años para el selector (5 años antes y después del actual)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)

  // Nombres de los meses en español
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

  // Actualizar el estado local cuando cambia la prop date
  useEffect(() => {
    setSelectedDate(date)
    if (date) {
      setCurrentMonth(date)
    }
  }, [date])

  // Función para manejar el cambio de fecha de manera segura
  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      // Importante: Crear una nueva fecha con valores específicos para evitar problemas de zona horaria
      const year = newDate.getFullYear()
      const month = newDate.getMonth()
      const day = newDate.getDate()

      // Crear la fecha con la hora fija a mediodía
      const correctedDate = new Date(year, month, day, 12, 0, 0)

      setSelectedDate(correctedDate)
      onDateChange(correctedDate)
      // Cerrar el popover después de seleccionar una fecha
      setOpen(false)
    }
  }

  // Función para cambiar al mes anterior
  const handlePrevMonth = () => {
    setCurrentMonth((prevMonth) => subMonths(prevMonth, 1))
  }

  // Función para cambiar al mes siguiente
  const handleNextMonth = () => {
    setCurrentMonth((prevMonth) => addMonths(prevMonth, 1))
  }

  // Función para cambiar el mes desde el selector
  const handleMonthChange = (monthIndex: string) => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(Number.parseInt(monthIndex))
    setCurrentMonth(newMonth)
  }

  // Función para cambiar el año desde el selector
  const handleYearChange = (year: string) => {
    const newMonth = new Date(currentMonth)
    newMonth.setFullYear(Number.parseInt(year))
    setCurrentMonth(newMonth)
  }

  // Función para seleccionar hoy
  const handleSelectToday = () => {
    const today = new Date()
    const correctedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0)
    handleDateSelect(correctedToday)
    setCurrentMonth(correctedToday)
    // Cerrar el popover después de seleccionar hoy
    setOpen(false)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
            disabled={disabled}
            onClick={() => setOpen(true)} // Forzar apertura al hacer clic
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, dateFormat, { locale }) : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-[100]" align={align}>
          <div className="p-3 border-b flex items-center justify-between">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex gap-2">
              <Select value={currentMonth.getMonth().toString()} onValueChange={handleMonthChange}>
                <SelectTrigger className="h-8 w-[110px]">
                  <SelectValue>{months[currentMonth.getMonth()]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={month} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={currentMonth.getFullYear().toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="h-8 w-[80px]">
                  <SelectValue>{currentMonth.getFullYear()}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            locale={locale}
            captionLayout="buttons-only" // Ocultar la navegación predeterminada
            showOutsideDays={true}
            fixedWeeks={true}
            className="p-3 border-none"
            classNames={{
              day_selected: "bg-primary text-primary-foreground font-bold",
              day_today: "bg-accent text-accent-foreground font-medium",
              head_cell: "text-muted-foreground font-medium text-xs",
              cell: "text-center text-sm p-0 relative h-9 w-9 focus-within:relative focus-within:z-20",
              button: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
              nav: "hidden", // Ocultar la navegación predeterminada
              caption: "hidden", // Ocultar el título predeterminada
            }}
          />

          <div className="p-3 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSelectToday}
            >
              Hoy
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}