'use client'

import { create } from 'zustand'
import { User } from '@/lib/auth'

interface AuthStore {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  clearAuth: () => set({ user: null, loading: false }),
}))