/**
 * Convertit un ou plusieurs fichiers CSV d'équipes en un seul teams.json
 *
 * Format CSV attendu (séparateur ; avec guillemets) :
 *   "team";"images"
 *   "Chelsea";"https://..."
 *
 * Usage :
 *   node scripts/convert-teams.js src/data/clubs.csv
 *   node scripts/convert-teams.js src/data/clubs.csv src/data/nations.csv
 */

import fs from 'fs';
import path from 'path';

const inputs = process.argv.slice(2);
if (!inputs.length) {
  console.error('Usage: node scripts/convert-teams.js <fichier1.csv> [fichier2.csv ...]');
  process.exit(1);
}

// Charger les équipes existantes depuis teams.json
const outPath = path.resolve('src/data/teams.json');
let teams = [];
if (fs.existsSync(outPath)) {
  try {
    teams = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    console.log(`  📂 ${teams.length} équipes existantes chargées depuis teams.json`);
  } catch {
    teams = [];
  }
}

for (const filePath of inputs) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    console.error(`Fichier introuvable : ${abs}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(abs, 'utf8');
  const lines = raw.trim().split(/\r?\n/);

  // Déterminer les indices des colonnes depuis l'en-tête
  const header = lines[0].split(';').map((h) => h.replace(/"/g, '').trim().toLowerCase());
  const nameIdx = header.indexOf('team');
  const logoIdx = header.indexOf('images');

  if (nameIdx === -1 || logoIdx === -1) {
    console.error(`Colonnes "team" et "images" introuvables dans ${filePath}`);
    process.exit(1);
  }

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const values = line.split(';').map((v) => v.replace(/"/g, '').trim());
    const name = values[nameIdx];
    const logo = values[logoIdx];
    if (name && logo) teams.push({ name, logo });
  }

  console.log(`  ✓ ${filePath} — ${lines.length - 1} équipes`);
}

// Dédoublonner par nom (insensible à la casse)
const seen = new Set();
const unique = teams.filter((t) => {
  const key = t.name.toLowerCase();
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
}).sort((a, b) => a.name.localeCompare(b.name));

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(unique, null, 2), 'utf8');

console.log(`\n✅ ${unique.length} équipes uniques → src/data/teams.json`);
