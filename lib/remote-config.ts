import { createClient } from '@/lib/supabase/client'
import { ACADEMIC_CALENDAR_2026, MESS_MENU } from './constants'

export interface AppConfig {
  academicCalendar: typeof ACADEMIC_CALENDAR_2026
  messMenu: typeof MESS_MENU
}

const STORAGE_KEY = 'campus_buddy_remote_config'

export async function fetchRemoteConfig(): Promise<AppConfig> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('config')
      .eq('key', 'global_v1')
      .maybeSingle()

    if (error || !data) {
      console.warn('[RemoteConfig] Failing back to local constants:', error)
      return { academicCalendar: ACADEMIC_CALENDAR_2026, messMenu: MESS_MENU }
    }

    const remote = data.config
    return {
      academicCalendar: remote.academicCalendar || ACADEMIC_CALENDAR_2026,
      messMenu: remote.messMenu || MESS_MENU
    }
  } catch (err) {
    return { academicCalendar: ACADEMIC_CALENDAR_2026, messMenu: MESS_MENU }
  }
}

export function getLocalConfig(): AppConfig {
  if (typeof window === 'undefined') return { academicCalendar: ACADEMIC_CALENDAR_2026, messMenu: MESS_MENU }
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return { academicCalendar: ACADEMIC_CALENDAR_2026, messMenu: MESS_MENU }
    }
  }
  return { academicCalendar: ACADEMIC_CALENDAR_2026, messMenu: MESS_MENU }
}
