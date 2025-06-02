/**
 * Configuración del módulo de nómina
 * Define los valores por defecto y funciones de configuración para los cálculos de nómina
 */

import { SalaryConfig } from './types';

/**
 * Configuración por defecto para los cálculos de nómina
 */
export const DEFAULT_SALARY_CONFIG: SalaryConfig = {
  overtimeMultiplier: 1.5,
  holidayMultiplier: 2.0,
  workingHoursPerDay: 8,
  workingDaysPerMonth: 30
};

/**
 * Límites y restricciones para los cálculos
 */
export const PAYROLL_LIMITS = {
  /** Porcentaje máximo de deducciones sobre el sueldo en mano */
  MAX_DEDUCTIONS_PERCENTAGE: 0.5,
  /** Porcentaje máximo de adiciones sobre el sueldo en mano */
  MAX_ADDITIONS_PERCENTAGE: 0.5,
  /** Monto mínimo de horas extra para aplicar el multiplicador */
  MIN_OVERTIME_MINUTES: 30,
  /** Monto máximo de horas extra por día */
  MAX_OVERTIME_MINUTES: 240
};

/**
 * Crea una nueva configuración de salario con valores personalizados
 * @param config Configuración parcial que sobrescribe los valores por defecto
 */
export function createSalaryConfig(config: Partial<SalaryConfig>): SalaryConfig {
  return {
    ...DEFAULT_SALARY_CONFIG,
    ...config
  };
}

/**
 * Valida que la configuración de salario sea válida
 * @param config Configuración a validar
 */
export function validateSalaryConfig(config: SalaryConfig): string[] {
  const errors: string[] = [];

  if (config.overtimeMultiplier < 1) {
    errors.push('El multiplicador de horas extra debe ser mayor o igual a 1');
  }

  if (config.holidayMultiplier < 1) {
    errors.push('El multiplicador de feriados debe ser mayor o igual a 1');
  }

  if (config.workingHoursPerDay <= 0 || config.workingHoursPerDay > 24) {
    errors.push('Las horas laborales por día deben estar entre 1 y 24');
  }

  if (config.workingDaysPerMonth <= 0 || config.workingDaysPerMonth > 31) {
    errors.push('Los días laborales por mes deben estar entre 1 y 31');
  }

  return errors;
}

/**
 * Obtiene la configuración actual de salario
 * En el futuro, esto podría cargarse desde una base de datos o archivo de configuración
 */
export async function getCurrentSalaryConfig(): Promise<SalaryConfig> {
  // Por ahora retorna la configuración por defecto
  // TODO: Implementar carga desde base de datos o archivo de configuración
  return DEFAULT_SALARY_CONFIG;
} 