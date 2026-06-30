import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getApiUrl, isNativeApp } from '@/lib/api-config'
import { createClient } from '@/lib/supabase/client'

interface PortalState {
  attendance: any[]
  attendanceDetails: Record<string, any[]>
  timetable: any
  marks: any[]
  profile: any
  hostel: any
  portalStatus: 'connected' | 'no_session' | 'error' | null
  lastSync: string | null
  isSyncing: boolean
  culkoCookies: Record<string, string> | null
  notifications: Array<{ id: string, type: string, message: string, read: boolean, timestamp: string }>
  
  // Actions
  setPortalData: (data: Partial<PortalState>) => void
  setPortalStatus: (status: 'connected' | 'no_session' | 'error') => void
  setPortalCookies: (cookies: Record<string, string> | null) => void
  clearData: () => void
  
  // High-level sync action
  syncAll: () => Promise<boolean>
  forceSyncAll: () => Promise<boolean>
  checkStatus: () => Promise<boolean>
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
}

export const usePortalStore = create<PortalState>()(
  persist(
    (set, get) => ({
      attendance: [],
      attendanceDetails: {},
      timetable: null,
      marks: [],
      profile: null,
      hostel: null,
      portalStatus: null,
      lastSync: null,
      isSyncing: false,
      culkoCookies: null,
      notifications: [],
      forceSyncAll: async () => { return false },

      setPortalData: (data) => set((state) => ({ ...state, ...data })),
      
      setPortalStatus: (status) => set({ portalStatus: status }),
      setPortalCookies: (cookies) => set({ culkoCookies: cookies }),
      
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      })),
      
      clearNotifications: () => set({ notifications: [] }),
      
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
        attendanceDetails: {},
        timetable: null,
        marks: [],
        profile: null,
        hostel: null,
        portalStatus: null,
        lastSync: null,
        isSyncing: false,
        culkoCookies: null,
        notifications: []
      }),

      syncAll: async (): Promise<boolean> => {
        if (get().isSyncing) return false
        
        // Debounce: prevent re-sync within 5 seconds
        const last = get().lastSync
        if (last && Date.now() - new Date(last).getTime() < 5000) {
          console.log('[usePortalStore] Sync debounced (< 5s since last)')
          return false
        }
        
        const isNative = isNativeApp()

        console.log(`[usePortalStore] syncAll triggered. Native=${isNative}, Status=${get().portalStatus}`)
        
        set({ isSyncing: true })
        
        try {
          // SESSION RECOVERY: If status is 'connected' but cookies are missing on native, 
          // we are in a 'fake success' state from an old version. Clear status to force re-login.
          if (isNative && get().portalStatus === 'connected' && !get().culkoCookies) {
            console.warn('[usePortalStore] Native app connected but missing persistent cookies. Forcing re-login.')
            set({ portalStatus: 'no_session', isSyncing: false })
            return false
          }

          // Verify connection if not already explicitly trusted
          const currentStatus = get().portalStatus
          if (currentStatus !== 'connected') {
            const connected = await get().checkStatus()
            if (!connected) {
              console.log('[usePortalStore] Not connected to portal. Sync aborted.')
              set({ isSyncing: false })
              return false
            }
          }

          const headers: Record<string, string> = {
            'x-culko-session': get().culkoCookies ? JSON.stringify(get().culkoCookies) : ''
          }
          
          if (isNative) {
             const supabase = createClient()
             const sessionData = await supabase.auth.getSession()
             if (sessionData.data.session?.access_token) {
               headers['Authorization'] = `Bearer ${sessionData.data.session.access_token}`
             }
             console.log('[usePortalStore] Sending request with x-culko-session header. Cookie length:', headers['x-culko-session']?.length)
          }

          // Delete stale Supabase cache so the scraper always fetches fresh portal data
          // (without this, old wrong data persists even after code fixes)
          try {
            await fetch(getApiUrl('/api/culko?endpoint=delete-cache'), { headers })
            console.log('[usePortalStore] Cleared stale attendance cache')
          } catch (e) {
            console.log('[usePortalStore] Cache clear failed (non-fatal):', e)
          }

          const [attendRes, ttRes, profileRes, hostelRes, marksRes, detailsRes] = await Promise.all([
            fetch(getApiUrl('/api/culko?endpoint=attendance'), { headers }),
            fetch(getApiUrl('/api/culko?endpoint=timetable'), { headers }),
            fetch(getApiUrl('/api/culko?endpoint=profile'), { headers }),
            fetch(getApiUrl('/api/culko?endpoint=hostel'), { headers }),
            fetch(getApiUrl('/api/culko?endpoint=marks'), { headers }),
            fetch(getApiUrl('/api/culko?endpoint=attendance-details-all'), { headers }),
          ])

          // 401 on data endpoints = session truly died
          if (attendRes.status === 401 || profileRes.status === 401) {
            console.error('[usePortalStore] Session expired (401 from server).')
            set({ portalStatus: 'no_session', isSyncing: false })
            return false
          }

          const [attendance, timetable, profile, hostel, marks, details] = await Promise.all([
            attendRes.json(),
            ttRes.json(),
            profileRes.json(),
            hostelRes.json(),
            marksRes.json(),
            detailsRes.json()
          ])

          const updates: Partial<PortalState> = {
            lastSync: new Date().toISOString(),
            isSyncing: false,
            portalStatus: 'connected'
          }

          let newNotifications = [...get().notifications]
          
          if (attendRes.ok && attendance.success) {
            updates.attendance = attendance.data || []
            // Diff Attendance
            const oldAtt = get().attendance
            if (oldAtt.length > 0 && updates.attendance.length > 0) {
              updates.attendance.forEach((newSubj: any) => {
                const oldSubj = oldAtt.find((s: any) => s.subject === newSubj.subject)
                if (oldSubj && parseFloat(newSubj.percentage) < parseFloat(oldSubj.percentage)) {
                  newNotifications.push({
                    id: Math.random().toString(36).substring(7),
                    type: 'attendance',
                    message: `Attendance dropped for ${newSubj.subject} (${newSubj.percentage}%)`,
                    read: false,
                    timestamp: new Date().toISOString()
                  })
                }
              })
            }
          }
          
          if (ttRes.ok && timetable.success) updates.timetable = timetable.data
          if (profileRes.ok && profile.success) updates.profile = profile.data
          if (hostelRes.ok && hostel.success) updates.hostel = hostel.data
          
          if (marksRes.ok && marks.success) {
            updates.marks = marks.data || []
            // Diff Marks
            const oldMarks = get().marks
            if (oldMarks.length > 0 && updates.marks.length > 0) {
              updates.marks.forEach((newMark: any) => {
                const oldMark = oldMarks.find((m: any) => m.subject === newMark.subject && m.type === newMark.type)
                if (!oldMark || parseFloat(newMark.score) !== parseFloat(oldMark.score)) {
                  newNotifications.push({
                    id: Math.random().toString(36).substring(7),
                    type: 'marks',
                    message: `New/Updated marks for ${newMark.subject} ${newMark.type}: ${newMark.score}`,
                    read: false,
                    timestamp: new Date().toISOString()
                  })
                }
              })
            }
          }
          
          if (detailsRes.ok && details.success) updates.attendanceDetails = details.data || {}

          if (newNotifications.length > get().notifications.length) {
            updates.notifications = newNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20)
          }

          console.log('[usePortalStore] Sync completed.', { 
            attendance: !!attendance.data, 
            marks: !!marks.data,
            profile: !!profile.data 
          })

          set(updates)

          // Detailed attendance is now fetched in the Promise.all array above so it's ready instantly!

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
        attendanceDetails: state.attendanceDetails,
        timetable: state.timetable,
        marks: state.marks,
        profile: state.profile,
        hostel: state.hostel,
        lastSync: state.lastSync,
        portalStatus: state.portalStatus,
        culkoCookies: state.culkoCookies,
        notifications: state.notifications
      })
    }
  )
)
