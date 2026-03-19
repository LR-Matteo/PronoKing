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

// Timeout sur toutes les requêtes pour éviter les hangs silencieux.
// 30s pour auth (token refresh peut être lent), 15s pour le reste.
function fetchWithTimeout(url, options = {}) {
  const isAuth = typeof url === 'string' && url.includes('/auth/');
  const ms = isAuth ? 30000 : 15000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

export const supabase = DEMO_MODE
  ? null
  : createClient(supabaseUrl, supabaseAnonKey, {
      global: { fetch: fetchWithTimeout },
    });
