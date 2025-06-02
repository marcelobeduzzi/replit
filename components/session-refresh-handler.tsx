"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase/client"

export function SessionRefreshHandler() {
  const lastRefreshTime = useRef<number>(Date.now())
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isAuthInitialized, setIsAuthInitialized] = useState(false)

  // Verificar que la autenticación esté inicializada
  useEffect(() => {
    const checkAuthInitialization = async () => {
      try {
        // Esperar un momento para que la autenticación se inicialice
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Verificar si hay una sesión
        const { data } = await supabase.auth.getSession()
        
        if (data?.session) {
          console.log("Sesión encontrada durante la inicialización")
        } else {
          console.log("No se encontró sesión durante la inicialización")
        }
        
        // Marcar la autenticación como inicializada
        setIsAuthInitialized(true)
      } catch (error) {
        console.error("Error al verificar la inicialización de la autenticación:", error)
        // Aún así, marcar como inicializada para continuar
        setIsAuthInitialized(true)
      }
    }
    
    checkAuthInitialization()
  }, [])

  // Configurar el refresco de sesión solo después de que la autenticación esté inicializada
  useEffect(() => {
    // No hacer nada si la autenticación no está inicializada
    if (!isAuthInitialized) return
    
    console.log("Configurando el refresco de sesión")
    
    // Función para refrescar la sesión con verificación previa
    const handleRefresh = async () => {
      try {
        const now = Date.now()
        const timeSinceLastRefresh = now - lastRefreshTime.current

        // Solo refrescar si han pasado al menos 10 minutos desde el último refresco
        if (timeSinceLastRefresh >= 10 * 60 * 1000) {
          console.log("Verificando sesión antes de refrescar...")
          
          // Verificar primero si hay una sesión activa
          const { data: sessionData } = await supabase.auth.getSession()
          
          // Solo intentar refrescar si hay una sesión activa
          if (sessionData?.session) {
            console.log("Sesión encontrada, intentando refrescar...")
            const { data, error } = await supabase.auth.refreshSession()

            if (error) {
              console.error("Error al refrescar sesión:", error)
            } else {
              console.log("Sesión refrescada correctamente")
              lastRefreshTime.current = Date.now()
            }
          } else {
            console.log("No hay sesión activa para refrescar")
          }
        }
      } catch (error) {
        console.error("Error al verificar/refrescar sesión:", error)
      }
    }

    // Esperar un tiempo antes del primer intento de refresco (5 minutos)
    const initialDelayMs = 5 * 60 * 1000
    console.log(`Programando primer refresco en ${initialDelayMs / 1000} segundos`)
    
    const initialTimeoutId = setTimeout(() => {
      handleRefresh()
      
      // Después del primer refresco, configurar el intervalo regular
      const intervalId = setInterval(handleRefresh, 10 * 60 * 1000) // 10 minutos
      
      // Guardar el ID del intervalo para limpieza
      refreshTimeoutRef.current = intervalId as unknown as NodeJS.Timeout
    }, initialDelayMs)

    // Refrescar cuando la ventana recupera el foco, pero solo después del retraso inicial
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now()
        const timeSinceLastRefresh = now - lastRefreshTime.current
        
        // Solo refrescar si han pasado al menos 10 minutos desde el último refresco
        if (timeSinceLastRefresh >= 10 * 60 * 1000) {
          handleRefresh()
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Limpiar
    return () => {
      clearTimeout(initialTimeoutId)
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current)
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [isAuthInitialized]) // Solo ejecutar cuando isAuthInitialized cambie a true

  return null
}