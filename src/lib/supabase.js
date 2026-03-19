import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export const DEMO_MODE = !isValidUrl(supabaseUrl) || !supabaseAnonKey;

// Client Supabase standard — pas de fetch personnalisé qui pourrait interférer
// Les timeouts sont gérés au niveau des pages via Promise.race
export const supabase = DEMO_MODE
  ? null
  : createClient(supabaseUrl, supabaseAnonKey);
