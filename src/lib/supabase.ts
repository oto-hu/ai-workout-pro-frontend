import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

export function createClient() {
  // 開発環境用：Supabase設定がない場合はダミークライアントを返す
  if (!supabaseUrl || supabaseUrl === 'https://dummy.supabase.co') {
    return {
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: [], error: null }),
        update: () => ({ data: [], error: null }),
        delete: () => ({ data: [], error: null })
      })
    } as any;
  }
  
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = createClient()
