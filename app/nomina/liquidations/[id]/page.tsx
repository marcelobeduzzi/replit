"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"

export default function EditLiquidation({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [liquidation, setLiquidation] = useState<any>(null)
  const [employee, setEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editReason, setEditReason] = useState("")
  const [formData, setFormData] = useState<any>({})
  const [originalData, setOriginalData] = useState<any>({})
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    const fetchLiquidation = async () => {
      try {
        const { data, error } = await supabase.from("liquidations").select("*").eq("id", params.id).single()

        if (error) throw error
        setLiquidation(data)
        setOriginalData(data)
        
        // Inicializar formData con los valores de la liquidación
        setFormData({
          base_salary: data.base_salary,
          proportional_vacation: data.proportional_vacation,
          proportional_bonus: data.proportional_bonus,
          compensation_amount: data.compensation_amount,
          total_amount: data.total_amount,
          include_vacation: data.include_vacation,
          include_bonus: data.include_bonus,
          days_to_pay_in_last_month: data.days_to_pay_in_last_month,
        })

        // Fetch employee data
        if (data) {
          const { data: employeeData, error: employeeError } = await supabase
            .from("employees")
            .select("*")
            .eq("id", data.employee_id)
            .single()

          if (employeeError) throw employeeError
          setEmployee(employeeData)
        }
      } catch (error) {
        console.error("Error fetching liquidation:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar la información de la liquidación",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchLiquidation()
  }, [supabase, params.id])

  // Detectar cambios en el formulario
  useEffect(() => {
    if (originalData && formData) {
      const changed = 
        formData.base_salary !== originalData.base_salary ||
        formData.proportional_vacation !== originalData.proportional_vacation ||
        formData.proportional_bonus !== originalData.proportional_bonus ||
        formData.compensation_amount !== originalData.compensation_amount ||
        formData.total_amount !== originalData.total_amount ||
        formData.include_vacation !== originalData.include_vacation ||
        formData.include_bonus !== originalData.include_bonus ||
        formData.days_to_pay_in_last_month !== originalData.days_to_pay_in_last_month;
      
      setHasChanges(changed);
    }
  }, [formData, originalData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    
    if (type === "number") {
      const numValue = parseFloat(value) || 0
      setFormData({
        ...formData,
        [name]: numValue,
      })
      
      // Recalcular el total automáticamente
      if (name === "base_salary" || name === "proportional_vacation" || 
          name === "proportional_bonus" || name === "compensation_amount") {
        
        const newValues = {
          ...formData,
          [name]: numValue,
        }
        
        const newTotal = 
          newValues.compensation_amount + 
          (newValues.include_vacation ? newValues.proportional_vacation : 0) +
          (newValues.include_bonus ? newValues.proportional_bonus : 0);
        
        setFormData({
          ...newValues,
          total_amount: newTotal,
        })
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleCheckboxChange = (field: string) => (checked: boolean) => {
    setFormData({
      ...formData,
      [field]: checked,
    })
    
    // Recalcular el total cuando cambian los checkboxes
    setTimeout(() => {
      const newTotal = 
        formData.compensation_amount + 
        (checked && field === "include_vacation" ? formData.proportional_vacation : 0) +
        (checked && field === "include_bonus" ? formData.proportional_bonus : 0) +
        (field !== "include_vacation" && formData.include_vacation ? formData.proportional_vacation : 0) +
        (field !== "include_bonus" && formData.include_bonus ? formData.proportional_bonus : 0);
      
      setFormData({
        ...formData,
        [field]: checked,
        total_amount: newTotal,
      });
    }, 0);
  }

  const handleSave = async () => {
    if (!editReason.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingrese el motivo de la edición",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      // Crear una nueva versión de la liquidación
      const newVersion = (liquidation.version || 1) + 1
      
      // Preparar datos para actualización
      const updateData = {
        ...formData,
        version: newVersion,
        previous_version_id: liquidation.id,
        edit_reason: editReason,
        edited_by: "admin", // Idealmente, usar el usuario actual
        edited_at: new Date().toISOString(),
      }
      
      // Actualizar la liquidación
      const { error } = await supabase
        .from("liquidations")
        .update(updateData)
        .eq("id", params.id)

      if (error) throw error

      toast({
        title: "Éxito",
        description: "La liquidación ha sido actualizada correctamente",
      })

      router.push("/nomina/liquidations")
    } catch (error) {
      console.error("Error updating liquidation:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la liquidación",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!liquidation || !employee) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>No se pudo cargar la información de la liquidación</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/nomina/liquidations")} className="mt-4">
          Volver a Liquidaciones
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Editar Liquidación</h1>
        <Button variant="outline" onClick={() => router.push("/nomina/liquidations")}>
          Cancelar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Información de la Liquidación</CardTitle>
            <CardDescription>Edite los valores de la liquidación según sea necesario</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Empleado</Label>
                <p className="text-lg font-medium">
                  {employee.first_name} {employee.last_name}
                </p>
              </div>
              <div>
                <Label>Fecha de Terminación</Label>
                <p className="text-lg font-medium">
                  {new Date(liquidation.termination_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base_salary">Salario Base</Label>
                  <Input
                    id="base_salary"
                    name="base_salary"
                    type="number"
                    value={formData.base_salary}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="days_to_pay_in_last_month">Días a pagar del último mes</Label>
                  <Input
                    id="days_to_pay_in_last_month"
                    name="days_to_pay_in_last_month"
                    type="number"
                    value={formData.days_to_pay_in_last_month}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compensation_amount">Pago por último mes</Label>
                  <Input
                    id="compensation_amount"
                    name="compensation_amount"
                    type="number"
                    value={formData.compensation_amount}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id="include_vacation"
                      checked={formData.include_vacation}
                      onCheckedChange={handleCheckboxChange("include_vacation")}
                    />
                    <Label htmlFor="include_vacation">Incluir vacaciones</Label>
                  </div>
                  <Input
                    id="proportional_vacation"
                    name="proportional_vacation"
                    type="number"
                    value={formData.proportional_vacation}
                    onChange={handleInputChange}
                    disabled={!formData.include_vacation}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id="include_bonus"
                      checked={formData.include_bonus}
                      onCheckedChange={handleCheckboxChange("include_bonus")}
                    />
                    <Label htmlFor="include_bonus">Incluir aguinaldo</Label>
                  </div>
                  <Input
                    id="proportional_bonus"
                    name="proportional_bonus"
                    type="number"
                    value={formData.proportional_bonus}
                    onChange={handleInputChange}
                    disabled={!formData.include_bonus}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total_amount">Total a Pagar</Label>
                  <Input
                    id="total_amount"
                    name="total_amount"
                    type="number"
                    value={formData.total_amount}
                    onChange={handleInputChange}
                    className="font-bold"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="edit_reason">Motivo de la Edición</Label>
              <Textarea
                id="edit_reason"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Explique por qué está editando esta liquidación"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen de Cambios</CardTitle>
            <CardDescription>Comparación de valores originales y nuevos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasChanges ? (
              <>
                {formData.base_salary !== originalData.base_salary && (
                  <div className="flex justify-between">
                    <span>Salario Base:</span>
                    <div className="text-right">
                      <div className="line-through text-muted-foreground">
                        {formatCurrency(originalData.base_salary)}
                      </div>
                      <div className="font-medium text-green-600">{formatCurrency(formData.base_salary)}</div>
                    </div>
                  </div>
                )}

                {formData.days_to_pay_in_last_month !== originalData.days_to_pay_in_last_month && (
                  <div className="flex justify-between">
                    <span>Días último mes:</span>
                    <div className="text-right">
                      <div className="line-through text-muted-foreground">{originalData.days_to_pay_in_last_month}</div>
                      <div className="font-medium text-green-600">{formData.days_to_pay_in_last_month}</div>
                    </div>
                  </div>
                )}

                {formData.compensation_amount !== originalData.compensation_amount && (
                  <div className="flex justify-between">
                    <span>Pago último mes:</span>
                    <div className="text-right">
                      <div className="line-through text-muted-foreground">
                        {formatCurrency(originalData.compensation_amount)}
                      </div>
                      <div className="font-medium text-green-600">{formatCurrency(formData.compensation_amount)}</div>
                    </div>
                  </div>
                )}

                {formData.include_vacation !== originalData.include_vacation && (
                  <div className="flex justify-between">
                    <span>Incluir vacaciones:</span>
                    <div className="text-right">
                      <div className="line-through text-muted-foreground">
                        {originalData.include_vacation ? "Sí" : "No"}
                      </div>
                      <div className="font-medium text-green-600">{formData.include_vacation ? "Sí" : "No"}</div>
                    </div>
                  </div>
                )}

                {formData.proportional_vacation !== originalData.proportional_vacation && (
                  <div className="flex justify-between">
                    <span>Vacaciones proporcionales:</span>
                    <div className="text-right">
                      <div className="line-through text-muted-foreground">
                        {formatCurrency(originalData.proportional_vacation)}
                      </div>
                      <div className="font-medium text-green-600">{formatCurrency(formData.proportional_vacation)}</div>
                    </div>
                  </div>
                )}

                {formData.include_bonus !== originalData.include_bonus && (
                  <div className="flex justify-between">
                    <span>Incluir aguinaldo:</span>
                    <div className="text-right">
                      <div className="line-through text-muted-foreground">
                        {originalData.include_bonus ? "Sí" : "No"}
                      </div>
                      <div className="font-medium text-green-600">{formData.include_bonus ? "Sí" : "No"}</div>
                    </div>
                  </div>
                )}

                {formData.proportional_bonus !== originalData.proportional_bonus && (
                  <div className="flex justify-between">
                    <span>Aguinaldo proporcional:</span>
                    <div className="text-right">
                      <div className="line-through text-muted-foreground">
                        {formatCurrency(originalData.proportional_bonus)}
                      </div>
                      <div className="font-medium text-green-600">{formatCurrency(formData.proportional_bonus)}</div>
                    </div>
                  </div>
                )}

                {formData.total_amount !== originalData.total_amount && (
                  <>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <div className="text-right">
                        <div className="line-through text-muted-foreground">
                          {formatCurrency(originalData.total_amount)}
                        </div>
                        <div className="text-green-600">{formatCurrency(formData.total_amount)}</div>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">No hay cambios realizados</div>
            )}

            <Button
              className="w-full mt-4"
              onClick={handleSave}
              disabled={saving || !hasChanges || !editReason.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


