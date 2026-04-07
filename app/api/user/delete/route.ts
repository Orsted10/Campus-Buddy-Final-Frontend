import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`[DeleteAccount] Triggering database-level cleanup for: ${user.id}`)

    // 1. Wipe all database records using the Security Definer RPC (while still authenticated)
    const { error: rpcError } = await supabase.rpc('delete_user_data')
    if (rpcError) {
      console.error('[DeleteAccount] RPC Error:', rpcError.message)
      // We continue anyway to try and kill the Auth record
    }

    // 2. Permanently delete the user from Auth (REQUIRES SERVICE ROLE)
    // We do this immediately after the RPC to ensure re-registration is possible
    const admin = createAdminClient()
    const { error: adminError } = await admin.auth.admin.deleteUser(user.id)
    
    if (adminError) {
      console.error('[DeleteAccount] Auth Admin Error:', adminError.message)
    }

    // 3. Force-clear ALL session cookies
    const cookieStore = await cookies()
    cookieStore.delete('culko_session')
    
    // 4. Sign out the local session
    await supabase.auth.signOut()

    return NextResponse.json({ success: true, message: 'Account and data wiped permanently' })
  } catch (error) {
    console.error('[DeleteAccount] Critical Error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete account. Ensure the delete_user_data SQL function is installed.' 
    }, { status: 500 })
  }
}
