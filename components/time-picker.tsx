"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface TimePickerProps {
  time: string
  setTime: (time: string) => void
  className?: string
}

export function TimePicker({ time, setTime, className }: TimePickerProps) {
  const [hours, setHours] = useState<number>(0)
  const [minutes, setMinutes] = useState<number>(0)

  // Actualizar horas y minutos cuando cambia el tiempo
  useEffect(() => {
    if (time) {
      const [h, m] = time.split(":").map(Number)
      setHours(h)
      setMinutes(m)
    }
  }, [time])

  // Actualizar el tiempo cuando cambian las horas o minutos
  const updateTime = () => {
    const formattedHours = String(hours).padStart(2, "0")
    const formattedMinutes = String(minutes).padStart(2, "0")
    setTime(`${formattedHours}:${formattedMinutes}`)
  }

  const handleHoursChange = (value: number) => {
    const newHours = Math.max(0, Math.min(23, value))
    setHours(newHours)
    setTimeout(updateTime, 0)
  }

  const handleMinutesChange = (value: number) => {
    const newMinutes = Math.max(0, Math.min(59, value))
    setMinutes(newMinutes)
    setTimeout(updateTime, 0)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn("w-[240px] justify-start text-left font-normal", !time && "text-muted-foreground", className)}
        >
          <Clock className="mr-2 h-4 w-4" />
          {time ? time : <span>Seleccionar hora</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="flex items-center space-x-2">
          <div className="grid gap-1 text-center">
            <div className="flex items-center">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-r-none"
                onClick={() => handleHoursChange(hours - 1)}
              >
                -
              </Button>
              <Input
                type="number"
                value={hours}
                onChange={(e) => handleHoursChange(Number.parseInt(e.target.value) || 0)}
                className="h-8 w-16 rounded-none text-center"
                min={0}
                max={23}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-l-none"
                onClick={() => handleHoursChange(hours + 1)}
              >
                +
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">Horas</div>
          </div>
          <div className="text-xl">:</div>
          <div className="grid gap-1 text-center">
            <div className="flex items-center">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-r-none"
                onClick={() => handleMinutesChange(minutes - 1)}
              >
                -
              </Button>
              <Input
                type="number"
                value={minutes}
                onChange={(e) => handleMinutesChange(Number.parseInt(e.target.value) || 0)}
                className="h-8 w-16 rounded-none text-center"
                min={0}
                max={59}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-l-none"
                onClick={() => handleMinutesChange(minutes + 1)}
              >
                +
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">Minutos</div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

