import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`[DeleteAccount] Triggering database-level cleanup for: ${user.id}`)

    // Use RPC to call the security-definer function we created in SQL
    // This bypasses RLS and handles all tables at once
    const { error: rpcError } = await supabase.rpc('delete_user_data')

    if (rpcError) {
      console.error('[DeleteAccount] RPC Error:', rpcError.message)
      throw rpcError
    }

    // Sign out the user session
    await supabase.auth.signOut()

    return NextResponse.json({ success: true, message: 'Account and data wiped successfully' })
  } catch (error) {
    console.error('[DeleteAccount] Critical Error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete account. Ensure the delete_user_data SQL function is installed.' 
    }, { status: 500 })
  }
}
