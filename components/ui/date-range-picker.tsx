"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import type { DateRange } from "react-day-picker"
import type { Locale } from "date-fns"

// Interfaz para DateRangePicker
export interface DateRangePickerProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (dateRange: DateRange | undefined) => void
  className?: string
  placeholder?: string
  locale?: Locale
  numberOfMonths?: number
  align?: "center" | "start" | "end"
  disabled?: boolean
}

// Interfaz para DatePickerWithRange
export interface DatePickerWithRangeProps {
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
  className?: string
  placeholder?: string
  locale?: Locale
  numberOfMonths?: number
  align?: "center" | "start" | "end"
  disabled?: boolean
}

// Componente DateRangePicker
export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
  placeholder = "Seleccionar rango de fechas",
  locale = es,
  numberOfMonths = 2,
  align = "start",
  disabled = false
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date-range"
            variant="outline"
            className={cn("w-[300px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
            disabled={disabled}
            onClick={() => setOpen(true)} // Forzar apertura al hacer clic
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd/MM/yyyy", { locale })} - {format(dateRange.to, "dd/MM/yyyy", { locale })}
                </>
              ) : (
                format(dateRange.from, "dd/MM/yyyy", { locale })
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-[100]" align={align}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={(newDateRange) => {
              onDateRangeChange(newDateRange)
              if (newDateRange?.from && newDateRange?.to) {
                setOpen(false) // Cerrar el popover cuando se selecciona un rango completo
              }
            }}
            numberOfMonths={numberOfMonths}
            locale={locale}
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
              day_range_end: "day-range-end",
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside:
                "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
          />
          <div className="p-3 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const today = new Date()
                const correctedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0)
                onDateRangeChange({ from: correctedToday, to: correctedToday })
                setOpen(false)
              }}
            >
              Hoy
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Componente DatePickerWithRange (para mantener compatibilidad)
export function DatePickerWithRange({
  date,
  setDate,
  className,
  placeholder,
  locale,
  numberOfMonths,
  align,
  disabled
}: DatePickerWithRangeProps) {
  return (
    <DateRangePicker
      dateRange={date}
      onDateRangeChange={setDate}
      className={className}
      placeholder={placeholder}
      locale={locale}
      numberOfMonths={numberOfMonths}
      align={align}
      disabled={disabled}
    />
  )
}