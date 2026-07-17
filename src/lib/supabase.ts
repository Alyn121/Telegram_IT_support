import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// For client-side usage and normal server-side operations
export const createClient = () => createSupabaseClient(supabaseUrl, supabaseAnonKey)

// For server-side usage requiring admin privileges (e.g. bypassing RLS if added later)
export const createAdminClient = () => createSupabaseClient(supabaseUrl, supabaseServiceKey)
