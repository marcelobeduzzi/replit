import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

class SessionManager {
  async validateSession(): Promise<{ valid: boolean; user?: User; error?: string }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        return { valid: false, error: error?.message || 'No session' }
      }

      const userData: User = {
        id: user.id,
        email: user.email || '',
        name: user.email?.split('@')[0] || '',
        role: 'admin',
        isActive: true,
        createdAt: user.created_at || new Date().toISOString(),
        updatedAt: user.updated_at || new Date().toISOString()
      }

      return { valid: true, user: userData }
    } catch (error: any) {
      return { valid: false, error: error.message }
    }
  }

  public async login(email: string, password: string): Promise<{ success: boolean, user?: User, error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { success: false, error: error.message }
      }

      const user: User = {
        id: data.user!.id,
        email: data.user!.email!,
        name: data.user!.email?.split('@')[0] || '',
        role: 'admin',
        isActive: true,
        createdAt: data.user!.created_at,
        updatedAt: data.user!.updated_at!
      }

      return { success: true, user: user }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  public async logout(): Promise<{ success: boolean, error?: string }> {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}

export const sessionManager = new SessionManager()