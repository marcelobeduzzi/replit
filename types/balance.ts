export interface BalanceServicios {
  id?: string
  balanceId: string
  prosegur: number
  internet: number
  seguro: number
  desinfectacion: number
  edenor: number
  metrogas: number
  abl: number
  expensas: number
  autonomo: number
  abogado: number
  contador: number
  datalive: number
  payway: number
  personal: number
  total: number
  createdAt?: string
  updatedAt?: string
}

export interface Balance {
  id?: string
  localId: string
  local: string
  month: number
  year: number

  // Ingresos
  ventasRappi: number
  ventasPedidosYa: number
  ventasDebitoCreditoQR: number // Con QR en mayúsculas
  ventasEfectivo: number

  // Costos y gastos
  cmv: number // Costo de mercadería vendida
  cmvPorcentaje: number // Calculado
  desperdicio: number
  consumos: number
  contribucionMarginal: number

  // Servicios (total de la tabla de servicios)
  servicios: number

  // Otros gastos
  fee: number
  alquiler: number
  sueldos: number
  sueldosPorcentaje: number // Calculado
  gastos: number

  // Impuestos y retenciones
  ebit: number
  iva: number
  iibb: number
  ccss: number
  tarjeta: number

  // Resultados
  retornoNeto: number // Calculado

  createdAt?: string
  updatedAt?: string
}
