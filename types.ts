export type Employee = {
  id: string
  firstName: string
  lastName: string
  documentId: string
  position: string
  local: string
  hireDate: string
  terminationDate?: string
  status: string
}

export type Payroll = {
  id: string
  employeeId: string
  month: number
  year: number
  baseSalary: number
  bankSalary: number
  handSalary: number
  deductions: number
  additions: number
  finalHandSalary: number
  totalSalary: number
  isPaid: boolean
  handSalaryPaid: boolean
  bankSalaryPaid: boolean
  paymentDate?: string | null
  paymentMethod?: string | null
  paymentReference?: string | null
  details?: PayrollDetail[]
  createdAt: string
  updatedAt: string
  attendanceBonus?: boolean // Nuevo campo para el bono de presentismo
  attendanceBonusAmount?: number // Monto del bono de presentismo
}

export type PayrollDetail = {
  id: string
  payrollId: string
  concept: string
  type: "addition" | "deduction"
  amount: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export type Liquidation = {
  id: string
  employeeId: string
  terminationDate: string
  workedDays: number
  workedMonths: number
  daysToPayInLastMonth?: number
  baseSalary: number
  // Eliminamos lastMonthSalary que no existe en la base de datos
  proportionalVacation: number
  proportionalBonus: number
  compensationAmount: number
  totalAmount: number
  isPaid: boolean
  includeVacation?: boolean
  includeBonus?: boolean
  paymentDate?: string | null
  paymentMethod?: string | null
  paymentReference?: string | null
  notes?: string
  createdAt: string
  updatedAt: string
}

export type Audit = {
  id: string
  localId: string
  localName: string
  auditor: string
  auditorName?: string
  date: string
  shift: string
  notes?: string
  observations?: string
  generalObservations?: string
  items?: AuditItem[]
  totalScore: number
  maxScore: number
  percentage: number
  type: "rapida" | "detallada"
  categories?: AuditCategory[]
  managerName?: string
}

export type AuditItem = {
  id: string
  name: string
  value: number
  completed: boolean
  category: string
  score?: number
  maxScore?: number
  observations?: string
}

export type AuditCategory = {
  id: string
  name: string
  score: number
  maxScore: number
  items: AuditItem[]
}

export type Balance = {
  id: string
  local: string
  month: number
  year: number
  counterSales: number
  deliverySales: number
  totalIncome: number
  payrollExpenses: number
  rentExpenses: number
  maintenanceExpenses: number
  suppliesExpenses: number
  repairsExpenses: number
  otherExpenses: number
  totalExpenses: number
  netProfit: number
}

export type Order = {
  id: string
  date: string
  local: string
  localName?: string
  clientName?: string
  clientPhone?: string
  clientAddress?: string
  items: OrderItem[]
  total: number
  notes?: string
  observations?: string
  status: string
  createdAt?: string
}

export type OrderItem = {
  id: string
  orderId: string
  productName: string
  quantity: number
  price: number
}

// Actualización del tipo WorkShift para incluir más opciones de turnos
export type WorkShift =
  | "morning"
  | "afternoon"
  | "night"
  | "full_time"
  | "part_time"
  | "morning_cabildo"
  | "afternoon_cabildo"
  | "morning_carranza"
  | "afternoon_carranza"
  | "morning_pacifico"
  | "afternoon_pacifico"
  | "morning_lavalle"
  | "afternoon_lavalle"
  | "morning_rivadavia"
  | "afternoon_rivadavia"
  | "morning_aguero"
  | "afternoon_aguero"
  | "morning_dorrego"
  | "afternoon_dorrego"
  | "morning_dean"
  | "afternoon_dean"

// Actualización del tipo Local para incluir "Capacitación"
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
  | "Capacitación"

export type EmployeeStatus = "active" | "inactive" | "on_leave" | "vacation"

export type UserRole = "admin" | "manager" | "supervisor" | "employee" | "cashier" | "waiter" | "kitchen"

// Actualización de la interfaz Employee para incluir el campo de presentismo
export interface EmployeeDetails {
  id: string
  firstName: string
  lastName: string
  documentType: string
  documentId: string
  phone: string
  email: string
  address: string
  birthDate: string
  hireDate: string
  terminationDate?: string | null
  position: string
  local: Local
  workShift: WorkShift
  baseSalary: number
  bankSalary: number
  totalSalary: number
  status: EmployeeStatus
  role: UserRole
  notes?: string
  attendanceBonus?: boolean // Nuevo campo para el bono de presentismo
  customStartTime?: string // Hora de entrada personalizada
  customEndTime?: string // Hora de salida personalizada
}

// Actualización de la interfaz PayrollDetails para incluir el bono de presentismo
export interface PayrollDetails {
  concept: string
  type: "addition" | "deduction"
  amount: number
}
