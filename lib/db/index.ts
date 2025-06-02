// Este archivo sirve como punto de entrada para todos los servicios de base de datos
// Exporta todas las clases y funciones necesarias para mantener compatibilidad con el código existente

// Importar el cliente original de Supabase
import { supabase as originalSupabase } from "../supabase/client"

// Exportar el cliente original de Supabase
export { originalSupabase as supabase }

// Exportar desde db-core
export { DatabaseServiceBase, calculateExpectedWorkday } from "./db-core"

// Exportar desde db-employees
export { EmployeeService, employeeService } from "./db-employees"

// Exportar desde db-payroll
export { PayrollService, payrollService } from "./db-payroll"

// Exportar desde db-attendance
export { AttendanceService, attendanceService } from "./db-attendance"

// Exportar desde db-liquidation
export { LiquidationService, liquidationService } from "./db-liquidation"

// Exportar desde db-conciliation
export { ConciliationService, conciliationService } from "./db-conciliation"

// Exportar desde db-audit
export { AuditService, auditService } from "./db-audit"

// Exportar desde db-stock
export { StockService, stockService } from "./db-stock"

// Exportar desde db-orders
export { OrderService, orderService } from "./db-orders"

// Exportar desde db-reports
export { ReportService, reportService } from "./db-reports"

// Crear una instancia del servicio de base de datos para mantener compatibilidad
import { DatabaseServiceBase } from "./db-core"
import { employeeService } from "./db-employees"
import { payrollService } from "./db-payroll"
import { attendanceService } from "./db-attendance"
import { liquidationService } from "./db-liquidation"
import { conciliationService } from "./db-conciliation"
import { auditService } from "./db-audit"
import { stockService } from "./db-stock"
import { orderService } from "./db-orders"
import { reportService } from "./db-reports"

// Clase que combina todos los servicios para mantener compatibilidad con el código existente
class DatabaseService extends DatabaseServiceBase {
  // Instancias de los servicios específicos
  private _employeeService = employeeService
  private _payrollService = payrollService
  private _attendanceService = attendanceService
  private _liquidationService = liquidationService
  private _conciliationService = conciliationService
  private _auditService = auditService
  private _stockService = stockService
  private _orderService = orderService
  private _reportService = reportService

  // Métodos de empleados
  async getEmployees() {
    return this._employeeService.getEmployees()
  }

  async getEmployeeById(id: string) {
    return this._employeeService.getEmployeeById(id)
  }

  async createEmployee(employee: any) {
    return this._employeeService.createEmployee(employee)
  }

  async updateEmployee(id: string, employee: any) {
    return this._employeeService.updateEmployee(id, employee)
  }

  async deleteEmployee(id: string) {
    return this._employeeService.deleteEmployee(id)
  }

  async updateEmployeeColumns() {
    return this._employeeService.updateEmployeeColumns()
  }

  // Métodos de nómina
  async getPayrollByEmployeeId(employeeId: string) {
    return this._payrollService.getPayrollByEmployeeId(employeeId)
  }

  async createPayroll(payroll: any) {
    return this._payrollService.createPayroll(payroll)
  }

  async createPayrollDetail(detail: any) {
    return this._payrollService.createPayrollDetail(detail)
  }

  async getPayrollsByPeriod(month: number, year: number, isPaid = false) {
    return this._payrollService.getPayrollsByPeriod(month, year, isPaid)
  }

  async updatePayroll(id: string, payroll: any) {
    return this._payrollService.updatePayroll(id, payroll)
  }

  async getPayrollById(payrollId: string) {
    return this._payrollService.getPayrollById(payrollId)
  }

  async deletePayrollDetails(payrollId: string) {
    return this._payrollService.deletePayrollDetails(payrollId)
  }

  async getPayrollsByEmployeeAndPeriod(employeeId: string, month: number, year: number) {
    return this._payrollService.getPayrollsByEmployeeAndPeriod(employeeId, month, year)
  }

  // Métodos de asistencia
  async getAttendances(params: { date: string; employeeId?: string }) {
    return this._attendanceService.getAttendances(params)
  }

  async getRecentAttendances(limit = 100) {
    return this._attendanceService.getRecentAttendances(limit)
  }

  async getAttendancesByDateRange(employeeId: string, startDate: string, endDate: string) {
    return this._attendanceService.getAttendancesByDateRange(employeeId, startDate, endDate)
  }

  async getAttendanceById(id: string) {
    return this._attendanceService.getAttendanceById(id)
  }

  async getAttendanceByEmployeeId(employeeId: string) {
    return this._attendanceService.getAttendanceByEmployeeId(employeeId)
  }

  async createAttendance(attendance: any) {
    return this._attendanceService.createAttendance(attendance)
  }

  async updateAttendance(id: string, attendance: any) {
    return this._attendanceService.updateAttendance(id, attendance)
  }

  async deleteAttendance(id: string) {
    return this._attendanceService.deleteAttendance(id)
  }

