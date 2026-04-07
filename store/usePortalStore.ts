import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PortalState {
  attendance: any[]
  timetable: any
  marks: any[]
  profile: any
  portalStatus: 'connected' | 'no_session' | 'error' | null
  lastSync: string | null
  isSyncing: boolean
  
  // Actions
  setPortalData: (data: Partial<PortalState>) => void
  setPortalStatus: (status: 'connected' | 'no_session' | 'error') => void
  clearData: () => void
  
  // High-level sync action
  syncAll: () => Promise<void>
}

export const usePortalStore = create<PortalState>()(
  persist(
    (set, get) => ({
      attendance: [],
      timetable: null,
      marks: [],
      profile: null,
      portalStatus: null,
      lastSync: null,
      isSyncing: false,

      setPortalData: (data) => set((state) => ({ ...state, ...data })),
      
      setPortalStatus: (status) => set({ portalStatus: status }),
      
      clearData: () => set({
        attendance: [],
        timetable: null,
        marks: [],
        profile: null,
        portalStatus: null,
        lastSync: null
      }),

      syncAll: async () => {
        if (get().isSyncing) return
        
        set({ isSyncing: true })
        try {
          // Parallel fetch for speed
          const [attendRes, ttRes, profileRes, syncRes] = await Promise.all([
            fetch('/api/culko?endpoint=attendance'),
            fetch('/api/culko?endpoint=timetable'),
            fetch('/api/culko?endpoint=profile'),
            fetch('/api/culko?endpoint=announcements') // Background sync session check
          ])

          const [attendance, timetable, profile] = await Promise.all([
            attendRes.json(),
            ttRes.json(),
            profileRes.json()
          ])

          const updates: Partial<PortalState> = {
            lastSync: new Date().toISOString(),
            isSyncing: false
          }

          if (attendRes.ok && attendance.success) updates.attendance = attendance.data || []
          if (ttRes.ok && timetable.success) updates.timetable = timetable.data
          if (profileRes.ok && profile.success) updates.profile = profile.data

          if (syncRes.ok) updates.portalStatus = 'connected'
          else if (syncRes.status === 401) updates.portalStatus = 'no_session'

          set(updates)
        } catch (err) {
          console.error('Portal sync failed:', err)
          set({ portalStatus: 'error', isSyncing: false })
        }
      }
    }),
    {
      name: 'portal-storage',
      // Only persist data, not status/syncing state
      partialize: (state) => ({
        attendance: state.attendance,
        timetable: state.timetable,
        marks: state.marks,
        profile: state.profile,
        lastSync: state.lastSync
      })
    }
  )
)
