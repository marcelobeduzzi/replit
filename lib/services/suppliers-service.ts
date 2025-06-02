import { supabase } from "../supabase/client"
import type {
  Supplier,
  SupplierProduct,
  SupplierDiscount,
  SupplierInvoice,
  SupplierPayment,
  SupplierWithDetails,
  InvoiceWithDetails,
  PaymentWithDetails,
} from "@/lib/types/suppliers"

// Servicio para proveedores
export const suppliersService = {
  // Obtener todos los proveedores
  async getAllSuppliers() {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("name")

    if (error) {
      console.error("Error fetching suppliers:", error)
      throw error
    }

    return data
  },

  // Obtener un proveedor por ID
  async getSupplierById(id: string) {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching supplier:", error)
      throw error
    }

    return data
  },

  // Crear un nuevo proveedor
  async createSupplier(supplier: Omit<Supplier, "id">) {
    const { data, error } = await supabase
      .from("suppliers")
      .insert(supplier)
      .select()
      .single()

    if (error) {
      console.error("Error creating supplier:", error)
      throw error
    }

    return data
  },

  // Actualizar un proveedor
  async updateSupplier(id: string, supplier: Partial<Supplier>) {
    const { data, error } = await supabase
      .from("suppliers")
      .update(supplier)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating supplier:", error)
      throw error
    }

    return data
  },

  // Eliminar un proveedor
  async deleteSupplier(id: string) {
    const { error } = await supabase
      .from("suppliers")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting supplier:", error)
      throw error
    }
  },

  // Productos de proveedores
  async getSupplierProducts(supplierId: string): Promise<SupplierProduct[]> {
    const { data, error } = await supabase
      .from("supplier_products")
      .select("*")
      .eq("supplier_id", supplierId)
      .order("product_name")

    if (error) {
      console.error("Error fetching supplier products:", error)
      throw error
    }

    return data || []
  },

  async createSupplierProduct(
    product: Omit<SupplierProduct, "id" | "created_at" | "updated_at">,
  ): Promise<SupplierProduct> {
    const { data, error } = await supabase.from("supplier_products").insert(product).select().single()

    if (error) {
      console.error("Error creating supplier product:", error)
      throw error
    }

    return data
  },

  async updateSupplierProduct(id: string, product: Partial<SupplierProduct>): Promise<SupplierProduct> {
    const { data, error } = await supabase.from("supplier_products").update(product).eq("id", id).select().single()

    if (error) {
      console.error("Error updating supplier product:", error)
      throw error
    }

    return data
  },

  async deleteSupplierProduct(id: string): Promise<void> {
    const { error } = await supabase.from("supplier_products").delete().eq("id", id)

    if (error) {
      console.error("Error deleting supplier product:", error)
      throw error
    }
  },

  // Descuentos de proveedores
  async getSupplierDiscounts(supplierId: string): Promise<SupplierDiscount[]> {
    const { data, error } = await supabase.from("supplier_discounts").select("*").eq("supplier_id", supplierId)

    if (error) {
      console.error("Error fetching supplier discounts:", error)
      throw error
    }

    return data || []
  },

  async createSupplierDiscount(
    discount: Omit<SupplierDiscount, "id" | "created_at" | "updated_at">,
  ): Promise<SupplierDiscount> {
    const { data, error } = await supabase.from("supplier_discounts").insert(discount).select().single()

    if (error) {
      console.error("Error creating supplier discount:", error)
      throw error
    }

    return data
  },

  async updateSupplierDiscount(id: string, discount: Partial<SupplierDiscount>): Promise<SupplierDiscount> {
    const { data, error } = await supabase.from("supplier_discounts").update(discount).eq("id", id).select().single()

    if (error) {
      console.error("Error updating supplier discount:", error)
      throw error
    }

    return data
  },

  async deleteSupplierDiscount(id: string): Promise<void> {
    const { error } = await supabase.from("supplier_discounts").delete().eq("id", id)

    if (error) {
      console.error("Error deleting supplier discount:", error)
      throw error
    }
  },
}

