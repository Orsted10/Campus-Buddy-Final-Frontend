import { createClient } from '@/lib/supabase/server'

export type PortalDataType = 'profile' | 'attendance' | 'marks' | 'timetable'

export async function savePortalData(type: PortalDataType, data: any) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { success: false, error: 'Not authenticated' }

    const { error } = await supabase
      .from('portal_records')
      .upsert({
        user_id: user.id,
        type,
        data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,type'
      })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error(`Error saving ${type} to DB:`, error)
    return { success: false, error }
  }
}

export async function getPortalData(type: PortalDataType) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('portal_records')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', type)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return { success: false, error: 'No cached data found', isCached: false }
      }
      throw error
    }

    return { 
      success: true, 
      data: data.data, 
      updatedAt: data.updated_at,
      isCached: true 
    }
  } catch (error) {
    console.error(`Error fetching ${type} from DB:`, error)
    return { success: false, error }
  }
}
