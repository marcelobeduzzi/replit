export type UserRole = "admin" | "manager" | "supervisor" | "employee" | "cashier" | "waiter" | "kitchen"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Permission {
  id: string
  name: string
  description: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
}

