'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function EmpleadosTest() {
  const [employees, setEmployees] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchEmployees() {
      try {
        setIsLoading(true)
        
        // Intentar obtener empleados directamente
        const { data, error } = await supabase
          .from('employees')
          .select('*')
        
        if (error) {
          throw error
        }
        
        console.log('Empleados obtenidos:', data)
        setEmployees(data || [])
      } catch (err) {
        console.error('Error al obtener empleados:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchEmployees()
  }, [supabase])

  // También obtener datos desde nuestro endpoint de prueba
  useEffect(() => {
    async function fetchFromAPI() {
      try {
        const response = await fetch('/api/test-employees')
        const result = await response.json()
        console.log('Datos desde API de prueba:', result)
      } catch (err) {
        console.error('Error al obtener desde API de prueba:', err)
      }
    }
    
    fetchFromAPI()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Prueba de Lista de Empleados</h1>
      
      {isLoading && <p>Cargando empleados...</p>}
      
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      {!isLoading && !error && (
        <>
          <p className="mb-4">Total de empleados: {employees.length}</p>
          
          {employees.length === 0 ? (
            <p>No hay empleados para mostrar.</p>
          ) : (
            <ul className="space-y-2">
              {employees.map((employee) => (
                <li key={employee.id} className="p-4 border rounded">
                  {employee.first_name} {employee.last_name} - {employee.position}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}