  // Métodos de liquidación
  async getLiquidations(isPaid = false) {
    return this._liquidationService.getLiquidations(isPaid)
  }

  async createLiquidation(liquidation: any) {
    return this._liquidationService.createLiquidation(liquidation)
  }

  async updateLiquidation(liquidation: any) {
    return this._liquidationService.updateLiquidation(liquidation)
  }

  async generateLiquidations(inactiveEmployees: any[]) {
    return this._liquidationService.generateLiquidations(inactiveEmployees)
  }

  async updateLiquidationDaysToPayInLastMonth() {
    return this._liquidationService.updateLiquidationDaysToPayInLastMonth()
  }

  // Métodos de conciliación
  async getBilling(startDate: Date, endDate: Date) {
    return this._conciliationService.getBilling(startDate, endDate)
  }

  async createBilling(billing: any) {
    return this._conciliationService.createBilling(billing)
  }

  async getBalance(startDate: Date, endDate: Date) {
    return this._conciliationService.getBalance(startDate, endDate)
  }

  async createBalance(balance: any) {
    return this._conciliationService.createBalance(balance)
  }

  async getSalesStats(startDate?: Date, endDate?: Date) {
    return this._conciliationService.getSalesStats(startDate, endDate)
  }

  // Métodos de auditoría
  async getAudits(startDate?: Date, endDate?: Date) {
    return this._auditService.getAudits(startDate, endDate)
  }

  async createAudit(auditData: any) {
    return this._auditService.createAudit(auditData)
  }

  async getAuditById(id: string) {
    return this._auditService.getAuditById(id)
  }

  async getAuditConfig(type = "completa") {
    return this._auditService.getAuditConfig(type)
  }

  async saveAuditConfig(config: any) {
    return this._auditService.saveAuditConfig(config)
  }

  // Métodos de stock
  async getAverageSales(localId: string) {
    return this._stockService.getAverageSales(localId)
  }

  async getCurrentStock(localId: string) {
    return this._stockService.getCurrentStock(localId)
  }

  async getDeliveryStats(startDate: Date, endDate: Date) {
    return this._stockService.getDeliveryStats(startDate, endDate)
  }

  async getTopSellingProducts(limit = 10, startDate?: Date, endDate?: Date) {
    return this._stockService.getTopSellingProducts(limit, startDate, endDate)
  }

  async checkTableStructure(tableName: string) {
    return this._stockService.checkTableStructure(tableName)
  }

  // Métodos de pedidos
  async saveOrder(orderData: any) {
    return this._orderService.saveOrder(orderData)
  }

  async getOrderById(id: string) {
    return this._orderService.getOrderById(id)
  }

  async getAllOrders() {
    return this._orderService.getAllOrders()
  }

  // Métodos de informes
  async getDashboardStats() {
    return this._reportService.getDashboardStats()
  }

  async generateReports() {
    return this._reportService.generateReports()
  }
}

// Crear una instancia del servicio combinado
export const dbService = new DatabaseService()

// Exportar la función getSupabase para mantener compatibilidad
export const getSupabase = () => {
  console.log("DB/INDEX: Obteniendo cliente Supabase original")
  return originalSupabase
}

// Crear un objeto que imita la estructura de Prisma pero usa dbService internamente
export const db = {
  // Adaptador para attendance
  attendance: {
    findMany: async ({ take, orderBy }: { take?: number; orderBy?: any } = {}) => {
      // Convertir los parámetros de Prisma a los que espera dbService
      const limit = take || 100
      return await dbService.getRecentAttendances(limit)
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      return await dbService.getAttendanceById(where.id)
    },
    create: async ({ data }: { data: any }) => {
      return await dbService.createAttendance(data)
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      return await dbService.updateAttendance(where.id, data)
    },
    delete: async ({ where }: { where: { id: string } }) => {
      return await dbService.deleteAttendance(where.id)
    },
  },

  // Adaptador para employees
  employees: {
    findMany: async () => {
      return await dbService.getEmployees()
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      return await dbService.getEmployeeById(where.id)
    },
    create: async ({ data }: { data: any }) => {
      return await dbService.createEmployee(data)
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      return await dbService.updateEmployee(where.id, data)
    },
    delete: async ({ where }: { where: { id: string } }) => {
      return await dbService.deleteEmployee(where.id)
    },
  },

  // Adaptador para audits
  audits: {
    findMany: async () => {
      return await dbService.getAudits()
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      return await dbService.getAuditById(where.id)
    },
    create: async ({ data }: { data: any }) => {
      return await dbService.createAudit(data)
    },
  },

  // Adaptador para orders
  orders: {
    findMany: async () => {
      return await dbService.getAllOrders()
    },
    create: async ({ data }: { data: any }) => {
      return await dbService.saveOrder(data)
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      return await dbService.getOrderById(where.id)
    },
  },
  auditConfig: {
    get: async (type = "completa") => {
      return await dbService.getAuditConfig(type)
    },
    save: async (data: any) => {
      return await dbService.saveAuditConfig(data)
    },
  },
}
