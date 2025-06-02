"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { DashboardLayout } from "@/app/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, Save, Plus, Check, AlertTriangle, Lock, Download, List, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase/client"

// Tipos
type Location = {
  id: number
  name: string
}

type Manager = {
  id: string // UUID del encargado
  name: string
  local: string
}

type ProductConfig = {
  id: number
  product_name: string
  unit_value: number
  category: string
  has_internal_consumption: boolean
}

type StockSheetData = {
  id?: number
  date: string
  location_id: number
  manager_id: string // UUID del encargado
  shift: "mañana" | "tarde"
  status: "borrador" | "parcial" | "completado"
  created_by: string
  updated_by: string
}

type ProductStockData = {
  id?: number
  stock_sheet_id?: number
  product_id: number
  product_name: string
  category: string
  unit_value: number

  // Datos que carga el encargado
  opening_quantity: number | null
  opening_locked: boolean
  incoming_quantity: number | null
  incoming_locked: boolean
  closing_quantity: number | null

  closing_locked: boolean

  // Datos que carga el administrador
  units_sold: number | null
  discarded_quantity: number | null
  internal_consumption: number | null

  // Cálculos
  difference: number | null
  has_internal_consumption: boolean
}

// Lista fija de locales
const FIXED_LOCATIONS: Location[] = [
  { id: 1, name: "BR Cabildo" },
  { id: 2, name: "BR Carranza" },
  { id: 3, name: "BR Pacífico" },
  { id: 4, name: "BR Lavalle" },
  { id: 5, name: "BR Rivadavia" },
  { id: 6, name: "BR Aguero" },
]

