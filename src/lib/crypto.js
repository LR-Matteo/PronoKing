/**
 * Hachage sécurisé des mots de passe via Web Crypto API (PBKDF2 + SHA-256).
 * Zéro dépendance externe, natif dans tous les navigateurs modernes.
 */

const ITERATIONS = 150000;
const ALGO = { name: 'PBKDF2', hash: 'SHA-256', iterations: ITERATIONS };

function toB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromB64(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  return crypto.subtle.deriveBits({ ...ALGO, salt }, keyMaterial, 256);
}

/**
 * Hash un mot de passe. Retourne une chaîne de la forme :
 * "pbkdf2:<saltBase64>:<hashBase64>"
 */
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await deriveKey(password, salt);
  return `pbkdf2:${toB64(salt)}:${toB64(bits)}`;
}

/**
 * Vérifie un mot de passe contre un hash stocké.
 * Compatible avec les anciens comptes en clair (fallback).
 */
export async function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith('pbkdf2:')) {
    // Fallback : ancien compte en clair (demo ou avant migration)
    return password === stored;
  }
  const [, saltB64, hashB64] = stored.split(':');
  const salt = fromB64(saltB64);
  const bits = await deriveKey(password, salt);
  return toB64(bits) === hashB64;
}

/**
 * Génère un code temporaire lisible de 8 caractères (sans caractères ambigus).
 */
export function generateTempPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}
