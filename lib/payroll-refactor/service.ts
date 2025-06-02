/**
 * Servicio principal de nómina
 * Integra todos los módulos y proporciona la interfaz principal para el cálculo de nómina
 * 
 * NOTA: Este servicio actúa como wrapper de PayrollService de db-payroll.ts
 * para mantener la compatibilidad mientras se refactoriza el sistema.
 */

import { PayrollService as DBPayrollService } from '@/lib/db/db-payroll';
import { PayrollCalculator } from './calculations';
import { PayrollValidator } from './validation';
import { getCurrentSalaryConfig } from './config';
import { 
  PayrollCalculation, 
  EmployeeSalary, 
  AttendanceRecord,
  PayrollValidation 
} from './types';

export class PayrollService {
  private calculator: PayrollCalculator;
  private validator: PayrollValidator;
  private dbPayroll: DBPayrollService;

  constructor() {
    // Inicializar con configuración por defecto
    // La configuración real se cargará en el primer uso
    this.calculator = new PayrollCalculator({
      overtimeMultiplier: 1.5,
      holidayMultiplier: 2.0,
      workingHoursPerDay: 8,
      workingDaysPerMonth: 30
    });
    this.validator = new PayrollValidator();
    this.dbPayroll = new DBPayrollService();
  }

  /**
   * Inicializa el servicio con la configuración actual
   */
  private async initialize() {
    const config = await getCurrentSalaryConfig();
    this.calculator = new PayrollCalculator(config);
  }

  /**
   * Obtiene los datos del empleado
   * @deprecated Usar DBPayrollService.getEmployeeData directamente
   */
  private async getEmployeeData(employeeId: string): Promise<EmployeeSalary> {
    // TODO: Implementar usando db-employees.ts
    throw new Error('Método deprecado. Usar DBPayrollService.getEmployeeData');
  }

  /**
   * Obtiene las asistencias del empleado para un período
   * @deprecated Usar DBPayrollService.getAttendances directamente
   */
  private async getAttendances(
    employeeId: string,
    month: number,
    year: number
  ): Promise<AttendanceRecord[]> {
    // TODO: Implementar usando db-attendance.ts
    throw new Error('Método deprecado. Usar DBPayrollService.getAttendances');
  }

  /**
   * Calcula la nómina para un empleado en un período específico
   * @deprecated Usar DBPayrollService.calculatePayroll directamente
   */
  async calculatePayroll(
    employeeId: string,
    month: number,
    year: number
  ): Promise<{ calculation: PayrollCalculation; validation: PayrollValidation }> {
    // TODO: Implementar usando DBPayrollService
    throw new Error('Método deprecado. Usar DBPayrollService.calculatePayroll');
  }

  /**
   * Guarda una nómina calculada en la base de datos
   * @deprecated Usar DBPayrollService.savePayroll directamente
   */
  async savePayroll(
    employeeId: string,
    month: number,
    year: number,
    calculation: PayrollCalculation
  ): Promise<void> {
    // TODO: Implementar usando DBPayrollService
    throw new Error('Método deprecado. Usar DBPayrollService.savePayroll');
  }

  /**
   * Obtiene una nómina existente
   * @deprecated Usar DBPayrollService.getPayroll directamente
   */
  async getPayroll(employeeId: string, month: number, year: number): Promise<PayrollCalculation | null> {
    // TODO: Implementar usando DBPayrollService
    throw new Error('Método deprecado. Usar DBPayrollService.getPayroll');
  }
} 