export default function StockMatrixPageContent() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<"encargado" | "administrador">("encargado")
  const [isLoading, setIsLoading] = useState(true)
  const [locations] = useState<Location[]>(FIXED_LOCATIONS)
  const [allManagers, setAllManagers] = useState<Manager[]>([])
  const [filteredManagers, setFilteredManagers] = useState<Manager[]>([])
  const [productConfigs, setProductConfigs] = useState<ProductConfig[]>([])
  const [stockData, setStockData] = useState<ProductStockData[]>([])
  const [showIncomingDialog, setShowIncomingDialog] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [incomingAmount, setIncomingAmount] = useState<number>(0)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authChecking, setAuthChecking] = useState(true)

  // Estado para los datos de la planilla
  const [sheetData, setSheetData] = useState<StockSheetData>({
    date: format(new Date(), "yyyy-MM-dd"),
    location_id: 0,
    manager_id: "", // UUID del encargado
    shift: "mañana",
    status: "borrador",
    created_by: "Usuario Actual",
    updated_by: "Usuario Actual",
  })

  // Reemplazar todo el useEffect de verificación de autenticación con esta versión simplificada
  useEffect(() => {
    // Cargar datos directamente sin verificación estricta de autenticación
    fetchData()
  }, [])

  // Reemplazar la función fetchData con esta versión simplificada que no verifica autenticación
  async function fetchData() {
    try {
      setIsLoading(true)
      setError(null)
      console.log("Cargando datos...")

      // Variable para almacenar un ID de encargado predeterminado
      let defaultManagerId = ""

      // Fetch encargados desde la tabla de empleados
      try {
        const { data: employeesData, error: employeesError } = await supabase
          .from("employees")
          .select("id, first_name, last_name, local, position, status")
          .eq("status", "active")
          .order("last_name")

        if (employeesError) {
          console.error("Error al cargar empleados:", employeesError)
          toast({
            title: "Error",
            description: "No se pudieron cargar los empleados",
            variant: "destructive",
          })
        } else {
          // Filtrar los encargados y supervisores manualmente con más flexibilidad
          const filteredEmployees = (employeesData || []).filter((emp) => {
            if (!emp.position) return false

            const positionLower = emp.position.toLowerCase()
            return (
              positionLower.includes("encargad") || // Captura "encargado" y "encargada"
              positionLower.includes("supervisor")
            )
          })

          // Agregar un log para depuración
          console.log("Empleados filtrados:", filteredEmployees)

          // Guardar el primer ID como predeterminado si existe
          if (filteredEmployees.length > 0) {
            defaultManagerId = filteredEmployees[0].id
            console.log("ID de encargado predeterminado:", defaultManagerId)
          } else {
            // Si no hay encargados, intentar obtener cualquier empleado
            const { data: anyEmployee } = await supabase.from("employees").select("id").limit(1).single()

            if (anyEmployee) {
              defaultManagerId = anyEmployee.id
              console.log("ID de empleado predeterminado:", defaultManagerId)
            }
          }

          // Transformar los datos de empleados al formato de Manager
          const managers: Manager[] = filteredEmployees.map((emp) => ({
            id: emp.id,
            name: `${emp.first_name} ${emp.last_name}`,
            local: emp.local,
          }))

          setAllManagers(managers)

          // Si ya hay un local seleccionado, filtrar los encargados
          if (sheetData.location_id) {
            const selectedLocation = locations.find((loc) => loc.id === sheetData.location_id)
            if (selectedLocation) {
              const filtered = managers.filter((manager) => manager.local === selectedLocation.name)
              setFilteredManagers(filtered)
            }
          } else {
            setFilteredManagers(managers)
          }
        }
      } catch (err) {
        console.error("Error al procesar empleados:", err)
        // No interrumpir el flujo, continuar con los productos
      }

      // Actualizar el estado con el ID predeterminado
      if (defaultManagerId) {
        setSheetData((prev) => ({
          ...prev,
          manager_id: prev.manager_id || defaultManagerId,
        }))
      }

      // Resto del código de fetchData...
      // Fetch product configs
      try {
        const { data: productConfigsData, error: productConfigsError } = await supabase
          .from("product_config")
          .select("id, product_name, unit_value, category, has_internal_consumption")
          .eq("active", true)
          .order("category", { ascending: true })
          .order("id", { ascending: true })

        if (productConfigsError) {
          console.error("Error al cargar productos:", productConfigsError)
          toast({
            title: "Error",
            description: "No se pudieron cargar los productos",
            variant: "destructive",
          })
        } else if (productConfigsData && productConfigsData.length > 0) {
          setProductConfigs(productConfigsData)

          // Inicializar datos de stock para cada producto
          const initialStockData: ProductStockData[] = productConfigsData.map((product) => ({
            product_id: product.id,
            product_name: product.product_name,
            category: product.category,
            unit_value: product.unit_value,
            has_internal_consumption: product.has_internal_consumption,

            opening_quantity: null,
            opening_locked: false,
            incoming_quantity: null,
            incoming_locked: false,
            closing_quantity: null,
            closing_locked: false,

            units_sold: null,
            discarded_quantity: null,
            internal_consumption: null,

            difference: null,
          }))

          setStockData(initialStockData)
        } else {
          toast({
            title: "Advertencia",
            description: "No hay productos configurados en el sistema",
            variant: "warning",
          })
        }
      } catch (err) {
        console.error("Error al procesar productos:", err)
        setError("Error al cargar los productos. Por favor, recargue la página.")
      }

      setDataLoaded(true)
    } catch (error: any) {
      console.error("Error fetching data:", error.message)
      setError("Error al cargar los datos. Por favor, recargue la página.")
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos necesarios",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setAuthChecking(false)
    }

    // Verificar si hay un ID en la URL para cargar una planilla existente
    const params = new URLSearchParams(window.location.search)
    const sheetId = params.get("id")
    if (sheetId) {
      loadExistingSheet(Number.parseInt(sheetId))
    }
  }

  // Filtrar encargados cuando cambia el local seleccionado
  useEffect(() => {
    try {
      if (sheetData.location_id && allManagers.length > 0) {
        const selectedLocation = locations.find((loc) => loc.id === sheetData.location_id)
        if (selectedLocation) {
          const filtered = allManagers.filter((manager) => manager.local === selectedLocation.name)
          setFilteredManagers(filtered)

          // Si el encargado actual no pertenece al local seleccionado, resetear la selección
          if (sheetData.manager_id) {
            const currentManagerStillValid = filtered.some((m) => m.id === sheetData.manager_id)
            if (!currentManagerStillValid) {
              setSheetData((prev) => ({
                ...prev,
                manager_id: "",
              }))
            }
          }
        }
      } else {
        setFilteredManagers(allManagers)
      }
    } catch (err) {
      console.error("Error al filtrar encargados:", err)
      // No mostrar error al usuario para no interrumpir la experiencia
    }
  }, [sheetData.location_id, allManagers, locations])

  // Manejar cambios en los campos del formulario principal
  const handleSheetDataChange = (name: string, value: any) => {
    try {
      console.log(`Cambiando ${name} a:`, value)

      // Solo convertir a número el location_id
      if (name === "location_id") {
        const numValue = typeof value === "string" ? Number.parseInt(value, 10) : value
        setSheetData((prev) => ({
          ...prev,
          [name]: numValue,
        }))
      } else {
        // Para manager_id y otros campos, usar el valor tal cual
        setSheetData((prev) => ({
          ...prev,
          [name]: value,
        }))
      }
    } catch (err) {
      console.error(`Error al cambiar ${name}:`, err)
    }
  }

  // Manejar cambios en los datos de stock
  const handleStockDataChange = (productId: number, field: string, value: number | null) => {
    try {
      setStockData((prev) => prev.map((item) => (item.product_id === productId ? { ...item, [field]: value } : item)))
    } catch (err) {
      console.error(`Error al cambiar ${field} para producto ${productId}:`, err)
    }
  }

  // Bloquear un campo después de guardarlo
  const handleLockField = (productId: number, field: "opening" | "incoming" | "closing") => {
    try {
      setStockData((prev) =>
        prev.map((item) => (item.product_id === productId ? { ...item, [`${field}_locked`]: true } : item)),
      )

      toast({
        title: "Campo bloqueado",
        description: `El valor ha sido guardado y bloqueado para edición`,
      })
    } catch (err) {
      console.error(`Error al bloquear ${field} para producto ${productId}:`, err)
    }
  }

  // Abrir diálogo para agregar ingreso de mercadería
  const handleAddIncoming = (productId: number) => {
    try {
      setSelectedProductId(productId)
      setIncomingAmount(0)
      setShowIncomingDialog(true)
    } catch (err) {
      console.error(`Error al abrir diálogo para producto ${productId}:`, err)
    }
  }

  // Confirmar ingreso de mercadería
  const confirmIncoming = () => {
    try {
      if (!selectedProductId || incomingAmount <= 0) {
        toast({
          title: "Error",
          description: "Ingrese una cantidad válida",
          variant: "destructive",
        })
        return
      }

      setStockData((prev) =>
        prev.map((item) => {
          if (item.product_id === selectedProductId) {
            const currentAmount = item.incoming_quantity || 0
            return {
              ...item,
              incoming_quantity: currentAmount + incomingAmount,
            }
          }
          return item
        }),
      )

      setShowIncomingDialog(false)

      toast({
        title: "Ingreso registrado",
        description: `Se agregaron ${incomingAmount} unidades al ingreso de mercadería`,
      })
    } catch (err) {
      console.error("Error al confirmar ingreso:", err)
      setShowIncomingDialog(false)
    }
  }

  // Finalizar ingreso de mercadería
  const finalizeIncoming = (productId: number) => {
    try {
      handleLockField(productId, "incoming")
    } catch (err) {
      console.error(`Error al finalizar ingreso para producto ${productId}:`, err)
    }
  }

  // Calcular diferencias
  const calculateDifference = (productId: number) => {
    try {
      const product = stockData.find((p) => p.product_id === productId)

      if (!product) return null

      const opening = product.opening_quantity || 0
      const incoming = product.incoming_quantity || 0
      const sold = product.units_sold || 0
      const discarded = product.discarded_quantity || 0
      const closing = product.closing_quantity || 0
      const consumption = product.internal_consumption || 0

      // Fórmula anterior: (1 + 2 + 4 - 3 - 6)
      // Apertura + Ingreso + Decomisos - Vendidas - Cierre

      // Nueva fórmula según el gerente:
      // Cierre + Venta + Consumos + Decomisados - Ingresos - Apertura
      return closing + sold + consumption + discarded - incoming - opening
    } catch (err) {
      console.error(`Error al calcular diferencia para producto ${productId}:`, err)
      return null
    }
  }

  // Actualizar todas las diferencias
  const updateAllDifferences = () => {
    try {
      setStockData((prev) =>
        prev.map((item) => ({
          ...item,
          difference: calculateDifference(item.product_id),
        })),
      )
    } catch (err) {
      console.error("Error al actualizar diferencias:", err)
    }
  }

  // Modificar la función validateData() para permitir valores NULL
  const validateData = () => {
    try {
      console.log("Validando datos...")
      console.log("Datos completos de la planilla:", sheetData)
      console.log("Location ID:", sheetData.location_id, "tipo:", typeof sheetData.location_id)
      console.log("Manager ID:", sheetData.manager_id, "tipo:", typeof sheetData.manager_id)
      console.log("Managers disponibles:", filteredManagers)

      if (!sheetData.location_id) {
        console.error("Error de validación: No se ha seleccionado un local")
        toast({
          title: "Error",
          description: "Debe seleccionar un local",
          variant: "destructive",
        })
        return false
      }

      // Ya no es necesario validar el manager_id, puede ser NULL
      console.log("Validación exitosa")
      return true
    } catch (err) {
      console.error("Error en validación:", err)
      return false
    }
  }

  // Modificar la función handleSaveSheet para manejar el caso de manager_id vacío
  const handleSaveSheet = async () => {
    if (!validateData()) return

    try {
      setIsLoading(true)
      console.log("Iniciando guardado de planilla...")

      // Verificar si las tablas existen
      try {
        console.log("Verificando tablas en la base de datos...")
        const { error: tableCheckError } = await supabase.from("stock_matrix_sheets").select("id").limit(1)

        if (tableCheckError) {
          console.error("Error al verificar tabla stock_matrix_sheets:", tableCheckError)
          toast({
            title: "Error de base de datos",
            description: "La tabla stock_matrix_sheets no existe. Por favor, ejecute el script de migración.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
      } catch (checkError) {
        console.error("Error al verificar tablas:", checkError)
        throw new Error("No se pudo verificar la existencia de las tablas necesarias")
      }

      // 1. Guardar la planilla principal
      let sheetId = sheetData.id

      // Crear un objeto con los datos a guardar
      const sheetDataToSave = {
        date: sheetData.date,
        location_id: sheetData.location_id,
        shift: sheetData.shift,
        status: "parcial",
        updated_by: sheetData.updated_by,
        // Incluir manager_id incluso si está vacío, ahora que la tabla permite NULL
        manager_id: sheetData.manager_id || null,
      }

      if (sheetId) {
        // Actualizar planilla existente
        const { error: updateError } = await supabase
          .from("stock_matrix_sheets")
          .update(sheetDataToSave)
          .eq("id", sheetId)

        if (updateError) {
          console.error("Error al actualizar la planilla:", updateError)
          throw new Error("No se pudo actualizar la planilla")
        }
      } else {
        // Crear nueva planilla
        const { data: insertData, error: insertError } = await supabase
          .from("stock_matrix_sheets")
          .insert({
            ...sheetDataToSave,
            created_by: sheetData.created_by,
          })
          .select()

        if (insertError) {
          console.error("Error al crear la planilla:", insertError)
          throw new Error("No se pudo crear la planilla")
        }

        if (!insertData || insertData.length === 0) {
          throw new Error("No se pudo obtener el ID de la planilla creada")
        }

        sheetId = insertData[0].id

        // Actualizar el ID en el estado
        setSheetData((prev) => ({
          ...prev,
          id: sheetId,
        }))
      }

      // 2. Guardar los detalles de stock
      for (const product of stockData) {
        const detailData = {
          stock_sheet_id: sheetId,
          product_id: product.product_id,
          product_name: product.product_name,
          category: product.category,
          unit_value: product.unit_value,
          opening_quantity: product.opening_quantity,
          opening_locked: product.opening_locked,
          incoming_quantity: product.incoming_quantity,
          incoming_locked: product.incoming_locked,
          closing_quantity: product.closing_quantity,
          closing_locked: product.closing_locked,
          units_sold: product.units_sold,
          discarded_quantity: product.discarded_quantity,
          internal_consumption: product.internal_consumption,
          difference: product.difference,
          has_internal_consumption: product.has_internal_consumption,
        }

        // Verificar si ya existe un detalle para este producto
        const { data: existingDetail, error: checkError } = await supabase
          .from("stock_matrix_details")
          .select("id")
          .eq("stock_sheet_id", sheetId)
          .eq("product_id", product.product_id)
          .maybeSingle()

        if (checkError) {
          console.error("Error al verificar detalle existente:", checkError)
          continue
        }

        if (existingDetail) {
          // Actualizar detalle existente
          const { error: updateError } = await supabase
            .from("stock_matrix_details")
            .update(detailData)
            .eq("id", existingDetail.id)

          if (updateError) {
            console.error("Error al actualizar detalle:", updateError)
          }
        } else {
          // Insertar nuevo detalle
          const { error: insertError } = await supabase.from("stock_matrix_details").insert(detailData)

          if (insertError) {
            console.error("Error al insertar detalle:", insertError)
          }
        }
      }

      // Actualizar estado a parcial
      setSheetData((prev) => ({
        ...prev,
        status: "parcial",
      }))

      toast({
        title: "Planilla guardada",
        description: "Los datos han sido guardados correctamente",
      })
    } catch (error: any) {
      console.error("Error saving data:", error.message)
      toast({
        title: "Error",
        description: error.message || "No se pudieron guardar los datos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // También necesitamos modificar la función handleFinalizeSheet de manera similar
  const handleFinalizeSheet = async () => {
    if (!validateData()) return

    try {
      setIsLoading(true)
      console.log("Iniciando finalización de planilla...")

      // Actualizar todas las diferencias antes de finalizar
      updateAllDifferences()

      // Verificar si las tablas existen
      try {
        console.log("Verificando tablas en la base de datos...")
        const { error: tableCheckError } = await supabase.from("stock_matrix_sheets").select("id").limit(1)

        if (tableCheckError) {
          console.error("Error al verificar tabla stock_matrix_sheets:", tableCheckError)
          toast({
            title: "Error de base de datos",
            description: "La tabla stock_matrix_sheets no existe. Por favor, ejecute el script de migración.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
      } catch (checkError) {
        console.error("Error al verificar tablas:", checkError)
        throw new Error("No se pudo verificar la existencia de las tablas necesarias")
      }

      // 1. Guardar o actualizar la planilla principal
      let sheetId = sheetData.id

      // Crear un objeto con los datos a guardar
      const sheetDataToSave = {
        date: sheetData.date,
        location_id: sheetData.location_id,
        shift: sheetData.shift,
        status: "completado",
        updated_by: sheetData.updated_by,
        // Incluir manager_id incluso si está vacío, ahora que la tabla permite NULL
        manager_id: sheetData.manager_id || null,
      }

      if (sheetId) {
        // Actualizar planilla existente
        const { error: updateError } = await supabase
          .from("stock_matrix_sheets")
          .update(sheetDataToSave)
          .eq("id", sheetId)

        if (updateError) {
          console.error("Error al actualizar la planilla:", updateError)
          throw new Error("No se pudo actualizar la planilla")
        }
      } else {
        // Crear nueva planilla
        const { data: insertData, error: insertError } = await supabase
          .from("stock_matrix_sheets")
          .insert({
            ...sheetDataToSave,
            created_by: sheetData.created_by,
          })
          .select()

        if (insertError) {
          console.error("Error al crear la planilla:", insertError)
          throw new Error("No se pudo crear la planilla")
        }

        if (!insertData || insertData.length === 0) {
          throw new Error("No se pudo obtener el ID de la planilla creada")
        }

        sheetId = insertData[0].id

        // Actualizar el ID en el estado
        setSheetData((prev) => ({
          ...prev,
          id: sheetId,
        }))
      }

      // 2. Guardar los detalles de stock con todos los campos bloqueados
      for (const product of stockData) {
        const detailData = {
          stock_sheet_id: sheetId,
          product_id: product.product_id,
          product_name: product.product_name,
          category: product.category,
          unit_value: product.unit_value,
          opening_quantity: product.opening_quantity,
          opening_locked: true,
          incoming_quantity: product.incoming_quantity,
          incoming_locked: true,
          closing_quantity: product.closing_quantity,
          closing_locked: true,
          units_sold: product.units_sold,
          discarded_quantity: product.discarded_quantity,
          internal_consumption: product.internal_consumption,
          difference: product.difference,
          has_internal_consumption: product.has_internal_consumption,
        }

        // Verificar si ya existe un detalle para este producto
        const { data: existingDetail, error: checkError } = await supabase
          .from("stock_matrix_details")
          .select("id")
          .eq("stock_sheet_id", sheetId)
          .eq("product_id", product.product_id)
          .maybeSingle()

        if (checkError) {
          console.error("Error al verificar detalle existente:", checkError)
          continue
        }

        if (existingDetail) {
          // Actualizar detalle existente
          const { error: updateError } = await supabase
            .from("stock_matrix_details")
            .update(detailData)
            .eq("id", existingDetail.id)

          if (updateError) {
            console.error("Error al actualizar detalle:", updateError)
          }
        } else {
          // Insertar nuevo detalle
          const { error: insertError } = await supabase.from("stock_matrix_details").insert(detailData)

          if (insertError) {
            console.error("Error al insertar detalle:", insertError)
          }
        }
      }

      // Actualizar estado a completado
      setSheetData((prev) => ({
        ...prev,
        status: "completado",
      }))

      toast({
        title: "Planilla finalizada",
        description: "La planilla ha sido finalizada correctamente",
      })

      // Redirigir a la lista de planillas después de un breve retraso
      setTimeout(() => {
        router.push("/stock-matrix/list")
      }, 1500)
    } catch (error: any) {
      console.error("Error finalizing data:", error.message)
      toast({
        title: "Error",
        description: error.message || "No se pudo finalizar la planilla",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Exportar a Excel
  const handleExportToExcel = () => {
    try {
      toast({
        title: "Exportando",
        description: "Exportando datos a Excel...",
      })
      // Aquí iría la lógica para exportar a Excel
    } catch (err) {
      console.error("Error al exportar a Excel:", err)
    }
  }

  // Ver lista de planillas
  const handleViewSheetList = () => {
    try {
      router.push("/stock-matrix/list")
    } catch (err) {
      console.error("Error al navegar a la lista de planillas:", err)
    }
  }

  // Simplificar la función loadExistingSheet para no verificar autenticación
  const loadExistingSheet = async (sheetId: number) => {
    try {
      setIsLoading(true)

      // Cargar datos de la planilla
      const { data: sheetData, error: sheetError } = await supabase
        .from("stock_matrix_sheets")
        .select("*")
        .eq("id", sheetId)
        .single()

      if (sheetError) {
        console.error("Error al cargar la planilla:", sheetError)

        // Si el error es 'no se encontró el registro', manejarlo de forma amigable
        if (sheetError.code === "PGRST116") {
          toast({
            title: "Planilla no encontrada",
            description: "La planilla que intentas ver no existe o ha sido eliminada",
            variant: "destructive",
          })
          // Redirigir a la lista de planillas después de un breve retraso
          setTimeout(() => {
            router.push("/stock-matrix/list")
          }, 1500)
          return
        }

        throw new Error("No se pudo cargar la planilla")
      }

      // Verificar si la planilla está completada
      if (sheetData.status === "completado") {
        toast({
          title: "Planilla finalizada",
          description: "Esta planilla ya ha sido finalizada y no puede ser editada",
        })
      }

      // Actualizar el estado con los datos de la planilla
      setSheetData({
        id: sheetData.id,
        date: sheetData.date,
        location_id: sheetData.location_id,
        manager_id: sheetData.manager_id,
        shift: sheetData.shift,
        status: sheetData.status,
        created_by: sheetData.created_by || "Usuario Actual",
        updated_by: sheetData.updated_by || "Usuario Actual",
      })

      // Cargar los detalles de la planilla
      const { data: detailsData, error: detailsError } = await supabase
        .from("stock_matrix_details")
        .select("*")
        .eq("stock_sheet_id", sheetId)

      if (detailsError) {
        console.error("Error al cargar los detalles:", detailsError)
        throw new Error("No se pudieron cargar los detalles de la planilla")
      }

      // Actualizar el estado de los productos con los datos cargados
      if (detailsData && detailsData.length > 0) {
        setStockData((prev) => {
          return prev.map((product) => {
            // Buscar si existe un detalle para este producto
            const detail = detailsData.find((d) => d.product_id === product.product_id)
            if (detail) {
              return {
                ...product,
                id: detail.id,
                stock_sheet_id: detail.stock_sheet_id,
                opening_quantity: detail.opening_quantity,
                opening_locked: detail.opening_locked,
                incoming_quantity: detail.incoming_quantity,
                incoming_locked: detail.incoming_locked,
                closing_quantity: detail.closing_quantity,
                closing_locked: detail.closing_locked,
                units_sold: detail.units_sold,
                discarded_quantity: detail.discarded_quantity,
                internal_consumption: detail.internal_consumption,
                difference: detail.difference,
              }
            }
            return product
          })
        })
      }

      toast({
        title: "Planilla cargada",
        description: "Los datos de la planilla se han cargado correctamente",
      })
    } catch (error: any) {
      console.error("Error loading sheet:", error.message)
      toast({
        title: "Error",
        description: error.message || "No se pudo cargar la planilla",
        variant: "destructive",
      })

      // En caso de error, redirigir a la lista de planillas
      setTimeout(() => {
        router.push("/stock-matrix/list")
      }, 1500)
    } finally {
      setIsLoading(false)
    }
  }

  // Simplificar la función handleLogin
  const handleLogin = () => {
    router.push("/login")
  }

  // Si está verificando autenticación, mostrar pantalla de carga
  if (authChecking) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <p>Cargando datos...</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  // Si hay un error crítico, mostrar mensaje de error
  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <Card className="border-red-300">
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
              <div className="mt-4">
                <Button onClick={() => router.push("/stock-check")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  // Contenido principal
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        {/* Contenido principal */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Planilla Stock Matriz</h1>
            <p className="text-muted-foreground">Formato tipo planilla para control de stock</p>
          </div>
          <div className="flex gap-2 items-center">
            {/* Selector de rol */}
            <div className="flex items-center mr-4">
              <Label htmlFor="role-selector" className="mr-2">
                Rol:
              </Label>
              <Select value={userRole} onValueChange={(value) => setUserRole(value as "encargado" | "administrador")}>
                <SelectTrigger id="role-selector" className="w-[180px]">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="encargado">Encargado</SelectItem>
                  <SelectItem value="administrador">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => router.push("/stock-matrix/list")}>
              <List className="mr-2 h-4 w-4" />
              Ver Planillas
            </Button>
            <Button variant="outline" onClick={() => router.push("/stock-check")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <Button variant="outline" onClick={handleExportToExcel}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Información de la planilla */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={sheetData.date}
                  onChange={(e) => handleSheetDataChange("date", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shift">Turno</Label>
                <Select value={sheetData.shift} onValueChange={(value) => handleSheetDataChange("shift", value)}>
                  <SelectTrigger id="shift">
                    <SelectValue placeholder="Seleccionar turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mañana">Mañana</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Local</Label>
                <Select
                  value={sheetData.location_id ? sheetData.location_id.toString() : ""}
                  onValueChange={(value) => handleSheetDataChange("location_id", Number.parseInt(value))}
                >
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Seleccionar local" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.length === 0 ? (
                      <SelectItem value="no_locations" disabled>
                        No hay locales disponibles
                      </SelectItem>
                    ) : (
                      locations.map((location) => (
                        <SelectItem key={location.id} value={location.id.toString()}>
                          {location.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager">Encargado</Label>
                <Select
                  value={sheetData.manager_id ? sheetData.manager_id.toString() : ""}
                  onValueChange={(value) => {
                    console.log("Encargado seleccionado:", value)
                    handleSheetDataChange("manager_id", value)
                  }}
                >
                  <SelectTrigger id="manager">
                    <SelectValue placeholder="Seleccionar encargado" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredManagers.length === 0 ? (
                      <SelectItem value="no_managers" disabled>
                        {sheetData.location_id ? "No hay encargados para este local" : "Seleccione un local primero"}
                      </SelectItem>
                    ) : (
                      filteredManagers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <div className="h-10 flex items-center">
                  <Badge
                    variant={
                      sheetData.status === "borrador"
                        ? "outline"
                        : sheetData.status === "parcial"
                          ? "secondary"
                          : "default"
                    }
                  >
                    {sheetData.status === "borrador"
                      ? "Borrador"
                      : sheetData.status === "parcial"
                        ? "Parcial"
                        : "Completado"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de productos */}
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Stock</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Cargando datos...</div>
            ) : !dataLoaded ? (
              <div className="text-center py-8">Error al cargar los datos</div>
            ) : productConfigs.length === 0 ? (
              <div className="text-center py-8">
                No hay productos configurados. Por favor, configure los productos antes de continuar.
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead rowSpan={2} className="w-[180px]">
                        Producto
                      </TableHead>
                      <TableHead rowSpan={2} className="w-[100px]">
                        Categoría
                      </TableHead>
                      <TableHead colSpan={3} className="text-center border-b">
                        Encargado
                      </TableHead>
                      {userRole === "administrador" && (
                        <TableHead colSpan={3} className="text-center border-b">
                          Administrador
                        </TableHead>
                      )}
                      {userRole === "administrador" && (
                        <TableHead rowSpan={2} className="text-center w-[120px]">
                          Diferencia
                        </TableHead>
                      )}
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-center w-[120px]">1. Apertura</TableHead>
                      <TableHead className="text-center w-[120px]">2. Ingreso</TableHead>
                      <TableHead className="text-center w-[120px]">6. Cierre</TableHead>

                      {userRole === "administrador" && (
                        <>
                          <TableHead className="text-center w-[120px]">3. Vendidas</TableHead>
                          <TableHead className="text-center w-[120px]">4. Decomisos</TableHead>
                          <TableHead className="text-center w-[120px]">5. Consumos</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockData.map((product) => (
                      <TableRow key={product.product_id}>
                        <TableCell className="font-medium">{product.product_name}</TableCell>
                        <TableCell>{product.category}</TableCell>

                        {/* Apertura - Solo editable por encargado y si no está bloqueado */}
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                value={product.opening_quantity || ""}
                                onChange={(e) =>
                                  handleStockDataChange(
                                    product.product_id,
                                    "opening_quantity",
                                    e.target.value === "" ? null : Number.parseInt(e.target.value),
                                  )
                                }
                                disabled={product.opening_locked || userRole !== "encargado"}
                                className="w-20 text-center"
                              />
                              {product.opening_locked && <Lock className="h-4 w-4 text-muted-foreground" />}
                            </div>
                            {userRole === "encargado" && !product.opening_locked && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleLockField(product.product_id, "opening")}
                                className="h-8 w-8"
                                title="Guardar"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>

                        {/* Ingreso de Mercadería - Solo editable por encargado y si no está bloqueado */}
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                value={product.incoming_quantity || ""}
                                disabled={true}
                                className="w-20 text-center"
                              />
                              {product.incoming_locked && <Lock className="h-4 w-4 text-muted-foreground" />}
                            </div>
                            {userRole === "encargado" && !product.incoming_locked && (
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleAddIncoming(product.product_id)}
                                  className="h-8 w-8"
                                  title="Agregar ingreso"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => finalizeIncoming(product.product_id)}
                                  className="h-8 w-8"
                                  title="Finalizar ingresos"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Stock de Cierre - Solo editable por encargado y si no está bloqueado */}
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                value={product.closing_quantity || ""}
                                onChange={(e) =>
                                  handleStockDataChange(
                                    product.product_id,
                                    "closing_quantity",
                                    e.target.value === "" ? null : Number.parseInt(e.target.value),
                                  )
                                }
                                disabled={product.closing_locked || userRole !== "encargado"}
                                className="w-20 text-center"
                              />
                              {product.closing_locked && <Lock className="h-4 w-4 text-muted-foreground" />}
                            </div>
                            {userRole === "encargado" && !product.closing_locked && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleLockField(product.product_id, "closing")}
                                className="h-8 w-8"
                                title="Guardar"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>

                        {/* Campos solo visibles para administradores */}
                        {userRole === "administrador" && (
                          <>
                            {/* Unidades Vendidas */}
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                value={product.units_sold || ""}
                                onChange={(e) =>
                                  handleStockDataChange(
                                    product.product_id,
                                    "units_sold",
                                    e.target.value === "" ? null : Number.parseInt(e.target.value),
                                  )
                                }
                                className="w-20 text-center"
                              />
                            </TableCell>

                            {/* Decomisos */}
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                value={product.discarded_quantity || ""}
                                onChange={(e) =>
                                  handleStockDataChange(
                                    product.product_id,
                                    "discarded_quantity",
                                    e.target.value === "" ? null : Number.parseInt(e.target.value),
                                  )
                                }
                                className="w-20 text-center"
                              />
                            </TableCell>

                            {/* Consumos Internos - Solo si el producto los tiene */}
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                value={product.internal_consumption || ""}
                                onChange={(e) =>
                                  handleStockDataChange(
                                    product.product_id,
                                    "internal_consumption",
                                    e.target.value === "" ? null : Number.parseInt(e.target.value),
                                  )
                                }
                                disabled={!product.has_internal_consumption}
                                className="w-20 text-center"
                              />
                            </TableCell>

                            {/* Diferencia - Calculada automáticamente */}
                            <TableCell>
                              <div className="flex items-center justify-between">
                                <span
                                  className={
                                    product.difference === null
                                      ? ""
                                      : product.difference === 0
                                        ? "text-green-600 font-medium"
                                        : product.difference > 0
                                          ? "text-amber-600 font-medium"
                                          : "text-red-600 font-medium"
                                  }
                                >
                                  {product.difference === null ? "-" : product.difference}
                                </span>

                                {product.difference !== null && product.difference !== 0 && (
                                  <AlertTriangle
                                    className={`h-4 w-4 ${product.difference > 0 ? "text-amber-600" : "text-red-600"}`}
                                  />
                                )}
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => router.push("/stock-check")}>
                Cancelar
              </Button>

              <div className="flex gap-2">
                {userRole === "administrador" && (
                  <Button variant="outline" onClick={updateAllDifferences}>
                    Calcular Diferencias
                  </Button>
                )}

                <Button onClick={handleSaveSheet} disabled={isLoading || !dataLoaded || productConfigs.length === 0}>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar
                </Button>

                <Button
                  variant="default"
                  onClick={handleFinalizeSheet}
                  disabled={
                    isLoading || !dataLoaded || productConfigs.length === 0 || sheetData.status === "completado"
                  }
                >
                  <Check className="mr-2 h-4 w-4" />
                  Finalizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diálogo para agregar ingreso de mercadería */}
        <Dialog open={showIncomingDialog} onOpenChange={setShowIncomingDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Ingreso de Mercadería</DialogTitle>
              <DialogDescription>Ingrese la cantidad de unidades recibidas</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="incoming-amount">Cantidad</Label>
                <Input
                  id="incoming-amount"
                  type="number"
                  min="1"
                  value={incomingAmount || ""}
                  onChange={(e) => setIncomingAmount(Number.parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowIncomingDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmIncoming}>Agregar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
