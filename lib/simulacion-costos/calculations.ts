/**
 * Calcula la rentabilidad de un producto basado en los precios y descuentos
 *
 * @param purchasePrice Precio de compra original
 * @param salePrice Precio de venta
 * @param discount Porcentaje de descuento aplicado al precio de compra
 * @param quantity Cantidad de unidades
 * @param additionalCosts Costos adicionales por unidad
 * @returns Objeto con los cálculos de rentabilidad
 */
export function calculateProfitability(
  purchasePrice: number,
  salePrice: number,
  discount: number,
  quantity = 1,
  additionalCosts = 0,
) {
  // Calcular el nuevo precio de compra con el descuento aplicado
  const newPurchasePrice = purchasePrice * (1 - discount / 100)

  // Calcular la rentabilidad actual (sin descuento)
  const totalPurchaseCost = (purchasePrice + additionalCosts) * quantity
  const totalSaleRevenue = salePrice * quantity
  const currentProfitability = totalSaleRevenue - totalPurchaseCost

  // Calcular la nueva rentabilidad (con descuento)
  const totalNewPurchaseCost = (newPurchasePrice + additionalCosts) * quantity
  const newProfitability = totalSaleRevenue - totalNewPurchaseCost

  // Calcular la diferencia de rentabilidad
  const profitabilityDifference = newProfitability - currentProfitability

  // Calcular porcentajes de rentabilidad
  const profitabilityPercentage = (currentProfitability / totalPurchaseCost) * 100
  const newProfitabilityPercentage = (newProfitability / totalNewPurchaseCost) * 100

  return {
    currentProfitability,
    newPurchasePrice,
    newProfitability,
    profitabilityDifference,
    profitabilityPercentage,
    newProfitabilityPercentage,
  }
}

/**
 * Calcula el impacto de un cambio en el precio de venta en la rentabilidad
 *
 * @param purchasePrice Precio de compra
 * @param currentSalePrice Precio de venta actual
 * @param newSalePrice Nuevo precio de venta
 * @param quantity Cantidad de unidades
 * @param additionalCosts Costos adicionales por unidad
 * @returns Objeto con los cálculos de impacto
 */
export function calculateSalePriceImpact(
  purchasePrice: number,
  currentSalePrice: number,
  newSalePrice: number,
  quantity = 1,
  additionalCosts = 0,
) {
  // Calcular la rentabilidad actual
  const totalPurchaseCost = (purchasePrice + additionalCosts) * quantity
  const totalCurrentSaleRevenue = currentSalePrice * quantity
  const currentProfitability = totalCurrentSaleRevenue - totalPurchaseCost

  // Calcular la nueva rentabilidad
  const totalNewSaleRevenue = newSalePrice * quantity
  const newProfitability = totalNewSaleRevenue - totalPurchaseCost

  // Calcular la diferencia de rentabilidad
  const profitabilityDifference = newProfitability - currentProfitability

  // Calcular porcentajes de rentabilidad
  const currentProfitabilityPercentage = (currentProfitability / totalPurchaseCost) * 100
  const newProfitabilityPercentage = (newProfitability / totalPurchaseCost) * 100

  return {
    currentProfitability,
    newProfitability,
    profitabilityDifference,
    currentProfitabilityPercentage,
    newProfitabilityPercentage,
  }
}

/**
 * Calcula el precio de venta recomendado para alcanzar un margen de rentabilidad objetivo
 *
 * @param purchasePrice Precio de compra
 * @param targetMarginPercentage Porcentaje de margen objetivo
 * @param additionalCosts Costos adicionales por unidad
 * @returns Precio de venta recomendado
 */
export function calculateRecommendedSalePrice(
  purchasePrice: number,
  targetMarginPercentage: number,
  additionalCosts = 0,
) {
  const totalCost = purchasePrice + additionalCosts
  const marginMultiplier = 1 + targetMarginPercentage / 100
  const recommendedSalePrice = totalCost * marginMultiplier

  return recommendedSalePrice
}

