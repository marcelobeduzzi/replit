"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, ArrowUpDown, Eye, FileText, AlertTriangle } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface EmployeeProductivityTableProps {
  data: any[]
  showPagination?: boolean
}

export function EmployeeProductivityTable({ data, showPagination = true }: EmployeeProductivityTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState("score")
  const [sortOrder, setSortOrder] = useState("desc")

  const itemsPerPage = 10
  const totalPages = Math.ceil(data.length / itemsPerPage)

  // Ordenar datos
  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortBy]
    const bValue = b[sortBy]

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Paginar datos
  const paginatedData = showPagination
    ? sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : sortedData

  // Función para cambiar el ordenamiento
  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
  }

  // Función para obtener el color de la insignia según la puntuación
  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return "success"
    if (score >= 75) return "default"
    if (score >= 60) return "warning"
    return "destructive"
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>Empleado</TableHead>
            <TableHead>Local</TableHead>
            <TableHead>
              <Button variant="ghost" className="p-0 hover:bg-transparent" onClick={() => toggleSort("score")}>
                <span>Puntuación</span>
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" className="p-0 hover:bg-transparent" onClick={() => toggleSort("salesPerHour")}>
                <span>Ventas/Hora</span>
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" className="p-0 hover:bg-transparent" onClick={() => toggleSort("attendance")}>
                <span>Asistencia</span>
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" className="p-0 hover:bg-transparent" onClick={() => toggleSort("cashAccuracy")}>
                <span>Precisión Caja</span>
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" className="p-0 hover:bg-transparent" onClick={() => toggleSort("stockAccuracy")}>
                <span>Precisión Stock</span>
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Alertas</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((employee, index) => {
            const actualIndex = showPagination ? (currentPage - 1) * itemsPerPage + index + 1 : index + 1

            return (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">{actualIndex}</TableCell>
                <TableCell>
                  <div className="font-medium">{employee.name}</div>
                  <div className="text-sm text-muted-foreground">{employee.position}</div>
                </TableCell>
                <TableCell>{employee.location}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getScoreBadgeColor(employee.score)}>{employee.score}</Badge>
                    <Progress value={employee.score} className="w-[60px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">${employee.salesPerHour}</span>
                          {employee.salesTrend === "up" && <span className="text-green-500 text-xs">↑</span>}
                          {employee.salesTrend === "down" && <span className="text-red-500 text-xs">↓</span>}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ventas por hora trabajada</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-2">
                          <span className={employee.attendance >= 90 ? "text-green-600" : "text-amber-600"}>
                            {employee.attendance}%
                          </span>
                          {employee.lateCount > 0 && (
                            <span className="text-xs text-muted-foreground">({employee.lateCount} tardanzas)</span>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Porcentaje de asistencia puntual</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={employee.cashAccuracy >= 98.5 ? "text-green-600" : "text-red-600"}>
                          {employee.cashAccuracy}%
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Precisión en cierres de caja</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={employee.stockAccuracy >= 99 ? "text-green-600" : "text-red-600"}>
                          {employee.stockAccuracy}%
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Precisión en control de stock</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  {employee.alerts > 0 ? (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {employee.alerts}
                    </Badge>
                  ) : (
                    <Badge variant="outline">0</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        <span>Ver perfil</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Ver reporte detallado</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        <span>Ver alertas</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {showPagination && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNumber = i + 1

              // Mostrar solo páginas cercanas a la actual
              if (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink isActive={pageNumber === currentPage} onClick={() => setCurrentPage(pageNumber)}>
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                )
              }

              // Mostrar elipsis para páginas omitidas
              if (
                (pageNumber === 2 && currentPage > 3) ||
                (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
              ) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              }

              return null
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

