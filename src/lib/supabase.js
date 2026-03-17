import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if we have valid Supabase credentials
function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export const DEMO_MODE = !isValidUrl(supabaseUrl) || !supabaseAnonKey;

// Only create the Supabase client if we have valid credentials
export const supabase = DEMO_MODE ? null : createClient(supabaseUrl, supabaseAnonKey);
