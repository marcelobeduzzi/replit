"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockProducts, mockUsers } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface StockCountFormProps {
  type: "inicial" | "cierre"
  requireSecondaryUser?: boolean
  onSubmit: (data: any) => void
}

export function StockCountForm({ type, requireSecondaryUser = false, onSubmit }: StockCountFormProps) {
  const { toast } = useToast()
  const { user, validateSupervisorPin, supervisors } = useAuth()
  const [products, setProducts] = useState(mockProducts.map((product) => ({ ...product, quantity: 0 })))
  const [userId, setUserId] = useState(user?.id || "")
  const [secondaryUserId, setSecondaryUserId] = useState("")
  const [shift, setShift] = useState("mañana")
  const [notes, setNotes] = useState("")
  const [showSupervisorDialog, setShowSupervisorDialog] = useState(false)
  const [supervisorPin, setSupervisorPin] = useState("")
  const [pinError, setPinError] = useState("")

  // Actualizar el ID de usuario cuando cambia el usuario autenticado
  useEffect(() => {
    if (user) {
      setUserId(user.id)
    }
  }, [user])

  const handleQuantityChange = (productId, quantity) => {
    setProducts(
      products.map((product) =>
        product.id === productId ? { ...product, quantity: Number.parseInt(quantity) || 0 } : product,
      ),
    )
  }

  const handleSubmit = () => {
    // Validar que se hayan ingresado cantidades para al menos un producto
    const hasProducts = products.some((product) => product.quantity > 0)
    if (!hasProducts) {
      toast({
        title: "Error",
        description: "Debes ingresar al menos un producto con cantidad mayor a cero.",
        variant: "destructive",
      })
      return
    }

    // Validar que se haya seleccionado un usuario
    if (!userId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un usuario responsable.",
        variant: "destructive",
      })
      return
    }

    // Validar que se haya seleccionado un usuario secundario si es requerido
    if (requireSecondaryUser && !secondaryUserId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un segundo usuario para validar el conteo.",
        variant: "destructive",
      })
      return
    }

    // Si se requiere un usuario secundario, mostrar el diálogo para ingresar el PIN
    if (requireSecondaryUser) {
      setShowSupervisorDialog(true)
      return
    }

    // Si no se requiere un usuario secundario, enviar los datos directamente
    submitData()
  }

  const validateAndSubmit = () => {
    // Validar el PIN del supervisor
    if (validateSupervisorPin(supervisorPin)) {
      setShowSupervisorDialog(false)
      setSupervisorPin("")
      setPinError("")
      submitData()
    } else {
      setPinError("PIN incorrecto. Intenta nuevamente.")
    }
  }

  const submitData = () => {
    // Filtrar productos con cantidad mayor a cero
    const productsWithQuantity = products.filter((product) => product.quantity > 0)

    // Crear objeto de datos
    const data = {
      type,
      userId,
      secondaryUserId: requireSecondaryUser ? secondaryUserId : null,
      shift,
      date: new Date().toISOString(),
      products: productsWithQuantity,
      notes,
    }

    // Enviar datos al componente padre
    onSubmit(data)

    // Mostrar mensaje de éxito
    toast({
      title: `Stock ${type} registrado`,
      description: `El stock ${type} ha sido registrado correctamente.`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="user">Usuario Responsable</Label>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger id="user">
              <SelectValue placeholder="Seleccionar usuario" />
            </SelectTrigger>
            <SelectContent>
              {mockUsers
                .filter((u) => u.role === "encargado" || u.role === "supervisor")
                .map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {requireSecondaryUser && (
          <div>
            <Label htmlFor="secondaryUser">Usuario Secundario</Label>
            <Select value={secondaryUserId} onValueChange={setSecondaryUserId}>
              <SelectTrigger id="secondaryUser">
                <SelectValue placeholder="Seleccionar usuario" />
              </SelectTrigger>
              <SelectContent>
                {mockUsers
                  .filter((u) => u.id !== userId && (u.role === "encargado" || u.role === "supervisor"))
                  .map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="shift">Turno</Label>
          <Select value={shift} onValueChange={setShift}>
            <SelectTrigger id="shift">
              <SelectValue placeholder="Seleccionar turno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mañana">Mañana</SelectItem>
              <SelectItem value="tarde">Tarde</SelectItem>
              <SelectItem value="noche">Noche</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Productos</h3>
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div className="md:col-span-2">
                <Label htmlFor={`product-${product.id}`}>{product.name}</Label>
              </div>
              <div>
                <Input
                  id={`product-${product.id}`}
                  type="number"
                  min="0"
                  value={product.quantity}
                  onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {product.unit} - ${product.price}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Observaciones</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observaciones adicionales (opcional)"
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit}>
          {type === "inicial" ? "Registrar Stock Inicial" : "Registrar Stock de Cierre"}
        </Button>
      </div>

      {/* Diálogo para validación de supervisor */}
      <Dialog open={showSupervisorDialog} onOpenChange={setShowSupervisorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Validación de Supervisor</DialogTitle>
            <DialogDescription>
              Para completar el registro de stock de cierre, un supervisor debe ingresar su PIN.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="supervisorPin">PIN de Supervisor</Label>
              <Input
                id="supervisorPin"
                type="password"
                value={supervisorPin}
                onChange={(e) => {
                  setSupervisorPin(e.target.value)
                  setPinError("")
                }}
                placeholder="Ingrese el PIN"
              />
              {pinError && <p className="text-sm text-destructive">{pinError}</p>}
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Supervisores disponibles:</p>
              <ul className="text-sm text-muted-foreground mt-1">
                {supervisors.map((supervisor) => (
                  <li key={supervisor.id}>
                    {supervisor.name} - PIN: {supervisor.pin}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                Nota: En un entorno de producción, esta información no sería visible.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSupervisorDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={validateAndSubmit}>Validar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}





