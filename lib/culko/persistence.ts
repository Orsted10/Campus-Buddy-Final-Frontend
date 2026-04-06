import { createClient } from '@/lib/supabase/server'

export type PortalDataType = 'profile' | 'attendance' | 'marks' | 'timetable' | 'announcements'

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

export async function saveAnnouncementsAsNotifications(announcements: any[]) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { success: false, error: 'Not authenticated' }

    console.log(`[saveAnnouncements] Processing ${announcements.length} announcements for user ${user.id}...`)

    // 1. Get existing university notifications to avoid duplicates
    const { data: existing } = await supabase
      .from('notifications')
      .select('title, created_at')
      .eq('user_id', user.id)
      .eq('type', 'general')
      .order('created_at', { ascending: false })

    const existingTitles = new Set(existing?.map(n => n.title) || [])

    // 2. Insert new announcements (limited to newest 5)
    // We reverse so the newest ones are at the end, but we only take top 5 anyway
    const toInsert = announcements
      .filter(a => !existingTitles.has(`[Portal] ${a.title}`))
      .slice(0, 5)
      .map(a => ({
        user_id: user.id,
        title: `[Portal] ${a.title}`,
        message: `${a.description}\n\nDate: ${a.date}`,
        type: 'general',
        link: a.link || null,
        created_at: new Date().toISOString()
      }))

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(toInsert)
      
      if (insertError) throw insertError
      console.log(`[saveAnnouncements] Inserted ${toInsert.length} new notifications.`)
    }

    // 3. Rotation logic: Keep only the latest 5 university announcements
    // Fetch all university announcements again after insert
    const { data: allPortalNotifs } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'general')
      .like('title', '[Portal]%')
      .order('created_at', { ascending: false })

    if (allPortalNotifs && allPortalNotifs.length > 5) {
      const idsToDelete = allPortalNotifs.slice(5).map(n => n.id)
      await supabase
        .from('notifications')
        .delete()
        .in('id', idsToDelete)
      console.log(`[saveAnnouncements] Deleted ${idsToDelete.length} old notifications to maintain top 5.`)
    }

    return { success: true }
  } catch (error) {
    console.error('[saveAnnouncements] Error:', error)
    return { success: false, error }
  }
}
