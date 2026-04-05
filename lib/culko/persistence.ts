import { createClient } from '@/lib/supabase/server'

export type PortalDataType = 'profile' | 'attendance' | 'marks' | 'timetable'

export async function savePortalData(type: PortalDataType, data: any) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.warn(`[savePortalData] No user found, skipping sync for ${type}`)
      return { success: false, error: 'Not authenticated' }
    }

    console.log(`[savePortalData] Syncing ${type} for user ${user.id}...`)

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

    if (error) {
      console.error(`[savePortalData] Supabase error for ${type}:`, error.message)
      throw error
    }
    
    console.log(`[savePortalData] Successfully synced ${type} to Supabase.`)
    return { success: true }
  } catch (error) {
    console.error(`[savePortalData] Critical Error for ${type}:`, error)
    return { success: false, error }
  }
}

export async function getPortalData(type: PortalDataType) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.warn(`[getPortalData] No user found, skipping fetch for ${type}`)
      return { success: false, error: 'Not authenticated' }
    }

    console.log(`[getPortalData] Fetching cached ${type} for user ${user.id}...`)

    const { data, error } = await supabase
      .from('portal_records')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', type)
      .maybeSingle() // Safer than single() which errors on no-rows

    if (error) {
      console.error(`[getPortalData] Supabase error for ${type}:`, error.message)
      throw error
    }

    if (!data) {
      console.log(`[getPortalData] No cached records found for ${type}.`)
      return { success: false, error: 'No cached data found', isCached: false }
    }

    console.log(`[getPortalData] Found cached ${type} (Last Updated: ${data.updated_at})`)
    return { 
      success: true, 
      data: data.data, 
      updatedAt: data.updated_at,
      isCached: true 
    }
  } catch (error) {
    console.error(`[getPortalData] Critical Error for ${type}:`, error)
    return { success: false, error }
  }
}
