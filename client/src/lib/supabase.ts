import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Returns true if both Supabase URL and Anon Key are configured.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    supabaseAnonKey.length > 10
  );
};

let supabaseInstance: SupabaseClient | null = null;

/**
 * Singleton client getter for Supabase in client-side Next.js components.
 */
export const getSupabase = (): SupabaseClient | null => {
  if (typeof window === 'undefined') {
    if (isSupabaseConfigured()) {
      return createClient(supabaseUrl, supabaseAnonKey);
    }
    return null;
  }

  if (!supabaseInstance && isSupabaseConfigured()) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch (err) {
      console.warn('[MUDRA SUPABASE] Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
};
