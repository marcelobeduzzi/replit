"use client"

import { useEffect, useState } from 'react'
import { dbService } from '@/lib/db-service'

export default function DiagnosticPage() {
  const [tableStructures, setTableStructures] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkStructures = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Lista de tablas a verificar
        const tables = ['employees', 'attendance', 'payroll', 'delivery_stats', 'audits', 'billing', 'balance']
        
        const structures: Record<string, string[]> = {}
        
        // Verificar cada tabla
        for (const table of tables) {
          try {
            const columns = await dbService.checkTableStructure(table)
            structures[table] = columns
          } catch (err) {
            console.error(`Error al verificar la tabla ${table}:`, err)
            structures[table] = [`Error: ${err instanceof Error ? err.message : String(err)}`]
          }
        }
        
        setTableStructures(structures)
      } catch (err) {
        setError(`Error general: ${err instanceof Error ? err.message : String(err)}`)
        console.error('Error al verificar las estructuras:', err)
      } finally {
        setLoading(false)
      }
    }
    
    checkStructures()
  }, [])
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Diagnóstico de Base de Datos</h1>
      
      {loading && <p>Cargando estructuras de tablas...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {!loading && !error && (
        <div className="space-y-6">
          {Object.entries(tableStructures).map(([table, columns]) => (
            <div key={table} className="border rounded p-4">
              <h2 className="text-xl font-semibold mb-2">{table}</h2>
              {columns.length > 0 ? (
                <div className="bg-gray-100 p-3 rounded">
                  <h3 className="font-medium mb-1">Columnas:</h3>
                  <ul className="list-disc pl-5">
                    {columns.map((column, index) => (
                      <li key={index}>{column}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-yellow-600">La tabla está vacía o no existe</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}