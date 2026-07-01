import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  
  // 1. Sign out from Supabase (Clears its cookies)
  await supabase.auth.signOut()
  
  // 2. Explicitly clear the portal session cookie
  cookieStore.delete('culko_session')
  
  return NextResponse.json({ success: true, message: 'Logged out from all systems' })
}
