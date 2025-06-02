/**
 * Tipos y interfaces para el módulo de nómina
 * Define las estructuras de datos principales utilizadas en los cálculos de nómina
 */

export interface SalaryConfig {
  /** Multiplicador para horas extra (default 1.5) */
  overtimeMultiplier: number;
  /** Multiplicador para feriados (default 2.0) */
  holidayMultiplier: number;
  /** Horas laborales por día */
  workingHoursPerDay: number;
  /** Días laborales por mes */
  workingDaysPerMonth: number;
}

export interface AttendanceRecord {
  /** Fecha de la asistencia en formato ISO */
  date: string;
  /** Indica si el empleado estuvo ausente */
  isAbsent: boolean;
  /** Indica si la ausencia está justificada */
  isJustified: boolean;
  /** Indica si es un día feriado */
  isHoliday: boolean;
  /** Minutos de llegada tarde */
  lateMinutes: number;
  /** Minutos de salida anticipada */
  earlyDepartureMinutes: number;
  /** Minutos de horas extra */
  extraMinutes: number;
}

export interface SalaryAdjustment {
  /** Tipo de ajuste: deducción o adición */
  type: 'deduction' | 'addition';
  /** Concepto del ajuste (ej: "Llegada tarde", "Horas extra") */
  concept: string;
  /** Monto del ajuste */
  amount: number;
  /** Fecha del ajuste */
  date: string;
  /** Notas o descripción del ajuste */
  notes: string;
}

export interface PayrollCalculation {
  /** Sueldo base en mano */
  handSalary: number;
  /** Pago por banco */
  bankSalary: number;
  /** Salario base (para referencia de cálculos) */
  baseSalary: number;
  
  /** Deducciones aplicadas */
  deductions: {
    /** Total de deducciones */
    total: number;
    /** Detalle de cada deducción */
    details: SalaryAdjustment[];
  };
  
  /** Adiciones aplicadas */
  additions: {
    /** Total de adiciones */
    total: number;
    /** Detalle de cada adición */
    details: SalaryAdjustment[];
  };
  
  /** Bono de asistencia (opcional) */
  attendanceBonus?: {
    /** Monto del bono */
    amount: number;
    /** Indica si se aplicó el bono */
    applied: boolean;
  };
  
  /** Sueldo en mano ajustado (después de deducciones y adiciones) */
  adjustedHandSalary: number;
  /** Sueldo total a pagar */
  totalSalary: number;
}

export interface PayrollValidation {
  /** Indica si el cálculo es válido */
  isValid: boolean;
  /** Lista de errores encontrados */
  errors: string[];
  /** Lista de advertencias */
  warnings: string[];
}

export interface EmployeeSalary {
  /** ID del empleado */
  id: string;
  /** Nombre del empleado */
  firstName: string;
  /** Apellido del empleado */
  lastName: string;
  /** Sueldo base en mano */
  handSalary: number;
  /** Pago por banco */
  bankSalary: number;
  /** Salario base (para referencia) */
  baseSalary: number;
  /** Indica si tiene bono de asistencia */
  hasAttendanceBonus: boolean;
  /** Monto del bono de asistencia */
  attendanceBonusAmount?: number;
} 