// Servicio para facturas y pagos
export const invoicesService = {
  // Obtener todas las facturas
  async getInvoices(): Promise<InvoiceWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from("supplier_invoices")
        .select(`
          *,
          supplier:suppliers(*),
          payments:supplier_payments(*)
        `)
        .order("issue_date", { ascending: false })

      if (error) {
        console.error("Error fetching invoices:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error in getInvoices:", error)
      return []
    }
  },

  // Obtener facturas por proveedor
  async getInvoicesBySupplier(supplierId: string): Promise<InvoiceWithDetails[]> {
    const { data, error } = await supabase
      .from("supplier_invoices")
      .select(`
        *,
        supplier:suppliers(*),
        payments:supplier_payments(*)
      `)
      .eq("supplier_id", supplierId)
      .order("issue_date", { ascending: false })

    if (error) {
      console.error("Error fetching supplier invoices:", error)
      throw error
    }

    return data || []
  },

  // Obtener una factura por ID
  async getInvoiceById(id: string): Promise<InvoiceWithDetails> {
    const { data, error } = await supabase
      .from("supplier_invoices")
      .select(`
        *,
        supplier:suppliers(*),
        payments:supplier_payments(*)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching invoice:", error)
      throw error
    }

    return data
  },

  // Crear una nueva factura
  async createInvoice(invoice: Omit<SupplierInvoice, "id" | "created_at" | "updated_at">): Promise<SupplierInvoice> {
    const { data, error } = await supabase.from("supplier_invoices").insert(invoice).select().single()

    if (error) {
      console.error("Error creating invoice:", error)
      throw error
    }

    return data
  },

  // Actualizar una factura
  async updateInvoice(id: string, invoice: Partial<SupplierInvoice>): Promise<SupplierInvoice> {
    const { data, error } = await supabase.from("supplier_invoices").update(invoice).eq("id", id).select().single()

    if (error) {
      console.error("Error updating invoice:", error)
      throw error
    }

    return data
  },

  // Eliminar una factura
  async deleteInvoice(id: string): Promise<void> {
    const { error } = await supabase.from("supplier_invoices").delete().eq("id", id)

    if (error) {
      console.error("Error deleting invoice:", error)
      throw error
    }
  },

  // Pagos
  async getPayments(status?: "pending" | "partial" | "completed"): Promise<PaymentWithDetails[]> {
    let query = supabase
      .from("supplier_payments")
      .select(`
        *,
        invoice:supplier_invoices(*),
        supplier:supplier_invoices(supplier:suppliers(*))
      `)
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching payments:", error)
      throw error
    }

    return data || []
  },

  // Obtener pagos por factura
  async getPaymentsByInvoice(invoiceId: string): Promise<SupplierPayment[]> {
    const { data, error } = await supabase
      .from("supplier_payments")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching invoice payments:", error)
      throw error
    }

    return data || []
  },

  // Crear un nuevo pago
  async createPayment(payment: Omit<SupplierPayment, "id" | "created_at" | "updated_at">): Promise<SupplierPayment> {
    const { data, error } = await supabase.from("supplier_payments").insert(payment).select().single()

    if (error) {
      console.error("Error creating payment:", error)
      throw error
    }

    return data
  },

  // Actualizar un pago
  async updatePayment(id: string, payment: Partial<SupplierPayment>): Promise<SupplierPayment> {
    const { data, error } = await supabase.from("supplier_payments").update(payment).eq("id", id).select().single()

    if (error) {
      console.error("Error updating payment:", error)
      throw error
    }

    return data
  },

  // Eliminar un pago
  async deletePayment(id: string): Promise<void> {
    const { error } = await supabase.from("supplier_payments").delete().eq("id", id)

    if (error) {
      console.error("Error deleting payment:", error)
      throw error
    }
  },

  // Obtener historial de pagos (pagos completados)
  async getPaymentHistory(): Promise<PaymentWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from("supplier_payments")
        .select(`
          *,
          invoice:supplier_invoices(*),
          supplier:supplier_invoices(supplier:suppliers(*))
        `)
        .eq("status", "completed")
        .order("payment_date", { ascending: false })

      if (error) {
        console.error("Error fetching payment history:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error in getPaymentHistory:", error)
      return []
    }
  },
}

