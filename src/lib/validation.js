// Retourne null si valide, sinon un message d'erreur

export function validateEmail(email) {
  if (!email || !email.trim()) return 'L\'adresse email est requise';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Adresse email invalide';
  return null;
}

export function validateUsername(username) {
  const v = username?.trim() ?? '';
  if (!v) return 'Le pseudo est requis';
  if (v.length < 3) return 'Le pseudo doit faire au moins 3 caractères';
  if (v.length > 20) return 'Le pseudo ne peut pas dépasser 20 caractères';
  if (!/^[a-zA-Z0-9_À-ÿ]+$/.test(v)) return 'Le pseudo ne peut contenir que des lettres, chiffres et underscores';
  return null;
}

export function validatePassword(password, isRegister = false) {
  if (!password || !password.trim()) return 'Le mot de passe est requis';
  if (isRegister && password.length < 6) return 'Le mot de passe doit faire au moins 6 caractères';
  return null;
}

export function validateTeamName(name) {
  const v = name?.trim() ?? '';
  if (!v) return 'Le nom de l\'équipe est requis';
  if (v.length > 50) return 'Le nom de l\'équipe ne peut pas dépasser 50 caractères';
  return null;
}

export function validateOdds(value) {
  const n = parseFloat(value);
  if (isNaN(n)) return 'La cote doit être un nombre';
  if (n < 1.01) return 'La cote doit être au moins 1.01';
  if (n > 100) return 'La cote ne peut pas dépasser 100';
  return null;
}

export function validateScore(value) {
  const n = parseInt(value, 10);
  if (isNaN(n) || n < 0) return 'Le score doit être un entier positif ou zéro';
  return null;
}

export function validateTournamentName(name) {
  const v = name?.trim() ?? '';
  if (!v) return 'Le nom du tournoi est requis';
  if (v.length < 3) return 'Le nom doit faire au moins 3 caractères';
  if (v.length > 100) return 'Le nom ne peut pas dépasser 100 caractères';
  return null;
}

export function validateDescription(desc) {
  if (desc && desc.length > 500) return 'La description ne peut pas dépasser 500 caractères';
  return null;
}

export function validateMarketLabel(label) {
  const v = label?.trim() ?? '';
  if (!v) return 'L\'intitulé du marché est requis';
  if (v.length > 100) return 'L\'intitulé ne peut pas dépasser 100 caractères';
  return null;
}

export function validateOptionLabel(label) {
  const v = label?.trim() ?? '';
  if (!v) return 'Le label de l\'option est requis';
  if (v.length > 100) return 'Le label ne peut pas dépasser 100 caractères';
  return null;
}

export function validateTokenCount(value, min = 1, max = null) {
  const n = parseInt(value, 10);
  if (isNaN(n) || n !== parseFloat(value)) return 'La valeur doit être un entier';
  if (n < min) return `La valeur doit être au moins ${min}`;
  if (max !== null && n > max) return `La valeur ne peut pas dépasser ${max}`;
  return null;
}
