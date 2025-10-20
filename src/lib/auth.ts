import { supabase } from './supabase'
import { Database } from '@/types/database'

export type User = Database['public']['Tables']['profiles']['Row']

export interface AuthState {
  user: User | null
  loading: boolean
}

export const auth = {
  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    // Get user profile
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      if (profileError) throw profileError
      return { user: data.user, profile }
    }
    
    return { user: data.user, profile: null }
  },

  // Sign up with email and password
  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    })
    
    if (error) throw error
    return data
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },

  // Get current user profile
  async getCurrentUser(): Promise<User | null> {
    const session = await this.getSession()
    if (!session?.user) return null
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (error) throw error
    return profile
  },

  // Check if user has required role
  hasRole(user: User | null, requiredRoles: string[]): boolean {
    if (!user) return false
    return requiredRoles.includes(user.role)
  },

  // Check if user is admin
  isAdmin(user: User | null): boolean {
    return this.hasRole(user, ['admin'])
  },

  // Check if user is manager or admin
  isManagerOrAdmin(user: User | null): boolean {
    return this.hasRole(user, ['admin', 'manager'])
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}