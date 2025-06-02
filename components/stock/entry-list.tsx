"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { mockUsers, mockProviders } from "@/lib/mock-data"

interface EntryListProps {
  entries: any[]
  type: "ingresos" | "decomisos"
}

export function EntryList({ entries, type }: EntryListProps) {
  const [selectedEntry, setSelectedEntry] = useState(null)

  if (entries.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No hay {type === "ingresos" ? "ingresos" : "decomisos"} registrados
      </div>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const getUserName = (userId) => {
    const user = mockUsers.find((u) => u.id === userId)
    return user ? user.name : "Usuario desconocido"
  }

  const getProviderName = (providerId) => {
    if (!providerId) return "N/A"
    const provider = mockProviders.find((p) => p.id === providerId)
    return provider ? provider.name : "Proveedor desconocido"
  }

  return (
    <>
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Encargado</TableHead>
              {type === "ingresos" && <TableHead>Proveedor</TableHead>}
              <TableHead>Productos</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, index) => (
              <TableRow key={index}>
                <TableCell>{formatDate(entry.date)}</TableCell>
                <TableCell>{getUserName(entry.userId)}</TableCell>
                {type === "ingresos" && <TableCell>{getProviderName(entry.providerId)}</TableCell>}
                <TableCell>
                  <Badge variant="outline">{entry.items.reduce((sum, item) => sum + item.quantity, 0)} productos</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedEntry(entry)}>
                    Ver detalles
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo para ver detalles */}
      <Dialog open={selectedEntry !== null} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles de {type === "ingresos" ? "Ingreso" : "Decomiso"}</DialogTitle>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p>{formatDate(selectedEntry.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Encargado</p>
                  <p>{getUserName(selectedEntry.userId)}</p>
                </div>
                {type === "ingresos" && selectedEntry.providerId && (
                  <div>
                    <p className="text-sm text-muted-foreground">Proveedor</p>
                    <p>{getProviderName(selectedEntry.providerId)}</p>
                  </div>
                )}
                {type === "ingresos" && selectedEntry.invoiceNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">Factura</p>
                    <p>{selectedEntry.invoiceNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Turno</p>
                  <p className="capitalize">{selectedEntry.shift}</p>
                </div>
              </div>

              <div>
                <p className="font-medium mb-2">Productos</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      {type === "decomisos" && <TableHead>Motivo</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedEntry.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        {type === "decomisos" && <TableCell>{item.reason || "No especificado"}</TableCell>}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {type === "decomisos" && selectedEntry.notes && (
                <div>
                  <p className="font-medium mb-1">Observaciones</p>
                  <p className="text-sm">{selectedEntry.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

