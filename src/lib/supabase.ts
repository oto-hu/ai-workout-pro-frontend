import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getFirebaseIdToken } from './auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

// Enhanced client that sets Firebase token for RLS
export async function createClientWithAuth() {
  const client = createSupabaseClient(supabaseUrl, supabaseAnonKey)
  
  try {
    const firebaseToken = await getFirebaseIdToken()
    if (firebaseToken) {
      // Set Firebase token as Supabase auth token for RLS
      // This requires proper RLS policies that verify Firebase tokens
      await client.auth.setSession({
        access_token: firebaseToken,
        refresh_token: firebaseToken,
      })
    }
  } catch (error) {
    console.error('Error setting Firebase token in Supabase:', error)
  }
  
  return client
}

export const supabase = createClient()