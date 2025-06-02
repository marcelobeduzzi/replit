"use client"

import StockMatrixPageContent from "./stock-matrix-page-content"

export default function StockMatrixPage() {
  // Permitir acceso a todos los roles eliminando la restricción
  return <StockMatrixPageContent />

  // Comentamos la versión con restricción para poder volver a ella después
  /*
  return (
    <ProtectedRoute requiredRole="admin">
      <StockMatrixPageContent />
    </ProtectedRoute>
  )
  */
}


