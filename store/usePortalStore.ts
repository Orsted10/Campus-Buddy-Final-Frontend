import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getApiUrl } from '@/lib/api-config'

interface PortalState {
  attendance: any[]
  timetable: any
  marks: any[]
  profile: any
  hostel: any
  portalStatus: 'connected' | 'no_session' | 'error' | null
  lastSync: string | null
  isSyncing: boolean
  
  // Actions
  setPortalData: (data: Partial<PortalState>) => void
  setPortalStatus: (status: 'connected' | 'no_session' | 'error') => void
  clearData: () => void
  
  // High-level sync action
  syncAll: () => Promise<void>
  checkStatus: () => Promise<boolean>
}

export const usePortalStore = create<PortalState>()(
  persist(
    (set, get) => ({
      attendance: [],
      timetable: null,
      marks: [],
      profile: null,
      hostel: null,
      portalStatus: null,
      lastSync: null,
      isSyncing: false,

      setPortalData: (data) => set((state) => ({ ...state, ...data })),
      
      setPortalStatus: (status) => set({ portalStatus: status }),
      
      checkStatus: async () => {
        try {
          const res = await fetch(getApiUrl('/api/culko/status'))
          const data = await res.json()
          if (data.connected) {
            set({ portalStatus: 'connected' })
            return true
          } else {
            set({ portalStatus: 'no_session' })
            return false
          }
        } catch {
          set({ portalStatus: 'error' })
          return false
        }
      },

      clearData: () => set({
        attendance: [],
        timetable: null,
        marks: [],
        profile: null,
        hostel: null,
        portalStatus: null,
        lastSync: null
      }),

      syncAll: async () => {
        if (get().isSyncing) return
        
        // Phase 1: Fast Status Update (<100ms)
        await get().checkStatus()
        
        set({ isSyncing: true })
        try {
          const [attendRes, ttRes, profileRes, hostelRes, syncRes] = await Promise.all([
            fetch(getApiUrl('/api/culko?endpoint=attendance')),
            fetch(getApiUrl('/api/culko?endpoint=timetable')),
            fetch(getApiUrl('/api/culko?endpoint=profile')),
            fetch(getApiUrl('/api/culko?endpoint=hostel')),
            fetch(getApiUrl('/api/culko?endpoint=announcements')) // Background sync session check
          ])

          const [attendance, timetable, profile, hostel] = await Promise.all([
            attendRes.json(),
            ttRes.json(),
            profileRes.json(),
            hostelRes.json()
          ])

          const updates: Partial<PortalState> = {
            lastSync: new Date().toISOString(),
            isSyncing: false
          }

          if (attendRes.ok && attendance.success) updates.attendance = attendance.data || []
          if (ttRes.ok && timetable.success) updates.timetable = timetable.data
          if (profileRes.ok && profile.success) updates.profile = profile.data
          if (hostelRes.ok && hostel.success) updates.hostel = hostel.data

          const anySuccess = attendRes.ok || ttRes.ok || profileRes.ok || hostelRes.ok || syncRes.ok
          
          if (anySuccess) {
            updates.portalStatus = 'connected'
          } else if (syncRes.status === 401 || attendRes.status === 401) {
            updates.portalStatus = 'no_session'
          }

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
        hostel: state.hostel,
        lastSync: state.lastSync
      })
    }
  )
)
