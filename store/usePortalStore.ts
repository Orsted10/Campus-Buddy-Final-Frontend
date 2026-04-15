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
  culkoCookies: Record<string, string> | null
  
  // Actions
  setPortalData: (data: Partial<PortalState>) => void
  setPortalStatus: (status: 'connected' | 'no_session' | 'error') => void
  setPortalCookies: (cookies: Record<string, string> | null) => void
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
      culkoCookies: null,

      setPortalData: (data) => set((state) => ({ ...state, ...data })),
      
      setPortalStatus: (status) => set({ portalStatus: status }),
      setPortalCookies: (cookies) => set({ culkoCookies: cookies }),
      
      checkStatus: async () => {
        try {
          const res = await fetch(getApiUrl('/api/culko/status'), {
            headers: {
              'x-culko-session': get().culkoCookies ? JSON.stringify(get().culkoCookies) : ''
            }
          })
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
        lastSync: null,
        isSyncing: false,
        culkoCookies: null
      }),

      syncAll: async (): Promise<boolean> => {
        if (get().isSyncing) return false
        
        set({ isSyncing: true })
        
        try {
          // KEY FIX: If already marked 'connected' (persisted), skip HTTP status check.
          // The HTTP check fails on mobile Capacitor webview since cookies aren't 
          // forwarded the same way. Trust the persisted status instead.
          const currentStatus = get().portalStatus
          if (currentStatus !== 'connected') {
            const connected = await get().checkStatus()
            if (!connected) {
              set({ isSyncing: false })
              return false
            }
          }

          const headers = {
            'x-culko-session': get().culkoCookies ? JSON.stringify(get().culkoCookies) : ''
          }

          const [attendRes, ttRes, profileRes, hostelRes, marksRes] = await Promise.all([
            fetch(getApiUrl('/api/culko?endpoint=attendance'), { headers }),
            fetch(getApiUrl('/api/culko?endpoint=timetable'), { headers }),
            fetch(getApiUrl('/api/culko?endpoint=profile'), { headers }),
            fetch(getApiUrl('/api/culko?endpoint=hostel'), { headers }),
            fetch(getApiUrl('/api/culko?endpoint=marks'), { headers }),
          ])

          // 401 on all data endpoints = session truly died
          if (attendRes.status === 401 && profileRes.status === 401) {
            set({ portalStatus: 'no_session', isSyncing: false })
            return false
          }

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

          set(updates)
          return true
        } catch (err) {
          console.error('Portal sync failed:', err)
          // Don't set 'error' status here — it would clear mobile persistence
          set({ isSyncing: false })
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
        portalStatus: state.portalStatus,
        culkoCookies: state.culkoCookies
      })
    }
  )
)
