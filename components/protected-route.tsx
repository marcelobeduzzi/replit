"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole: string
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login")
      } else if (user.role !== requiredRole) {
        router.push("/unauthorized")
      }
    }
  }, [user, isLoading, router, requiredRole])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!user || user.role !== requiredRole) {
    return null
  }

  return <>{children}</>
}
