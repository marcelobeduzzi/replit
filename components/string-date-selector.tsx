"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface StringDateSelectorProps {
  dateString: string // formato "YYYY-MM-DD"
  onDateChange: (dateString: string) => void
  className?: string
}

export function StringDateSelector({ dateString, onDateChange, className }: StringDateSelectorProps) {
  // Parsear la fecha inicial
  const initialDate = dateString ? dateString.split("-") : ["", "", ""]
  const [year, setYear] = useState(initialDate[0] || new Date().getFullYear().toString())
  const [month, setMonth] = useState(initialDate[1] || (new Date().getMonth() + 1).toString().padStart(2, "0"))
  const [day, setDay] = useState(initialDate[2] || new Date().getDate().toString().padStart(2, "0"))

  // Generar años (5 años antes y después del actual)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString())

  // Meses
  const months = [
    { value: "01", label: "Enero" },
    { value: "02", label: "Febrero" },
    { value: "03", label: "Marzo" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Mayo" },
    { value: "06", label: "Junio" },
    { value: "07", label: "Julio" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ]

  // Generar días según el mes y año seleccionados
  const getDaysInMonth = (year: string, month: string) => {
    const daysInMonth = new Date(Number.parseInt(year), Number.parseInt(month), 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString().padStart(2, "0"))
  }

  const days = getDaysInMonth(year, month)

  // Actualizar la fecha cuando cambian los selectores
  useEffect(() => {
    // Asegurarse de que el día sea válido para el mes y año seleccionados
    const maxDay = getDaysInMonth(year, month).length
    const validDay = Number.parseInt(day) > maxDay ? maxDay.toString().padStart(2, "0") : day

    const newDateString = `${year}-${month}-${validDay}`
    onDateChange(newDateString)
  }, [year, month, day, onDateChange])

  // Actualizar los selectores cuando cambia la fecha externa
  useEffect(() => {
    if (dateString) {
      const [newYear, newMonth, newDay] = dateString.split("-")
      if (newYear) setYear(newYear)
      if (newMonth) setMonth(newMonth)
      if (newDay) setDay(newDay)
    }
  }, [dateString])

  // Establecer fecha a hoy
  const setToday = () => {
    const today = new Date()
    const todayYear = today.getFullYear().toString()
    const todayMonth = (today.getMonth() + 1).toString().padStart(2, "0")
    const todayDay = today.getDate().toString().padStart(2, "0")

    setYear(todayYear)
    setMonth(todayMonth)
    setDay(todayDay)
  }

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <div className="flex items-end space-x-2">
        <div className="space-y-1">
          <Label htmlFor="day">Día</Label>
          <Select value={day} onValueChange={setDay}>
            <SelectTrigger id="day" className="w-[80px]">
              <SelectValue placeholder="Día" />
            </SelectTrigger>
            <SelectContent>
              {days.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="month">Mes</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger id="month" className="w-[120px]">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="year">Año</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger id="year" className="w-[100px]">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="button" variant="outline" onClick={setToday}>
          Hoy
        </Button>
      </div>
    </div>
  )
}

