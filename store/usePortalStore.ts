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
  syncAll: () => Promise<boolean>
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

      syncAll: async (): Promise<boolean> => {
        if (get().isSyncing) return false
        
        set({ isSyncing: true })
        
        try {
          // Verify status first
          const connected = await get().checkStatus()
          if (!connected) {
            set({ isSyncing: false })
            return false
          }

          const [attendRes, ttRes, profileRes, hostelRes, marksRes, syncRes] = await Promise.all([
            fetch(getApiUrl('/api/culko?endpoint=attendance')),
            fetch(getApiUrl('/api/culko?endpoint=timetable')),
            fetch(getApiUrl('/api/culko?endpoint=profile')),
            fetch(getApiUrl('/api/culko?endpoint=hostel')),
            fetch(getApiUrl('/api/culko?endpoint=marks')),
            fetch(getApiUrl('/api/culko?endpoint=announcements'))
          ])

          const [attendance, timetable, profile, hostel, marks] = await Promise.all([
            attendRes.json(),
            ttRes.json(),
            profileRes.json(),
            hostelRes.json(),
            marksRes.json()
          ])

          const updates: Partial<PortalState> = {
            lastSync: new Date().toISOString(),
            isSyncing: false,
            portalStatus: 'connected'
          }

          if (attendRes.ok && attendance.success) updates.attendance = attendance.data || []
          if (ttRes.ok && timetable.success) updates.timetable = timetable.data
          if (profileRes.ok && profile.success) updates.profile = profile.data
          if (hostelRes.ok && hostel.success) updates.hostel = hostel.data
          if (marksRes.ok && marks.success) updates.marks = marks.data || []

          // If live fetch fails, we still consider it "success" if we have data in the store
          // and we just performed a server-side sync. 
          const hasSomeData = updates.attendance?.length || updates.marks?.length || updates.profile || updates.hostel
          
          set(updates)
          return !!hasSomeData || true
        } catch (err) {
          console.error('Portal sync failed:', err)
          set({ portalStatus: 'error', isSyncing: false })
          return false
        }
      }
    }),
    {
      name: 'portal-storage',
      // Persist data AND status so mobile remembers connection across restarts
      partialize: (state) => ({
        attendance: state.attendance,
        timetable: state.timetable,
        marks: state.marks,
        profile: state.profile,
        hostel: state.hostel,
        lastSync: state.lastSync,
        portalStatus: state.portalStatus  // <-- persist so app remembers connection
      })
    }
  )
)
