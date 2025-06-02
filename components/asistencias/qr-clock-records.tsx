"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { RefreshCw, MapPin, QrCode } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { dbService } from "@/lib/db-service"
import { StatusBadge } from "@/components/status-badge"

interface QrClockRecordsProps {
  employeeId?: string
  isLoading?: boolean
}

export function QrClockRecords({ employeeId, isLoading: parentLoading }: QrClockRecordsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState<boolean>(parentLoading || false)
  const [records, setRecords] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])

  // Cargar empleados al inicio
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeeData = await dbService.getEmployees()
        setEmployees(employeeData)
      } catch (error) {
        console.error("Error al cargar empleados:", error)
      }
    }

    fetchEmployees()
  }, [])

  // Cargar registros QR
  useEffect(() => {
    const fetchQrRecords = async () => {
      setLoading(true)
      try {
        // En una implementación real, aquí llamaríamos al servicio de fichaje QR
        // const response = await dbService.getQrClockRecords({ employeeId });
        // setRecords(response.data);

        // Por ahora, simulamos la carga de datos
        setTimeout(() => {
          const mockRecords = generateMockQrRecords()

          // Filtrar por empleado si se especifica
          const filteredRecords = employeeId
            ? mockRecords.filter((record) => record.employeeId === employeeId)
            : mockRecords

          setRecords(filteredRecords)
          setLoading(false)
        }, 600)
      } catch (error) {
        console.error("Error al cargar registros QR:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los registros de fichaje QR.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    fetchQrRecords()
  }, [employeeId, toast])

  // Función para generar registros QR simulados
  const generateMockQrRecords = () => {
    const records = []
    const now = new Date()

    // Generar registros para los últimos 14 días
    for (let i = 0; i < 14; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)

      // Generar entre 5-10 registros por día
      const recordsPerDay = Math.floor(Math.random() * 6) + 5

      for (let j = 0; j < recordsPerDay; j++) {
        // Determinar si es entrada o salida
        const isEntry = Math.random() > 0.5

        // Hora aleatoria según si es entrada o salida
        const hour = isEntry ? 8 + Math.floor(Math.random() * 2) : 17 + Math.floor(Math.random() * 3)
        const minute = Math.floor(Math.random() * 60)

        const timestamp = new Date(date)
        timestamp.setHours(hour, minute)

        // Empleado aleatorio (simulado)
        const employeeId = `emp-${Math.floor(Math.random() * 5) + 1}`

        records.push({
          id: `qr-${i}-${j}-${Date.now()}`,
          employeeId,
          timestamp: timestamp.toISOString(),
          type: isEntry ? "entrada" : "salida",
          verified: Math.random() > 0.15, // 85% verificados
          location: {
            name: ["BR Cabildo", "BR Carranza", "BR Pacífico", "BR Local 4", "BR Local 5"][
              Math.floor(Math.random() * 5)
            ],
            latitude: 40.416775 + (Math.random() - 0.5) * 0.01,
            longitude: -3.70379 + (Math.random() - 0.5) * 0.01,
          },
        })
      }
    }

    // Ordenar por fecha (más reciente primero)
    return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  // Función para determinar si un registro es reciente (menos de 1 hora)
  const isRecent = (timestamp: string): boolean => {
    const recordTime = new Date(timestamp).getTime()
    const oneHourAgo = new Date().getTime() - 60 * 60 * 1000
    return recordTime > oneHourAgo
  }

  const refreshRecords = () => {
    setLoading(true)

    // Simular recarga de datos
    setTimeout(() => {
      const mockRecords = generateMockQrRecords()

      // Filtrar por empleado si se especifica
      const filteredRecords = employeeId
        ? mockRecords.filter((record) => record.employeeId === employeeId)
        : mockRecords

      setRecords(filteredRecords)
      setLoading(false)

      toast({
        title: "Datos actualizados",
        description: "Los registros de fichaje QR han sido actualizados.",
      })
    }, 600)
  }

  // Obtener el nombre del empleado a partir del ID
  const getEmployeeName = (id: string) => {
    const employee = employees.find((e) => e.id === id)
    return employee ? `${employee.firstName} ${employee.lastName}` : "Empleado desconocido"
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center">
            <QrCode className="h-5 w-5 mr-2 text-primary" />
            <h3 className="font-medium">Registros de Fichaje QR</h3>
          </div>
          <Button variant="outline" size="sm" onClick={refreshRecords} disabled={loading}>
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empleado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Esqueletos de carga
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                </TableRow>
              ))
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No se encontraron registros de fichaje QR
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => {
                const date = new Date(record.timestamp)
                const recent = isRecent(record.timestamp)
                return (
                  <TableRow key={record.id} className={recent ? "bg-green-50" : ""}>
                    <TableCell>
                      <div className="font-medium">{getEmployeeName(record.employeeId)}</div>
                      <div className="text-xs text-muted-foreground">{record.employeeId}</div>
                    </TableCell>
                    <TableCell>{format(date, "dd/MM/yyyy", { locale: es })}</TableCell>
                    <TableCell>
                      {recent && <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>}
                      {format(date, "HH:mm:ss", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.type === "entrada" ? "default" : "secondary"}>
                        {record.type === "entrada" ? "Entrada" : "Salida"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        <span>{record.location.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.verified ? (
                        <StatusBadge status="Verificado" className="bg-green-100 text-green-800" />
                      ) : (
                        <StatusBadge status="No verificado" className="bg-red-100 text-red-800" />
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {!loading && records.length > 0 && (
          <div className="p-4 border-t">
            <div className="flex items-start space-x-2 text-sm text-muted-foreground">
              <div className="mt-0.5">
                <StatusBadge status="Verificado" className="bg-green-100 text-green-800" />
              </div>
              <div>
                Los registros verificados indican que la geolocalización coincide con la ubicación esperada del local.
              </div>
            </div>
            <div className="flex items-start space-x-2 text-sm text-muted-foreground mt-2">
              <div className="mt-0.5">
                <StatusBadge status="No verificado" className="bg-red-100 text-red-800" />
              </div>
              <div>
                Los registros no verificados requieren revisión manual ya que la ubicación no coincide con la esperada.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

