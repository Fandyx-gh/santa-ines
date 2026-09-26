import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/discovery';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function getScopedSupabaseClient(
  headers: Record<string, string>,
): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured) {
    return null;
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers },
  });
}
