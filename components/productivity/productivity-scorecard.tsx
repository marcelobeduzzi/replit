"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ArrowDown, ArrowUp } from "lucide-react"

interface ProductivityScorecardProps {
  title: string
  value: string | number
  description?: string
  change?: number
  trend?: "up" | "down" | "neutral"
  score?: number
}

export function ProductivityScorecard({ title, value, description, change, trend, score }: ProductivityScorecardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{value}</h2>
            {trend && (
              <div className={`flex items-center ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
                {trend === "up" ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
                {change && <span>{change}%</span>}
              </div>
            )}
            {score !== undefined && (
              <div
                className={`text-sm font-medium ${score >= 80 ? "text-green-500" : score >= 70 ? "text-amber-500" : "text-red-500"}`}
              >
                {score} pts
              </div>
            )}
          </div>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

