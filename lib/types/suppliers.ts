export interface Supplier {
  id: string
  name: string
  contact_name?: string
  phone?: string
  email?: string
  address?: string
  tax_id?: string
  notes?: string
  payment_method?: string
  payment_terms?: string
  active?: boolean
  created_at: string
  updated_at: string
}

export interface SupplierProduct {
  id: string
  supplier_id: string
  product_name: string
  description?: string
  sku?: string
  purchase_price: number
  sale_price?: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface SupplierDiscount {
  id: string
  supplier_id: string
  product_id?: string
  discount_percentage: number
  start_date?: string
  end_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface SupplierInvoice {
  id: string
  supplier_id: string
  invoice_number: string
  issue_date: string
  delivery_date?: string
  due_date: string
  total_amount: number
  local?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface SupplierPayment {
  id: string
  invoice_id: string
  payment_date?: string
  payment_amount: number
  payment_method?: string
  is_brozziano: boolean
  bank_payment: boolean
  bank_payment_amount: number
  bank_payment_date?: string
  cash_payment: boolean
  cash_payment_amount: number
  cash_payment_date?: string
  status: "pending" | "partial" | "completed"
  notes?: string
  created_at: string
  updated_at: string
}

export interface SupplierWithDetails extends Supplier {
  products?: SupplierProduct[]
  discounts?: SupplierDiscount[]
}

export interface InvoiceWithDetails extends SupplierInvoice {
  supplier?: Supplier
  payments?: SupplierPayment[]
}

export interface PaymentWithDetails extends SupplierPayment {
  invoice?: SupplierInvoice
  supplier?: Supplier
}

