export type UserRole = "admin" | "manager" | "supervisor" | "employee" | "cashier" | "waiter" | "kitchen"

export type EmployeeStatus = "active" | "inactive" | "on_leave" | "vacation"

export type Local =
  | "BR Cabildo"
  | "BR Carranza"
  | "BR Pacifico"
  | "BR Lavalle"
  | "BR Rivadavia"
  | "BR Aguero"
  | "BR Dorrego"
  | "Dean & Dennys"
  | "Administración"

export type WorkShift = "morning" | "afternoon" | "night" | "full_time" | "part_time"

export type DeliveryPlatform = "PedidosYa" | "Rappi" | "MercadoPago"

export type Restaurant =
  | "BR Cabildo"
  | "BR Carranza"
  | "BR Pacifico"
  | "BR Lavalle"
  | "BR Rivadavia"
  | "BR Aguero"
  | "BR Dorrego"
  | "Dean & Dennys"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Employee {
  id: string
  firstName: string
  lastName: string
  documentId: string
  documentType: string
  phone: string
  email: string
  address: string
  birthDate: string
  hireDate: string
  terminationDate?: string
  position: string
  local: Local
  workShift: WorkShift
  baseSalary: number
  bankSalary: number
  totalSalary: number
  status: EmployeeStatus
  role: UserRole
  workedDays?: number
  createdAt: string
  updatedAt: string
  customCheckIn?: string | null
  customCheckOut?: string | null
  // Eliminamos los campos de bono que ya no existen en la tabla
  // attendanceBonus?: number
  // hasAttendanceBonus?: boolean
}

export interface Attendance {
  id: string
  employeeId: string
  date: string
  checkIn: string
  checkOut: string
  status: 'present' | 'absent' | 'late' | 'early_leave'
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Payroll {
  id: string
  employeeId: string
  month: number
  year: number
  baseSalary: number
  bankSalary: number
  handSalary: number
  finalHandSalary: number
  totalSalary: number
  deductions: number
  additions: number
  hasAttendanceBonus: boolean
  attendanceBonus: number
  isPaid: boolean
  paymentDate?: string
  paymentMethod?: string
  paymentReference?: string
  notes?: string
  createdAt: string
  updatedAt: string
  // Campos de la base de datos (snake_case)
  base_salary?: number
  bank_salary?: number
  hand_salary?: number
  final_hand_salary?: number
  total_salary?: number
  has_attendance_bonus?: boolean
  attendance_bonus?: number
  is_paid?: boolean
  payment_date?: string
  payment_method?: string
  payment_reference?: string
  created_at?: string
  updated_at?: string
}

export interface PayrollDetail {
  id: string
  payrollId: string
  type: "deduction" | "addition"
  concept: string
  amount: number
  date: string
  createdAt: string
  updatedAt: string
}

export interface DeliveryStats {
  id: string
  platform: string
  week: number
  year: number
  orderCount: number
  revenue: number
  complaints: number
  rating: number
  local: string
  createdAt: string
  updatedAt: string
}

export interface Audit {
  id: string
  localId?: string
  local: string
  date: string
  shift: "morning" | "afternoon" | "night"
  supervisorId?: string
  supervisorName: string
  managerId?: string
  managerName: string
  totalScore: number
  maxScore?: number
  currentScore?: number
  notes?: string
  items: AuditItem[]
  categories?: AuditCategory[]
  auditor?: string
  createdAt: string
  updatedAt?: string
}

export interface AuditItem {
  id: string
  category: string
  categoryId?: string
  name: string
  value: number
  completed: boolean
}

export interface AuditCategory {
  id: string
  name: string
  items: AuditItem[]
}

export interface Billing {
  id: string
  localId: string
  local: string
  month: number
  year: number
  amount: number
  createdAt: string
  updatedAt: string
}

export interface Balance {
  id: string
  localId: string
  local: string
  month: number
  year: number
  counterSales: number
  deliverySales: number
  payrollExpenses: number
  rentExpenses: number
  maintenanceExpenses: number
  suppliesExpenses: number
  repairsExpenses: number
  otherExpenses: number
  totalIncome: number
  totalExpenses: number
  netProfit: number
  createdAt: string
  updatedAt: string
}

export interface Report {
  id: string
  name: string
  type: "bar" | "line" | "pie"
  data: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
    }[]
  }
  createdAt: string
}

// Para la sección de pedidos Brozziano
export type ProductType = "empanada" | "pizza" | "medialuna" | "caja" | "sobre" | "almibar"

export interface Product {
  id: string
  name: string
  type: ProductType
  price?: number
  cost?: number
}

export interface Order {
  id: string
  localId: string
  date: string
  items: Record<string, number>
  stock: Record<string, number>
  deliveryDate: string
  status: "pending" | "delivered" | "cancelled"
  createdAt: string
  updatedAt?: string
}

export interface Liquidation {
  id: string
  employeeId: string
  terminationDate: string
  workedDays: number
  workedMonths: number
  daysToPayInLastMonth: number
  baseSalary: number
  proportionalVacation: number
  proportionalBonus: number
  compensationAmount: number
  totalAmount: number
  isPaid: boolean
  includeVacation: boolean
  includeBonus: boolean
  paymentDate?: string
  paymentMethod?: string
  paymentReference?: string
  notes?: string
  createdAt: string
  updatedAt: string
}
