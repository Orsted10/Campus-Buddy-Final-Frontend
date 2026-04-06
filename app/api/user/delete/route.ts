import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`[DeleteAccount] Initializing cleanup for user: ${user.id}`)

    // 1. Handle Messages (Nested Deletion)
    // We need to find all chats belonging to the user first
    const { data: userChats } = await supabase
      .from('chats')
      .select('id')
      .eq('user_id', user.id)

    if (userChats && userChats.length > 0) {
      const chatIds = userChats.map(c => c.id)
      const { error: msgErr } = await supabase
        .from('messages')
        .delete()
        .in('chat_id', chatIds)
      
      if (msgErr) console.warn('[DeleteAccount] Error deleting messages:', msgErr.message)
    }

    // 2. Standard user_id tables
    const standardTables = [
      'portal_records',
      'notifications',
      'hostel_requests',
      'laundry_bookings',
      'book_reservations',
      'assignments',
      'chats' // Already cleared messages, now clear chats
    ]

    for (const table of standardTables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('user_id', user.id)
      
      if (error) {
        console.warn(`[DeleteAccount] Error deleting from ${table}:`, error.message)
      }
    }

    // 3. Special column tables
    // Visitor passes use 'student_id'
    const { error: vpError } = await supabase
      .from('visitor_passes')
      .delete()
      .eq('student_id', user.id)
    if (vpError) console.warn('[DeleteAccount] Error deleting visitor_passes:', vpError.message)

    // 4. Delete the profile itself (Uses 'id')
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (profileError) throw profileError

    // 5. Final Step: Sign out
    await supabase.auth.signOut()

    return NextResponse.json({ success: true, message: 'Account and data wiped successfully' })
  } catch (error) {
    console.error('[DeleteAccount] Critical Error:', error)
    return NextResponse.json({ error: 'Failed to delete account completely' }, { status: 500 })
  }
}
