"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, AlertTriangle, Plus, Trash2, CheckCircle, XCircle, Info } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Lista de locales para seleccionar
const locales = [
  { id: "cabildo", name: "BR Cabildo" },
  { id: "carranza", name: "BR Carranza" },
  { id: "pacifico", name: "BR Pacífico" },
  { id: "lavalle", name: "BR Lavalle" },
  { id: "rivadavia", name: "BR Rivadavia" },
  { id: "aguero", name: "BR Aguero" },
  { id: "dorrego", name: "BR Dorrego" },
  { id: "dean_dennys", name: "Dean & Dennys" },
]

// Interfaz para gastos
interface Gasto {
  id: string
  concepto: string
  monto: number
  tieneComprobante: boolean
  numeroComprobante?: string
  imagenComprobante?: string
}

// Interfaz para retiros
interface Retiro {
  id: string
  concepto: string
  monto: number
  autorizadoPor: string
}

// Interfaz para apertura
interface Apertura {
  id: string
  local_id: string
  local_name: string
  date: string
  shift: string
  responsible: string
  initial_amount: number
  status: string
  has_closing: boolean
}

export default function CierreCajaPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("ventas")
  const [needsSupervisor, setNeedsSupervisor] = useState(false)
  const [totalEfectivoCalculado, setTotalEfectivoCalculado] = useState(0)
  const [diferencia, setDiferencia] = useState(0)
  const [porcentajeDiferencia, setPorcentajeDiferencia] = useState(0)
  const [diferenciaPosnet, setDiferenciaPosnet] = useState(0) // Nueva variable para diferencia de Posnet
  const [porcentajeDiferenciaPosnet, setPorcentajeDiferenciaPosnet] = useState(0) // Nueva variable para porcentaje de diferencia de Posnet
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [retiros, setRetiros] = useState<Retiro[]>([])
  const [aperturasPendientes, setAperturasPendientes] = useState<Apertura[]>([])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [nuevoGasto, setNuevoGasto] = useState<Gasto>({
    id: "",
    concepto: "",
    monto: 0,
    tieneComprobante: false,
  })
  const [nuevoRetiro, setNuevoRetiro] = useState<Retiro>({
    id: "",
    concepto: "",
    monto: 0,
    autorizadoPor: "",
  })

  // Nuevo estado para mostrar el desglose del cálculo
  const [showCalculationDetails, setShowCalculationDetails] = useState(false)

  // Estado para los datos de cierre
  const [formData, setFormData] = useState({
    opening_id: "",
    local_id: "",
    local_name: "",
    date: format(new Date(), "yyyy-MM-dd"),
    shift: "mañana",
    responsible: "",
    supervisor: "",
    supervisor_pin: "",

    // Ventas (renombradas según los nuevos métodos de pago)
    total_sales: 0,
    cash_sales: 0, // Efectivo (se mantiene)
    posnet_sales: 0, // Reemplaza credit_card_sales
    posnet_impreso: 0, // Nuevo campo para Posnet Impreso
    rappi_sales: 0, // Reemplaza debit_card_sales
    mercado_delivery_sales: 0, // Reemplaza transfer_sales
    pedidos_ya_sales: 0, // Reemplaza mercado_pago_sales
    // other_sales se elimina

    // Desglose de billetes (agregando nuevas denominaciones)
    bills_20000: 0, // Nueva denominación
    bills_10000: 0, // Nueva denominación
    bills_2000: 0, // Nueva denominación
    bills_1000: 0,
    bills_500: 0,
    bills_200: 0,
    bills_100: 0,
    bills_50: 0,
    bills_20: 0,
    bills_10: 0,
    // coins se elimina

    // Cálculos
    initial_balance: 0,
    total_expenses: 0,
    total_withdrawals: 0,
    expected_balance: 0,
    actual_balance: 0,
    difference: 0,
    difference_percentage: 0,
    difference_justification: "",

    // Estado
    status: "pendiente",
    has_alert: false,
  })

  // Cargar aperturas pendientes
  useEffect(() => {
    const fetchAperturasPendientes = async () => {
      try {
        const { data, error } = await supabase
          .from("cash_register_openings")
          .select("*")
          .eq("has_closing", false)
          .eq("status", "aprobado")
          .order("date", { ascending: false })

        if (error) throw error

        setAperturasPendientes(data || [])
      } catch (error) {
        console.error("Error al cargar aperturas pendientes:", error)
      }
    }

    fetchAperturasPendientes()
  }, [supabase])

  // Calcular el total de ventas
  useEffect(() => {
    const totalVentas =
      formData.cash_sales +
      formData.posnet_sales +
      formData.rappi_sales +
      formData.mercado_delivery_sales +
      formData.pedidos_ya_sales

    setFormData((prev) => ({
      ...prev,
      total_sales: totalVentas,
    }))
  }, [
    formData.cash_sales,
    formData.posnet_sales,
    formData.rappi_sales,
    formData.mercado_delivery_sales,
    formData.pedidos_ya_sales,
  ])

  // Calcular el total de efectivo basado en el desglose de billetes
  useEffect(() => {
    const total =
      formData.bills_20000 * 20000 +
      formData.bills_10000 * 10000 +
      formData.bills_2000 * 2000 +
      formData.bills_1000 * 1000 +
      formData.bills_500 * 500 +
      formData.bills_200 * 200 +
      formData.bills_100 * 100 +
      formData.bills_50 * 50 +
      formData.bills_20 * 20 +
      formData.bills_10 * 10

    setTotalEfectivoCalculado(total)

    setFormData((prev) => ({
      ...prev,
      actual_balance: total,
    }))
  }, [
    formData.bills_20000,
    formData.bills_10000,
    formData.bills_2000,
    formData.bills_1000,
    formData.bills_500,
    formData.bills_200,
    formData.bills_100,
    formData.bills_50,
    formData.bills_20,
    formData.bills_10,
  ])

  // Calcular totales de gastos y retiros - MODIFICADO para asegurar valores numéricos
  useEffect(() => {
    // Asegurarse de que todos los montos sean números válidos
    const totalGastos = gastos.reduce((sum, gasto) => {
      // Convertir explícitamente a número y verificar que sea válido
      const monto = Number(gasto.monto)
      return sum + (isNaN(monto) ? 0 : monto)
    }, 0)

    const totalRetiros = retiros.reduce((sum, retiro) => {
      // Convertir explícitamente a número y verificar que sea válido
      const monto = Number(retiro.monto)
      return sum + (isNaN(monto) ? 0 : monto)
    }, 0)

    // Log detallado para depuración
    console.log("Cálculo de gastos y retiros:", {
      gastos: gastos.map((g) => ({ concepto: g.concepto, monto: g.monto })),
      totalGastos,
      retiros: retiros.map((r) => ({ concepto: r.concepto, monto: r.monto })),
      totalRetiros,
    })

    setFormData((prev) => ({
      ...prev,
      total_expenses: totalGastos,
      total_withdrawals: totalRetiros,
    }))
  }, [gastos, retiros])

  // Calcular saldo esperado - COMPLETAMENTE REESCRITO
  useEffect(() => {
    // Asegurarse de que todos los valores sean números válidos
    const initialBalance = Number(formData.initial_balance) || 0
    const cashSales = Number(formData.cash_sales) || 0
    const totalExpenses = Number(formData.total_expenses) || 0
    const totalWithdrawals = Number(formData.total_withdrawals) || 0

    // El saldo esperado es: Saldo Inicial + Ventas en Efectivo - Total Gastos - Total Retiros
    const saldoEsperado = initialBalance + cashSales - totalExpenses - totalWithdrawals

    // Log detallado para depuración
    console.log("Cálculo detallado del saldo esperado:", {
      initialBalance,
      cashSales,
      totalExpenses,
      totalWithdrawals,
      formula: `${initialBalance} + ${cashSales} - ${totalExpenses} - ${totalWithdrawals} = ${saldoEsperado}`,
      resultado: saldoEsperado,
    })

    // Actualizar el estado con el nuevo saldo esperado
    setFormData((prev) => ({
      ...prev,
      expected_balance: saldoEsperado,
    }))
  }, [formData.initial_balance, formData.cash_sales, formData.total_expenses, formData.total_withdrawals])

  // Calcular diferencia y porcentaje
  useEffect(() => {
    // Asegurarse de que los valores sean números válidos
    const actualBalance = Number(formData.actual_balance) || 0
    const expectedBalance = Number(formData.expected_balance) || 0

    const diferencia = actualBalance - expectedBalance
    const porcentaje = expectedBalance !== 0 ? Math.abs((diferencia / expectedBalance) * 100) : 0

    setDiferencia(diferencia)
    setPorcentajeDiferencia(porcentaje)

    setFormData((prev) => ({
      ...prev,
      difference: diferencia,
      difference_percentage: porcentaje,
    }))

    // Si la diferencia es significativa, requerir supervisor
    setNeedsSupervisor(porcentaje > 10)

    // Log para depuración
    console.log("Cálculo de diferencia:", {
      actualBalance,
      expectedBalance,
      diferencia,
      porcentaje: porcentaje.toFixed(2) + "%",
      needsSupervisor: porcentaje > 10,
    })
  }, [formData.actual_balance, formData.expected_balance])

  // Calcular diferencia de Posnet y porcentaje
  useEffect(() => {
    const diferenciaPosnet = formData.posnet_impreso - formData.posnet_sales
    const porcentajePosnet =
      formData.posnet_sales !== 0 ? Math.abs((diferenciaPosnet / formData.posnet_sales) * 100) : 0

    setDiferenciaPosnet(diferenciaPosnet)
    setPorcentajeDiferenciaPosnet(porcentajePosnet)

    // Si la diferencia de Posnet es significativa, también requerir supervisor
    if (porcentajePosnet > 10) {
      setNeedsSupervisor(true)
    }
  }, [formData.posnet_impreso, formData.posnet_sales])

  // Manejar cambios en los campos del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Manejar cambios en campos numéricos
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    // Asegurarse de que el valor sea un número válido
    const numericValue = value === "" ? 0 : Number(value)

    if (isNaN(numericValue)) {
      console.error(`Valor inválido para ${name}: ${value}`)
      return
    }

    console.log(`Cambiando ${name} a: ${numericValue}`)

    setFormData((prev) => ({
      ...prev,
      [name]: numericValue,
    }))
  }

  // Manejar cambios en selects
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Si cambia el local, actualizar el nombre del local
    if (name === "local_id") {
      const selectedLocal = locales.find((local) => local.id === value)
      if (selectedLocal) {
        setFormData((prev) => ({
          ...prev,
          local_name: selectedLocal.name,
        }))
      }
    }

    // Si selecciona una apertura, cargar sus datos
    if (name === "opening_id" && value) {
      const selectedApertura = aperturasPendientes.find((apertura) => apertura.id === value)
      if (selectedApertura) {
        setFormData((prev) => ({
          ...prev,
          local_id: selectedApertura.local_id,
          local_name: selectedApertura.local_name,
          date: selectedApertura.date,
          shift: selectedApertura.shift,
          responsible: selectedApertura.responsible,
          initial_balance: selectedApertura.initial_amount,
        }))
      }
    }
  }

  // Manejar cambios en el nuevo gasto
  const handleGastoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setNuevoGasto((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? 0 : Number(value)) : value,
    }))
  }

  // Manejar cambio en checkbox
  const handleCheckboxChange = (checked: boolean) => {
    setNuevoGasto((prev) => ({
      ...prev,
      tieneComprobante: checked,
    }))
  }

  // Manejar cambios en el nuevo retiro
  const handleRetiroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setNuevoRetiro((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? 0 : Number(value)) : value,
    }))
  }

  // Agregar un nuevo gasto
  const agregarGasto = () => {
    if (!nuevoGasto.concepto || nuevoGasto.monto <= 0) {
      toast({
        title: "Error",
        description: "Debes ingresar un concepto y un monto válido",
        variant: "destructive",
      })
      return
    }

    const gastoConId = {
      ...nuevoGasto,
      id: Date.now().toString(),
    }

    setGastos([...gastos, gastoConId])
    setNuevoGasto({
      id: "",
      concepto: "",
      monto: 0,
      tieneComprobante: false,
    })

    // Mostrar confirmación
    toast({
      title: "Gasto agregado",
      description: `Se agregó el gasto "${gastoConId.concepto}" por $${gastoConId.monto}`,
    })
  }

  // Eliminar un gasto
  const eliminarGasto = (id: string) => {
    const gastoAEliminar = gastos.find((g) => g.id === id)
    setGastos(gastos.filter((gasto) => gasto.id !== id))

    // Mostrar confirmación
    if (gastoAEliminar) {
      toast({
        title: "Gasto eliminado",
        description: `Se eliminó el gasto "${gastoAEliminar.concepto}" por $${gastoAEliminar.monto}`,
      })
    }
  }

  // Agregar un nuevo retiro
  const agregarRetiro = () => {
    if (!nuevoRetiro.concepto || nuevoRetiro.monto <= 0 || !nuevoRetiro.autorizadoPor) {
      toast({
        title: "Error",
        description: "Debes completar todos los campos del retiro",
        variant: "destructive",
      })
      return
    }

    const retiroConId = {
      ...nuevoRetiro,
      id: Date.now().toString(),
    }

    setRetiros([...retiros, retiroConId])
    setNuevoRetiro({
      id: "",
      concepto: "",
      monto: 0,
      autorizadoPor: "",
    })

    // Mostrar confirmación
    toast({
      title: "Retiro agregado",
      description: `Se agregó el retiro "${retiroConId.concepto}" por $${retiroConId.monto}`,
    })
  }

  // Eliminar un retiro
  const eliminarRetiro = (id: string) => {
    const retiroAEliminar = retiros.find((r) => r.id === id)
    setRetiros(retiros.filter((retiro) => retiro.id !== id))

    // Mostrar confirmación
    if (retiroAEliminar) {
      toast({
        title: "Retiro eliminado",
        description: `Se eliminó el retiro "${retiroAEliminar.concepto}" por $${retiroAEliminar.monto}`,
      })
    }
  }

  // Modificar la función validateForm para agregar más logs de depuración
  const validateForm = () => {
    console.log("Iniciando validación del formulario", formData)

    if (!formData.local_id) {
      console.log("Error: Local no seleccionado")
      toast({
        title: "Error",
        description: "Debes seleccionar un local",
        variant: "destructive",
      })
      return false
    }

    if (!formData.responsible) {
      console.log("Error: Responsable no ingresado")
      toast({
        title: "Error",
        description: "Debes ingresar el nombre del responsable",
        variant: "destructive",
      })
      return false
    }

    console.log("Ventas totales:", formData.total_sales)
    if (formData.total_sales <= 0) {
      console.log("Error: Total de ventas debe ser mayor a cero")
      toast({
        title: "Error",
        description: "El total de ventas debe ser mayor a cero",
        variant: "destructive",
      })
      return false
    }

    console.log("Diferencia:", diferencia, "Justificación:", formData.difference_justification)
    if (Math.abs(diferencia) > 0 && !formData.difference_justification) {
      console.log("Error: Falta justificación para la diferencia")
      toast({
        title: "Error",
        description: "Debes justificar la diferencia en el saldo",
        variant: "destructive",
      })
      return false
    }

    console.log(
      "Necesita supervisor:",
      needsSupervisor,
      "Supervisor:",
      formData.supervisor,
      "PIN:",
      formData.supervisor_pin,
    )
    if (needsSupervisor && (!formData.supervisor || !formData.supervisor_pin)) {
      console.log("Error: Falta información del supervisor")
      toast({
        title: "Error",
        description: "Se requiere autorización del supervisor para diferencias significativas",
        variant: "destructive",
      })
      return false
    }

    console.log("Validación exitosa")
    return true
  }

  // También modificar el handleSubmitClick para asegurar que el evento se maneje correctamente
  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Botón de guardar cierre clickeado")

    // Asegurarse de que el formulario sea válido
    const isValid = validateForm()
    console.log("¿El formulario es válido?", isValid)

    if (!isValid) {
      console.log("Validación del formulario fallida")
      return
    }

    console.log("Mostrando diálogo de confirmación")
    setShowConfirmDialog(true)
  }

  // Guardar el cierre de caja
  const handleSubmit = async () => {
    console.log("Iniciando proceso de guardado")
    try {
      setIsLoading(true)
      setShowConfirmDialog(false)

      // Verificar si ya existe una apertura para este local, fecha y turno
      if (!formData.opening_id) {
        console.log("No hay apertura seleccionada, verificando existentes")

        try {
          const { data: existingOpenings, error: checkError } = await supabase
            .from("cash_register_openings")
            .select("*")
            .eq("local_id", formData.local_id)
            .eq("date", formData.date)
            .eq("shift", formData.shift)
            .eq("has_closing", false)

          console.log("Resultado de verificación:", { existingOpenings, checkError })

          if (checkError) {
            console.error("Error al verificar aperturas existentes:", checkError)
            throw new Error("Error al verificar aperturas existentes")
          }

          if (existingOpenings && existingOpenings.length > 0) {
            // Si existe una apertura, usarla
            console.log("Apertura existente encontrada:", existingOpenings[0])
            formData.opening_id = existingOpenings[0].id
            formData.initial_balance = existingOpenings[0].initial_amount
          }
        } catch (checkErr) {
          console.error("Error en la verificación de aperturas:", checkErr)
          // Continuar con el proceso aunque falle la verificación
        }
      }

      // 1. Guardar el cierre de caja
      const cierreData = {
        opening_id: formData.opening_id || null,
        local_id: formData.local_id,
        local_name: formData.local_name,
        date: formData.date,
        shift: formData.shift,
        responsible: formData.responsible,
        supervisor: needsSupervisor ? formData.supervisor : null,
        supervisor_pin: needsSupervisor ? formData.supervisor_pin : null,

        // Mapear los campos de ventas a los nombres correctos en la tabla
        total_sales: formData.total_sales,
        cash_sales: formData.cash_sales,
        credit_card_sales: formData.posnet_sales, // Mapear posnet_sales a credit_card_sales
        posnet_impreso: formData.posnet_impreso, // Nuevo campo para Posnet Impreso
        debit_card_sales: formData.rappi_sales, // Mapear rappi_sales a debit_card_sales
        transfer_sales: formData.mercado_delivery_sales, // Mapear mercado_delivery_sales a transfer_sales
        mercado_pago_sales: formData.pedidos_ya_sales, // Mapear pedidos_ya_sales a mercado_pago_sales
        other_sales: 0, // Valor por defecto

        // Mapear solo los campos de billetes que existen en la tabla
        bills_1000: formData.bills_1000,
        bills_500: formData.bills_500,
        bills_200: formData.bills_200,
        bills_100: formData.bills_100,
        bills_50: formData.bills_50,
        bills_20: formData.bills_20,
        bills_10: formData.bills_10,
        coins: 0, // Valor por defecto para monedas

        // Cálculos
        initial_balance: formData.initial_balance,
        total_expenses: formData.total_expenses,
        total_withdrawals: formData.total_withdrawals,
        expected_balance: formData.expected_balance,
        actual_balance: formData.actual_balance,
        difference: diferencia,
        difference_percentage: porcentajeDiferencia,
        difference_justification: formData.difference_justification,

        // Nuevos campos para Posnet
        posnet_difference: diferenciaPosnet,
        posnet_difference_percentage: porcentajeDiferenciaPosnet,

        // Estado
        status: needsSupervisor ? "pendiente" : "aprobado",
        has_alert: Math.abs(porcentajeDiferencia) > 0.5 || Math.abs(porcentajeDiferenciaPosnet) > 0.5,

        // Gastos y retiros como JSON
        expenses: JSON.stringify(gastos),
        withdrawals: JSON.stringify(retiros),
      }

      console.log("Guardando cierre de caja:", cierreData)

      // Insertar en la base de datos
      try {
        const { data: cierreInsertado, error: cierreError } = await supabase
          .from("cash_register_closings")
          .insert(cierreData)
          .select("id")
          .single()

        console.log("Respuesta de inserción:", { cierreInsertado, cierreError })

        if (cierreError) {
          console.error("Error al insertar cierre:", cierreError)
          throw cierreError
        }

        console.log("Cierre insertado correctamente:", cierreInsertado)

        // 2. Actualizar la apertura si existe
        if (formData.opening_id) {
          console.log("Actualizando apertura:", formData.opening_id)
          try {
            const { error: aperturaError } = await supabase
              .from("cash_register_openings")
              .update({ has_closing: true })
              .eq("id", formData.opening_id)

            if (aperturaError) {
              console.error("Error al actualizar apertura:", aperturaError)
            }
          } catch (updateErr) {
            console.error("Error en la actualización de apertura:", updateErr)
          }
        }

        // 3. Generar alertas si es necesario
        if (Math.abs(porcentajeDiferencia) > 0.5 || Math.abs(porcentajeDiferenciaPosnet) > 0.5) {
          const alertLevel =
            Math.abs(porcentajeDiferencia) > 2 || Math.abs(porcentajeDiferenciaPosnet) > 2 ? "high" : "medium"

          const alertaData = {
            cash_register_id: cierreInsertado.id,
            type: "diferencia_caja",
            alert_level: alertLevel,
            message: `Diferencia ${diferencia > 0 ? "positiva" : "negativa"} de ${Math.abs(diferencia)} (${Math.abs(porcentajeDiferencia).toFixed(2)}%)`,
            details: JSON.stringify({
              amount: Math.abs(diferencia),
              percentage: Math.abs(porcentajeDiferencia),
              expected: formData.expected_balance,
              actual: formData.actual_balance,
              posnet_difference: diferenciaPosnet,
              posnet_difference_percentage: porcentajeDiferenciaPosnet,
            }),
            status: "pending",
            local_id: formData.local_id,
            local_name: formData.local_name,
            created_at: new Date().toISOString(),
          }

          console.log("Generando alerta:", alertaData)
          try {
            const { error: alertaError } = await supabase.from("cash_register_alerts").insert(alertaData)

            if (alertaError) {
              console.error("Error al generar alerta:", alertaError)
            }
          } catch (alertErr) {
            console.error("Error en la generación de alerta:", alertErr)
          }
        }

        toast({
          title: "Cierre registrado",
          description: "El cierre de caja se ha registrado correctamente",
        })

        // Redireccionar a la página de cajas
        console.log("Redireccionando a /caja")
        router.push("/caja")
      } catch (insertErr) {
        console.error("Error en la inserción del cierre:", insertErr)
        throw insertErr
      }
    } catch (error) {
      console.error("Error general al guardar el cierre:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al registrar el cierre de caja",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout isLoading={isLoading}>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Cierre de Caja</h1>
          <Button variant="outline" onClick={() => router.push("/caja")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>

        <form onSubmit={handleSubmitClick}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="ventas">Ventas</TabsTrigger>
              <TabsTrigger value="gastos">Gastos y Retiros</TabsTrigger>
              <TabsTrigger value="efectivo">Efectivo</TabsTrigger>
              <TabsTrigger value="balance">Balance Final</TabsTrigger>
            </TabsList>

            {/* Pestaña de Ventas */}
            <TabsContent value="ventas" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información general */}
                <Card>
                  <CardHeader>
                    <CardTitle>Información General</CardTitle>
                    <CardDescription>Datos básicos del cierre</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {aperturasPendientes.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="opening_id">Apertura Pendiente</Label>
                        <Select
                          name="opening_id"
                          value={formData.opening_id}
                          onValueChange={(value) => handleSelectChange("opening_id", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar apertura" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nueva">Nueva apertura</SelectItem>
                            {aperturasPendientes.map((apertura) => (
                              <SelectItem key={apertura.id} value={apertura.id}>
                                {apertura.local_name} - {apertura.date} ({apertura.shift})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="local_id">Local</Label>
                      <Select
                        name="local_id"
                        value={formData.local_id}
                        onValueChange={(value) => handleSelectChange("local_id", value)}
                        disabled={!!formData.opening_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar local" />
                        </SelectTrigger>
                        <SelectContent>
                          {locales.map((local) => (
                            <SelectItem key={local.id} value={local.id}>
                              {local.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date">Fecha</Label>
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        disabled={!!formData.opening_id}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shift">Turno</Label>
                      <Select
                        name="shift"
                        value={formData.shift}
                        onValueChange={(value) => handleSelectChange("shift", value)}
                        disabled={!!formData.opening_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar turno" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mañana">Mañana</SelectItem>
                          <SelectItem value="tarde">Tarde</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="responsible">Responsable de Caja</Label>
                      <Input
                        id="responsible"
                        name="responsible"
                        value={formData.responsible}
                        onChange={handleInputChange}
                        placeholder="Nombre del responsable"
                        disabled={!!formData.opening_id}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="initial_balance">Saldo Inicial</Label>
                      <Input
                        id="initial_balance"
                        name="initial_balance"
                        type="number"
                        min="0"
                        value={formData.initial_balance || ""}
                        onChange={handleNumberChange}
                        disabled={!!formData.opening_id}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Desglose de ventas */}
                <Card>
                  <CardHeader>
                    <CardTitle>Desglose de Ventas</CardTitle>
                    <CardDescription>Detalle por método de pago</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cash_sales">Efectivo</Label>
                      <Input
                        id="cash_sales"
                        name="cash_sales"
                        type="number"
                        min="0"
                        value={formData.cash_sales || ""}
                        onChange={handleNumberChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="posnet_sales">Posnet</Label>
                      <Input
                        id="posnet_sales"
                        name="posnet_sales"
                        type="number"
                        min="0"
                        value={formData.posnet_sales || ""}
                        onChange={handleNumberChange}
                      />
                    </div>

                    {/* Nuevo campo Posnet Impreso */}
                    <div className="space-y-2">
                      <Label htmlFor="posnet_impreso">Posnet Impreso</Label>
                      <Input
                        id="posnet_impreso"
                        name="posnet_impreso"
                        type="number"
                        min="0"
                        value={formData.posnet_impreso || ""}
                        onChange={handleNumberChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rappi_sales">Rappi</Label>
                      <Input
                        id="rappi_sales"
                        name="rappi_sales"
                        type="number"
                        min="0"
                        value={formData.rappi_sales || ""}
                        onChange={handleNumberChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mercado_delivery_sales">MercadoDelivery</Label>
                      <Input
                        id="mercado_delivery_sales"
                        name="mercado_delivery_sales"
                        type="number"
                        min="0"
                        value={formData.mercado_delivery_sales || ""}
                        onChange={handleNumberChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pedidos_ya_sales">PedidosYa</Label>
                      <Input
                        id="pedidos_ya_sales"
                        name="pedidos_ya_sales"
                        type="number"
                        min="0"
                        value={formData.pedidos_ya_sales || ""}
                        onChange={handleNumberChange}
                      />
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Ventas:</span>
                        <span className="text-xl font-bold">${formData.total_sales.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button type="button" onClick={() => setActiveTab("efectivo")}>
                      Continuar
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            {/* Pestaña de Efectivo */}
            <TabsContent value="efectivo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Desglose de Efectivo</CardTitle>
                  <CardDescription>Conteo final de efectivo en caja</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bills_20000">Billetes de $20000</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="bills_20000"
                            name="bills_20000"
                            type="number"
                            min="0"
                            value={formData.bills_20000 || ""}
                            onChange={handleNumberChange}
                          />
                          <span className="text-sm font-medium">= ${formData.bills_20000 * 20000}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bills_10000">Billetes de $10000</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="bills_10000"
                            name="bills_10000"
                            type="number"
                            min="0"
                            value={formData.bills_10000 || ""}
                            onChange={handleNumberChange}
                          />
                          <span className="text-sm font-medium">= ${formData.bills_10000 * 10000}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bills_2000">Billetes de $2000</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="bills_2000"
                            name="bills_2000"
                            type="number"
                            min="0"
                            value={formData.bills_2000 || ""}
                            onChange={handleNumberChange}
                          />
                          <span className="text-sm font-medium">= ${formData.bills_2000 * 2000}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bills_1000">Billetes de $1000</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="bills_1000"
                            name="bills_1000"
                            type="number"
                            min="0"
                            value={formData.bills_1000 || ""}
                            onChange={handleNumberChange}
                          />
                          <span className="text-sm font-medium">= ${formData.bills_1000 * 1000}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bills_500">Billetes de $500</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="bills_500"
                            name="bills_500"
                            type="number"
                            min="0"
                            value={formData.bills_500 || ""}
                            onChange={handleNumberChange}
                          />
                          <span className="text-sm font-medium">= ${formData.bills_500 * 500}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bills_200">Billetes de $200</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="bills_200"
                            name="bills_200"
                            type="number"
                            min="0"
                            value={formData.bills_200 || ""}
                            onChange={handleNumberChange}
                          />
                          <span className="text-sm font-medium">= ${formData.bills_200 * 200}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bills_100">Billetes de $100</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="bills_100"
                            name="bills_100"
                            type="number"
                            min="0"
                            value={formData.bills_100 || ""}
                            onChange={handleNumberChange}
                          />
                          <span className="text-sm font-medium">= ${formData.bills_100 * 100}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bills_50">Billetes de $50</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="bills_50"
                            name="bills_50"
                            type="number"
                            min="0"
                            value={formData.bills_50 || ""}
                            onChange={handleNumberChange}
                          />
                          <span className="text-sm font-medium">= ${formData.bills_50 * 50}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bills_20">Billetes de $20</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="bills_20"
                            name="bills_20"
                            type="number"
                            min="0"
                            value={formData.bills_20 || ""}
                            onChange={handleNumberChange}
                          />
                          <span className="text-sm font-medium">= ${formData.bills_20 * 20}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bills_10">Billetes de $10</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="bills_10"
                            name="bills_10"
                            type="number"
                            min="0"
                            value={formData.bills_10 || ""}
                            onChange={handleNumberChange}
                          />
                          <span className="text-sm font-medium">= ${formData.bills_10 * 10}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Efectivo en Caja:</span>
                      <span className="text-xl font-bold">${totalEfectivoCalculado.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("ventas")}>
                    Anterior
                  </Button>
                  <Button type="button" onClick={() => setActiveTab("gastos")}>
                    Continuar
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Pestaña de Gastos y Retiros */}
            <TabsContent value="gastos" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gastos */}
                <Card>
                  <CardHeader>
                    <CardTitle>Gastos</CardTitle>
                    <CardDescription>Registro de gastos realizados</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {gastos.map((gasto) => (
                      <div key={gasto.id} className="flex items-center justify-between py-2 border-b">
                        <div>
                          <p className="font-medium">{gasto.concepto}</p>
                          <p className="text-sm text-gray-500">${gasto.monto.toLocaleString()}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => eliminarGasto(gasto.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    <div className="space-y-2">
                      <Label htmlFor="nuevo_gasto_concepto">Nuevo Gasto</Label>
                      <Input
                        id="nuevo_gasto_concepto"
                        name="concepto"
                        placeholder="Concepto del gasto"
                        value={nuevoGasto.concepto}
                        onChange={handleGastoChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nuevo_gasto_monto">Monto</Label>
                      <Input
                        id="nuevo_gasto_monto"
                        name="monto"
                        type="number"
                        placeholder="Monto del gasto"
                        value={nuevoGasto.monto || ""}
                        onChange={handleGastoChange}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tiene_comprobante"
                        checked={nuevoGasto.tieneComprobante}
                        onCheckedChange={handleCheckboxChange}
                      />
                      <Label htmlFor="tiene_comprobante">Tiene Comprobante</Label>
                    </div>

                    <Button className="w-full" onClick={agregarGasto}>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Gasto
                    </Button>
                  </CardContent>
                </Card>

                {/* Retiros */}
                <Card>
                  <CardHeader>
                    <CardTitle>Retiros</CardTitle>
                    <CardDescription>Registro de retiros de efectivo</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {retiros.map((retiro) => (
                      <div key={retiro.id} className="flex items-center justify-between py-2 border-b">
                        <div>
                          <p className="font-medium">{retiro.concepto}</p>
                          <p className="text-sm text-gray-500">Autorizado por: {retiro.autorizadoPor}</p>
                          <p className="text-sm text-gray-500">${retiro.monto.toLocaleString()}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => eliminarRetiro(retiro.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    <div className="space-y-2">
                      <Label htmlFor="nuevo_retiro_concepto">Nuevo Retiro</Label>
                      <Input
                        id="nuevo_retiro_concepto"
                        name="concepto"
                        placeholder="Concepto del retiro"
                        value={nuevoRetiro.concepto}
                        onChange={handleRetiroChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nuevo_retiro_monto">Monto</Label>
                      <Input
                        id="nuevo_retiro_monto"
                        name="monto"
                        type="number"
                        placeholder="Monto del retiro"
                        value={nuevoRetiro.monto || ""}
                        onChange={handleRetiroChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nuevo_retiro_autorizado_por">Autorizado por</Label>
                      <Input
                        id="nuevo_retiro_autorizado_por"
                        name="autorizadoPor"
                        placeholder="Nombre de quien autoriza"
                        value={nuevoRetiro.autorizadoPor}
                        onChange={handleRetiroChange}
                      />
                    </div>

                    <Button className="w-full" onClick={agregarRetiro}>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Retiro
                    </Button>
                  </CardContent>
                </Card>
              </div>
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setActiveTab("efectivo")}>
                  Anterior
                </Button>
                <Button type="button" onClick={() => setActiveTab("balance")}>
                  Continuar
                </Button>
              </div>
            </TabsContent>

            {/* Pestaña de Balance Final */}
            <TabsContent value="balance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Balance Final</CardTitle>
                  <CardDescription>Resumen del cierre de caja</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Total Ventas:</Label>
                      <Input type="text" value={`$${formData.total_sales.toLocaleString()}`} readOnly />
                    </div>
                    <div>
                      <Label>Saldo Inicial:</Label>
                      <Input type="text" value={`$${formData.initial_balance.toLocaleString()}`} readOnly />
                    </div>
                    <div>
                      <Label>Total Gastos:</Label>
                      <Input type="text" value={`$${formData.total_expenses.toLocaleString()}`} readOnly />
                    </div>
                    <div>
                      <Label>Total Retiros:</Label>
                      <Input type="text" value={`$${formData.total_withdrawals.toLocaleString()}`} readOnly />
                    </div>
                  </div>

                  {/* Sección de Efectivo */}
                  <div className="mt-4 p-4 border rounded-md">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-medium">Balance de Efectivo</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCalculationDetails(!showCalculationDetails)}
                        className="flex items-center gap-1 text-xs"
                      >
                        <Info className="h-4 w-4" />
                        {showCalculationDetails ? "Ocultar detalles" : "Ver detalles del cálculo"}
                      </Button>
                    </div>

                    {showCalculationDetails && (
                      <div className="mb-4 p-3 bg-muted/30 rounded-md text-sm">
                        <p className="font-medium mb-2">Cálculo del saldo esperado:</p>
                        <div className="space-y-1">
                          <p>Saldo Inicial: ${formData.initial_balance.toLocaleString()}</p>
                          <p>+ Ventas en Efectivo: ${formData.cash_sales.toLocaleString()}</p>
                          <p>- Total Gastos: ${formData.total_expenses.toLocaleString()}</p>
                          <p>- Total Retiros: ${formData.total_withdrawals.toLocaleString()}</p>
                          <div className="border-t pt-1 mt-1">
                            <p className="font-medium">
                              = Saldo Esperado: ${formData.expected_balance.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Saldo Esperado (Efectivo):</Label>
                        <Input type="text" value={`$${formData.expected_balance.toLocaleString()}`} readOnly />
                      </div>
                      <div>
                        <Label>Saldo Real (Efectivo):</Label>
                        <Input type="text" value={`$${formData.actual_balance.toLocaleString()}`} readOnly />
                      </div>
                    </div>

                    <div className="mt-3 p-3 border rounded-md bg-amber-500/10">
                      <div className="flex items-center space-x-2">
                        {diferencia !== 0 ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        <Label className="text-sm font-medium">
                          Diferencia Efectivo:{" "}
                          <span
                            className={diferencia !== 0 ? (diferencia > 0 ? "text-green-600" : "text-red-600") : ""}
                          >
                            ${diferencia.toLocaleString()} ({porcentajeDiferencia.toFixed(2)}%)
                          </span>
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Nueva Sección de Posnet */}
                  <div className="mt-4 p-4 border rounded-md">
                    <h3 className="text-lg font-medium mb-3">Balance de Posnet</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Posnet Esperado:</Label>
                        <Input type="text" value={`$${formData.posnet_sales.toLocaleString()}`} readOnly />
                      </div>
                      <div>
                        <Label>Posnet Real (Impreso):</Label>
                        <Input type="text" value={`$${formData.posnet_impreso.toLocaleString()}`} readOnly />
                      </div>
                    </div>

                    <div className="mt-3 p-3 border rounded-md bg-amber-500/10">
                      <div className="flex items-center space-x-2">
                        {diferenciaPosnet !== 0 ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        <Label className="text-sm font-medium">
                          Diferencia Posnet:{" "}
                          <span
                            className={
                              diferenciaPosnet !== 0 ? (diferenciaPosnet > 0 ? "text-green-600" : "text-red-600") : ""
                            }
                          >
                            ${diferenciaPosnet.toLocaleString()} ({porcentajeDiferenciaPosnet.toFixed(2)}%)
                          </span>
                        </Label>
                      </div>
                    </div>
                  </div>

                  {(diferencia !== 0 || diferenciaPosnet !== 0) && (
                    <div className="mt-4">
                      <Label htmlFor="difference_justification">Justificación de la diferencia:</Label>
                      <Textarea
                        id="difference_justification"
                        placeholder="Justificación de la diferencia"
                        name="difference_justification"
                        value={formData.difference_justification}
                        onChange={handleInputChange}
                        className="mt-2"
                      />
                    </div>
                  )}

                  {needsSupervisor && (
                    <div className="mt-6 p-4 border rounded-md bg-red-500/10">
                      <p className="text-sm font-medium text-red-500">Se requiere autorización del supervisor</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="supervisor">Nombre del Supervisor</Label>
                          <Input
                            id="supervisor"
                            name="supervisor"
                            placeholder="Nombre del supervisor"
                            value={formData.supervisor}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="supervisor_pin">PIN del Supervisor</Label>
                          <Input
                            id="supervisor_pin"
                            name="supervisor_pin"
                            type="password"
                            placeholder="PIN del supervisor"
                            value={formData.supervisor_pin}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("gastos")}>
                    Anterior
                  </Button>
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cierre
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </form>

        {/* Diálogo de confirmación */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar cierre de caja</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas finalizar el cierre de caja? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex justify-between font-medium">
                <span>Total Ventas:</span>
                <span>${formData.total_sales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Saldo Esperado:</span>
                <span>${formData.expected_balance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Saldo Real:</span>
                <span>${formData.actual_balance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Diferencia Efectivo:</span>
                <span className={diferencia !== 0 ? (diferencia > 0 ? "text-green-600" : "text-red-600") : ""}>
                  ${diferencia.toLocaleString()}
                </span>
              </div>
              {/* Agregar información de Posnet al diálogo de confirmación */}
              <div className="flex justify-between font-medium">
                <span>Posnet Esperado:</span>
                <span>${formData.posnet_sales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Posnet Real (Impreso):</span>
                <span>${formData.posnet_impreso.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Diferencia Posnet:</span>
                <span
                  className={diferenciaPosnet !== 0 ? (diferenciaPosnet > 0 ? "text-green-600" : "text-red-600") : ""}
                >
                  ${diferenciaPosnet.toLocaleString()}
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={() => handleSubmit()} disabled={isLoading}>
                <CheckCircle className="mr-2 h-4 w-4" />
                {isLoading ? "Guardando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
