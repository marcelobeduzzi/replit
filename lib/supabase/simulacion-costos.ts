import { supabase } from "./client"

// Tipos
export type Category = {
  id: string
  name: string
  brand: string
}

export type Product = {
  id: string
  name: string
  category_id: string
  brand: string
  default_purchase_price: number
  default_sale_price: number
}

export type Supplier = {
  id: string
  name: string
  contact_person: string
  phone: string
  email: string
}

export type SupplierPrice = {
  id: string
  supplier_id: string
  product_id: string
  base_price: number
  discount_percentage: number
  effective_price: number
  last_updated: string
}

export type Simulation = {
  id: string
  name: string
  description: string
  brand: string
  user_id: string
  created_at: string
}

export type SimulationItem = {
  id: string
  simulation_id: string
  product_id: string
  purchase_price: number
  sale_price: number
  discount_percentage: number
  quantity: number
  additional_costs: number
  current_profitability: number
  new_purchase_price: number
  new_profitability: number
  profitability_difference: number
}

// Funciones para interactuar con la base de datos

// Categorías
export async function getCategories(brand?: string) {
  let query = supabase.from("cost_simulation_categories").select("*")

  if (brand) {
    query = query.eq("brand", brand)
  }

  const { data, error } = await query.order("name")

  if (error) {
    console.error("Error fetching categories:", error)
    throw error
  }

  return data as Category[]
}

// Productos
export async function getProducts(categoryId?: string, brand?: string) {
  let query = supabase.from("cost_simulation_products").select("*")

  if (categoryId) {
    query = query.eq("category_id", categoryId)
  }

  if (brand) {
    query = query.eq("brand", brand)
  }

  const { data, error } = await query.order("name")

  if (error) {
    console.error("Error fetching products:", error)
    throw error
  }

  return data as Product[]
}

export async function getProductById(id: string) {
  const { data, error } = await supabase.from("cost_simulation_products").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching product:", error)
    throw error
  }

  return data as Product
}

// Proveedores
export async function getSuppliers() {
  const { data, error } = await supabase.from("cost_simulation_suppliers").select("*").order("name")

  if (error) {
    console.error("Error fetching suppliers:", error)
    throw error
  }

  return data as Supplier[]
}

export async function createSupplier(supplier: Omit<Supplier, "id">) {
  const { data, error } = await supabase.from("cost_simulation_suppliers").insert(supplier).select().single()

  if (error) {
    console.error("Error creating supplier:", error)
    throw error
  }

  return data as Supplier
}

export async function updateSupplier(id: string, supplier: Partial<Supplier>) {
  const { data, error } = await supabase
    .from("cost_simulation_suppliers")
    .update(supplier)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating supplier:", error)
    throw error
  }

  return data as Supplier
}

export async function deleteSupplier(id: string) {
  const { error } = await supabase.from("cost_simulation_suppliers").delete().eq("id", id)

  if (error) {
    console.error("Error deleting supplier:", error)
    throw error
  }

  return true
}

// Precios de proveedores
export async function getSupplierPrices(supplierId?: string, productId?: string) {
  let query = supabase.from("cost_simulation_supplier_prices").select(`
      *,
      suppliers:supplier_id(name),
      products:product_id(name, brand, category_id)
    `)

  if (supplierId) {
    query = query.eq("supplier_id", supplierId)
  }

  if (productId) {
    query = query.eq("product_id", productId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching supplier prices:", error)
    throw error
  }

  return data
}

export async function createSupplierPrice(price: Omit<SupplierPrice, "id" | "effective_price" | "last_updated">) {
  const { data, error } = await supabase.from("cost_simulation_supplier_prices").insert(price).select().single()

  if (error) {
    console.error("Error creating supplier price:", error)
    throw error
  }

  return data
}

export async function updateSupplierPrice(
  id: string,
  price: Partial<Omit<SupplierPrice, "effective_price" | "last_updated">>,
) {
  const { data, error } = await supabase
    .from("cost_simulation_supplier_prices")
    .update(price)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating supplier price:", error)
    throw error
  }

  return data
}

export async function deleteSupplierPrice(id: string) {
  const { error } = await supabase.from("cost_simulation_supplier_prices").delete().eq("id", id)

  if (error) {
    console.error("Error deleting supplier price:", error)
    throw error
  }

  return true
}

// Simulaciones
export async function getSimulations(userId: string) {
  const { data, error } = await supabase
    .from("cost_simulations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching simulations:", error)
    throw error
  }

  return data as Simulation[]
}

export async function getSimulationById(id: string) {
  const { data, error } = await supabase
    .from("cost_simulations")
    .select(`
      *,
      items:cost_simulation_items(
        *,
        product:product_id(name, category_id)
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching simulation:", error)
    throw error
  }

  return data
}

export async function createSimulation(
  simulation: Omit<Simulation, "id" | "created_at">,
  items: Omit<
    SimulationItem,
    | "id"
    | "simulation_id"
    | "current_profitability"
    | "new_purchase_price"
    | "new_profitability"
    | "profitability_difference"
  >[],
) {
  // Iniciar una transacción
  const { data: simulationData, error: simulationError } = await supabase
    .from("cost_simulations")
    .insert(simulation)
    .select()
    .single()

  if (simulationError) {
    console.error("Error creating simulation:", simulationError)
    throw simulationError
  }

  // Preparar los items con el ID de la simulación
  const simulationItems = items.map((item) => ({
    ...item,
    simulation_id: simulationData.id,
  }))

  // Insertar los items
  const { error: itemsError } = await supabase.from("cost_simulation_items").insert(simulationItems)

  if (itemsError) {
    console.error("Error creating simulation items:", itemsError)

    // Si hay un error, eliminar la simulación creada
    await supabase.from("cost_simulations").delete().eq("id", simulationData.id)

    throw itemsError
  }

  return simulationData
}

export async function deleteSimulation(id: string) {
  // Los items se eliminarán automáticamente por la restricción ON DELETE CASCADE
  const { error } = await supabase.from("cost_simulations").delete().eq("id", id)

  if (error) {
    console.error("Error deleting simulation:", error)
    throw error
  }

  return true
}

