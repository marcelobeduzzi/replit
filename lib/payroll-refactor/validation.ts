/**
 * Módulo de validación de nómina
 * Contiene la lógica para validar los cálculos y datos de nómina
 */

import { PayrollCalculation, PayrollValidation } from './types';
import { PAYROLL_LIMITS } from './config';

export class PayrollValidator {
  /**
   * Valida un cálculo de nómina completo
   */
  validatePayrollCalculation(calculation: PayrollCalculation): PayrollValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar valores negativos
    if (calculation.adjustedHandSalary < 0) {
      errors.push('El sueldo ajustado en mano no puede ser negativo');
    }

    if (calculation.totalSalary < 0) {
      errors.push('El sueldo total no puede ser negativo');
    }

    // Validar que las deducciones no excedan el sueldo en mano
    const deductionsPercentage = calculation.deductions.total / calculation.handSalary;
    if (deductionsPercentage > PAYROLL_LIMITS.MAX_DEDUCTIONS_PERCENTAGE) {
      errors.push(
        `Las deducciones (${calculation.deductions.total}) no pueden exceder el ${PAYROLL_LIMITS.MAX_DEDUCTIONS_PERCENTAGE * 100}% del sueldo en mano (${calculation.handSalary})`
      );
    }

    // Validar que las adiciones no excedan el límite
    const additionsPercentage = calculation.additions.total / calculation.handSalary;
    if (additionsPercentage > PAYROLL_LIMITS.MAX_ADDITIONS_PERCENTAGE) {
      warnings.push(
        `Las adiciones (${calculation.additions.total}) superan el ${PAYROLL_LIMITS.MAX_ADDITIONS_PERCENTAGE * 100}% del sueldo en mano (${calculation.handSalary})`
      );
    }

    // Validar bono de asistencia
    if (calculation.attendanceBonus?.applied) {
      if (calculation.attendanceBonus.amount <= 0) {
        errors.push('El bono de asistencia debe ser mayor a 0');
      }
      if (calculation.attendanceBonus.amount > calculation.handSalary * 0.2) {
        warnings.push('El bono de asistencia supera el 20% del sueldo en mano');
      }
    }

    // Validar consistencia de totales
    const calculatedTotal = 
      calculation.handSalary - 
      calculation.deductions.total + 
      calculation.additions.total + 
      calculation.bankSalary + 
      (calculation.attendanceBonus?.amount || 0);

    if (Math.abs(calculatedTotal - calculation.totalSalary) > 0.01) {
      errors.push(
        `El total calculado (${calculatedTotal}) no coincide con el total reportado (${calculation.totalSalary})`
      );
    }

    // Validar que el sueldo ajustado sea consistente
    const calculatedAdjusted = 
      calculation.handSalary - 
      calculation.deductions.total + 
      calculation.additions.total;

    if (Math.abs(calculatedAdjusted - calculation.adjustedHandSalary) > 0.01) {
      errors.push(
        `El sueldo ajustado calculado (${calculatedAdjusted}) no coincide con el reportado (${calculation.adjustedHandSalary})`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valida un monto específico
   */
  validateAmount(amount: number, fieldName: string): string[] {
    const errors: string[] = [];

    if (isNaN(amount)) {
      errors.push(`${fieldName} no es un número válido`);
    }

    if (amount < 0) {
      errors.push(`${fieldName} no puede ser negativo`);
    }

    if (amount > 1000000) {
      errors.push(`${fieldName} excede el límite máximo permitido`);
    }

    return errors;
  }

  /**
   * Valida un conjunto de ajustes (deducciones o adiciones)
   */
  validateAdjustments(adjustments: { amount: number }[], type: 'deduction' | 'addition'): string[] {
    const errors: string[] = [];
    const total = adjustments.reduce((sum, adj) => sum + adj.amount, 0);

    if (total < 0) {
      errors.push(`El total de ${type === 'deduction' ? 'deducciones' : 'adiciones'} no puede ser negativo`);
    }

    for (const adj of adjustments) {
      if (adj.amount < 0) {
        errors.push(`Hay ${type === 'deduction' ? 'deducciones' : 'adiciones'} con montos negativos`);
        break;
      }
    }

    return errors;
  }
} 