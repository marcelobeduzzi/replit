/**
 * Módulo de cálculos de nómina
 * Contiene la lógica principal para calcular salarios, deducciones y adiciones
 */

import { 
  SalaryConfig, 
  AttendanceRecord, 
  SalaryAdjustment, 
  PayrollCalculation,
  EmployeeSalary 
} from './types';
import { PAYROLL_LIMITS } from './config';

export class PayrollCalculator {
  constructor(private config: SalaryConfig) {}

  /**
   * Calcula la tarifa diaria basada en el salario base
   */
  calculateDailyRate(baseSalary: number): number {
    return baseSalary / this.config.workingDaysPerMonth;
  }

  /**
   * Calcula la tarifa por hora basada en el salario base
   */
  calculateHourlyRate(baseSalary: number): number {
    return this.calculateDailyRate(baseSalary) / this.config.workingHoursPerDay;
  }

  /**
   * Calcula la tarifa por minuto basada en el salario base
   */
  calculateMinuteRate(baseSalary: number): number {
    return this.calculateHourlyRate(baseSalary) / 60;
  }

  /**
   * Calcula las deducciones y adiciones basadas en las asistencias
   */
  calculateAdjustments(
    attendances: AttendanceRecord[],
    baseSalary: number
  ): { deductions: SalaryAdjustment[], additions: SalaryAdjustment[] } {
    const deductions: SalaryAdjustment[] = [];
    const additions: SalaryAdjustment[] = [];
    const minuteRate = this.calculateMinuteRate(baseSalary);
    const dailyRate = this.calculateDailyRate(baseSalary);

    for (const attendance of attendances) {
      // Procesar ausencias injustificadas
      if (attendance.isAbsent && !attendance.isJustified && !attendance.isHoliday) {
        deductions.push({
          type: 'deduction',
          concept: 'Ausencia Injustificada',
          amount: dailyRate,
          date: attendance.date,
          notes: `Ausencia el día ${attendance.date}`
        });
      }

      // Procesar llegadas tarde
      if (attendance.lateMinutes > 0) {
        const lateAmount = minuteRate * attendance.lateMinutes;
        deductions.push({
          type: 'deduction',
          concept: 'Llegada Tarde',
          amount: lateAmount,
          date: attendance.date,
          notes: `${attendance.lateMinutes} minutos tarde`
        });
      }

      // Procesar salidas anticipadas
      if (attendance.earlyDepartureMinutes > 0) {
        const earlyAmount = minuteRate * attendance.earlyDepartureMinutes;
        deductions.push({
          type: 'deduction',
          concept: 'Salida Anticipada',
          amount: earlyAmount,
          date: attendance.date,
          notes: `${attendance.earlyDepartureMinutes} minutos antes`
        });
      }

      // Procesar horas extra
      if (attendance.extraMinutes >= PAYROLL_LIMITS.MIN_OVERTIME_MINUTES) {
        const extraMinutes = Math.min(
          attendance.extraMinutes,
          PAYROLL_LIMITS.MAX_OVERTIME_MINUTES
        );
        const extraAmount = minuteRate * extraMinutes * this.config.overtimeMultiplier;
        additions.push({
          type: 'addition',
          concept: 'Horas Extra',
          amount: extraAmount,
          date: attendance.date,
          notes: `${extraMinutes} minutos extra`
        });
      }

      // Procesar feriados trabajados
      if (attendance.isHoliday && !attendance.isAbsent) {
        additions.push({
          type: 'addition',
          concept: 'Feriado Trabajado',
          amount: dailyRate * this.config.holidayMultiplier,
          date: attendance.date,
          notes: 'Trabajo en día feriado'
        });
      }
    }

    return { deductions, additions };
  }

  /**
   * Calcula el sueldo final basado en todos los componentes
   */
  calculateFinalSalary(
    employee: EmployeeSalary,
    deductions: SalaryAdjustment[],
    additions: SalaryAdjustment[]
  ): PayrollCalculation {
    // Calcular totales de deducciones y adiciones
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const totalAdditions = additions.reduce((sum, a) => sum + a.amount, 0);

    // Calcular sueldo en mano ajustado
    const adjustedHandSalary = employee.handSalary - totalDeductions + totalAdditions;

    // Aplicar bono de asistencia si corresponde
    let attendanceBonus = undefined;
    let bonusAmount = 0;
    if (employee.hasAttendanceBonus && employee.attendanceBonusAmount) {
      attendanceBonus = {
        amount: employee.attendanceBonusAmount,
        applied: true
      };
      bonusAmount = employee.attendanceBonusAmount;
    }

    // Calcular sueldo total incluyendo bono
    const totalSalary = adjustedHandSalary + employee.bankSalary + bonusAmount;

    return {
      handSalary: employee.handSalary,
      bankSalary: employee.bankSalary,
      baseSalary: employee.baseSalary,
      deductions: {
        total: totalDeductions,
        details: deductions
      },
      additions: {
        total: totalAdditions,
        details: additions
      },
      attendanceBonus,
      adjustedHandSalary,
      totalSalary
    };
  }

  /**
   * Redondea un valor monetario a 2 decimales
   */
  private roundMoney(amount: number): number {
    return Math.round(amount * 100) / 100;
  }
} 