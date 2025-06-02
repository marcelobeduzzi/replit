"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/date-picker"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Loader2, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

// Esquema de validación para el formulario
const employeeFormSchema = z.object({
  firstName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  lastName: z.string().min(2, { message: "El apellido debe tener al menos 2 caracteres" }),
  email: z.string().email({ message: "Ingrese un email válido" }).optional().or(z.literal("")),
  phone: z.string().min(8, { message: "El teléfono debe tener al menos 8 caracteres" }).optional().or(z.literal("")),
  position: z.string().min(1, { message: "Seleccione un puesto" }),
  location: z.string().min(1, { message: "Seleccione una ubicación" }),
  startDate: z.date({ required_error: "Seleccione una fecha de inicio" }),
  endDate: z.date().optional(),
  salary: z.string().min(1, { message: "Ingrese un salario válido" }),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
})

type EmployeeFormValues = z.infer<typeof employeeFormSchema>

// Lista de puestos disponibles
const positions = [
  { id: "manager", name: "Gerente" },
  { id: "supervisor", name: "Supervisor" },
  { id: "cashier", name: "Cajero" },
  { id: "waiter", name: "Mesero" },
  { id: "cook", name: "Cocinero" },
  { id: "assistant", name: "Asistente" },
  { id: "cleaner", name: "Limpieza" },
  { id: "delivery", name: "Delivery" },
  { id: "other", name: "Otro" },
]

// Lista de ubicaciones disponibles
const locations = [
  { id: "cabildo", name: "BR Cabildo" },
  { id: "carranza", name: "BR Carranza" },
  { id: "pacifico", name: "BR Pacífico" },
  { id: "lavalle", name: "BR Lavalle" },
  { id: "rivadavia", name: "BR Rivadavia" },
  { id: "aguero", name: "BR Aguero" },
  { id: "dorrego", name: "BR Dorrego" },
  { id: "dean", name: "Dean & Dennys" },
]

interface EmployeeFormProps {
  employeeId?: string
}

export function EmployeeForm({ employeeId }: EmployeeFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [employee, setEmployee] = useState<any>(null)

  // Inicializar el formulario con valores por defecto
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      position: "",
      location: "",
      startDate: new Date(),
      salary: "",
      notes: "",
      isActive: true,
    },
  })

  // Cargar datos del empleado si se está editando
  useEffect(() => {
    if (employeeId) {
      loadEmployeeData()
    }
  }, [employeeId])

  const loadEmployeeData = async () => {
    try {
      setIsLoading(true)

      const { data, error } = await supabase.from("employees").select("*").eq("id", employeeId).single()

      if (error) {
        throw error
      }

      if (data) {
        setEmployee(data)

        // Formatear los datos para el formulario
        form.reset({
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          position: data.position || "",
          location: data.location || "",
          startDate: data.start_date ? new Date(data.start_date) : new Date(),
          endDate: data.end_date ? new Date(data.end_date) : undefined,
          salary: data.salary ? data.salary.toString() : "",
          notes: data.notes || "",
          isActive: data.is_active !== false, // Si es null o undefined, asumimos true
        })
      }
    } catch (error) {
      console.error("Error al cargar datos del empleado:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del empleado",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (values: EmployeeFormValues) => {
    try {
      setIsLoading(true)

      // Preparar los datos para guardar
      const employeeData = {
        first_name: values.firstName,
        last_name: values.lastName,
        email: values.email || null,
        phone: values.phone || null,
        position: values.position,
        location: values.location,
        start_date: format(values.startDate, "yyyy-MM-dd"),
        end_date: values.endDate ? format(values.endDate, "yyyy-MM-dd") : null,
        salary: Number.parseFloat(values.salary.replace(/[^\d.-]/g, "")),
        notes: values.notes || null,
        is_active: values.isActive,
      }

      if (employeeId) {
        // Actualizar empleado existente
        const { error } = await supabase.from("employees").update(employeeData).eq("id", employeeId)

        if (error) throw error

        toast({
          title: "Empleado actualizado",
          description: "Los datos del empleado se han actualizado correctamente",
        })
      } else {
        // Crear nuevo empleado
        const { error } = await supabase.from("employees").insert([employeeData])

        if (error) throw error

        toast({
          title: "Empleado creado",
          description: "El empleado se ha creado correctamente",
        })

        // Limpiar el formulario después de crear
        form.reset()
      }

      // Redirigir a la lista de empleados
      router.push("/empleados")
      router.refresh()
    } catch (error: any) {
      console.error("Error al guardar empleado:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el empleado",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/empleados")
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Button variant="outline" onClick={handleCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a la lista
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{employeeId ? "Editar Empleado" : "Nuevo Empleado"}</CardTitle>
          <CardDescription>
            {employeeId
              ? "Actualice la información del empleado en el formulario a continuación"
              : "Complete el formulario para agregar un nuevo empleado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input placeholder="Apellido" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Email" type="email" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormDescription>Opcional</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="Teléfono" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormDescription>Opcional</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Puesto</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar puesto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {positions.map((position) => (
                            <SelectItem key={position.id} value={position.id}>
                              {position.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ubicación</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar ubicación" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de inicio</FormLabel>
                      <DatePicker date={field.value} onDateChange={field.onChange} disabled={isLoading} locale={es} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de finalización</FormLabel>
                      <DatePicker date={field.value} onDateChange={field.onChange} disabled={isLoading} locale={es} />
                      <FormDescription>Opcional</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salario</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Salario"
                          {...field}
                          disabled={isLoading}
                          onChange={(e) => {
                            // Permitir solo números y puntos
                            const value = e.target.value.replace(/[^\d.]/g, "")
                            field.onChange(value)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Activo</FormLabel>
                        <FormDescription>Indica si el empleado está actualmente trabajando</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas adicionales sobre el empleado"
                        {...field}
                        disabled={isLoading}
                        rows={4}
                      />
                    </FormControl>
                    <FormDescription>Opcional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {employeeId ? "Actualizar Empleado" : "Crear Empleado"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
