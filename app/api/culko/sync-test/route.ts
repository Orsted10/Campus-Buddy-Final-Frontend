import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Visit /api/culko/sync-test to see exactly what happens when we try to save
export async function GET() {
  const results: any = {}

  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    results.auth = {
      hasUser: !!user,
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
      error: userError?.message ?? null
    }

    if (!user) {
      return NextResponse.json({ success: false, reason: 'Not logged in to app', results })
    }

    // Test INSERT
    const testPayload = { _test: true, timestamp: new Date().toISOString() }
    const { error: insertError } = await supabase
      .from('portal_records')
      .upsert({
        user_id: user.id,
        type: 'profile',
        data: testPayload,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,type' })

    results.insert = {
      success: !insertError,
      error: insertError?.message ?? null,
      code: insertError?.code ?? null
    }

    // Test SELECT
    const { data: rows, error: selectError } = await supabase
      .from('portal_records')
      .select('type, updated_at')
      .eq('user_id', user.id)

    results.select = {
      success: !selectError,
      rows: rows ?? [],
      error: selectError?.message ?? null
    }

    return NextResponse.json({ success: !insertError, results })
  } catch (err: any) {
    results.exception = err?.message
    return NextResponse.json({ success: false, results }, { status: 500 })
  }
}
