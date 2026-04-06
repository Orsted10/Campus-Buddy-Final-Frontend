import { createClient } from '@supabase/supabase-js'

// IMPORTANT: This client uses the SERVICE_ROLE_KEY and can BYPASS RLS.
// It should ONLY be used in server-side routes (/api) for administrative Tasks.
// NEVER expose this client or the key to the frontend.
export const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Note: This must be in your .env
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
