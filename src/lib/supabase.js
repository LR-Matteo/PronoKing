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

// Fetch avec timeout de 10s pour éviter les blocages infinis sur mobile
function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

// Only create the Supabase client if we have valid credentials
export const supabase = DEMO_MODE
  ? null
  : createClient(supabaseUrl, supabaseAnonKey, {
      global: { fetch: fetchWithTimeout },
    });
