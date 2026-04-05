import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile } from '@/types/database'

interface AuthState {
  user: Profile | null
  _hasHydrated: boolean
  setUser: (user: Profile | null) => void
  clearUser: () => void
  reset: () => void
  setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      _hasHydrated: false,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      reset: () => set({ user: null, _hasHydrated: false }),
      setHasHydrated: (state) => set({ _hasHydrated: state })
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state) state.setHasHydrated(true)
      }
    }
  )
)
