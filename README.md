# PronoKing — Le roi des pronostics ⚽👑

Application de pronostics football avec système de jetons et cotes personnalisables.

## Fonctionnalités

- **Authentification** — Inscription/connexion avec pseudo + mot de passe
- **Tournois** — Création de tournois publics ou privés (mot de passe)
- **Multi-tournois** — Participer à plusieurs tournois simultanément
- **Marchés de paris** — 1N2, score exact, mi-temps, buteur, total de buts, personnalisé
- **Cotes personnalisables** — L'admin définit les cotes de chaque option
- **Système de jetons** — Budget de jetons par match, répartition libre
- **Calcul automatique** — Points = jetons × cote à la validation
- **Classement** — Leaderboard temps réel par tournoi
- **Profil joueur** — Détail de tous les paris et points par match

## Stack technique

- **Frontend** — React 18 + Vite + React Router
- **Backend** — Supabase (PostgreSQL + API REST)
- **Styling** — CSS custom (dark theme, ambiance football premium)
- **Animations** — Framer Motion
- **Icons** — Lucide React

## Installation

```bash
# 1. Cloner le projet
git clone <repo-url>
cd pronoking

# 2. Installer les dépendances
npm install

# 3. Configurer Supabase (voir ci-dessous)
cp .env.example .env
# Éditez .env avec vos identifiants Supabase

# 4. Lancer en développement
npm run dev
```

## Configuration Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Allez dans **SQL Editor** et exécutez le contenu de `supabase/schema.sql`
3. Allez dans **Settings > API** et copiez :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
4. Collez dans votre fichier `.env`

## Mode démo

Sans configuration Supabase, l'app fonctionne en **mode démo** avec des données en mémoire (3 joueurs, 1 tournoi, 3 matchs). Parfait pour tester l'interface.

Comptes de démonstration :
- `admin` / `admin123` (admin du tournoi Euro 2026)
- `marco` / `pass123`
- `lucas` / `pass123`

## Architecture du projet

```
src/
├── components/
│   ├── betting/          # BettingPanel, AddMarketModal, ValidateMatchModal
│   ├── layout/           # Navbar
│   ├── matches/          # MatchCard, AddMatchModal
│   ├── players/          # Leaderboard
│   ├── tournaments/      # TournamentCard, CreateTournamentModal, JoinModal
│   └── ui/               # Button, Badge, Modal, Input, TokenCoin...
├── contexts/
│   └── AuthContext.jsx    # Authentification globale
├── hooks/
│   ├── useMatchData.js    # Chargement données match
│   └── useTournamentData.js # Chargement données tournoi
├── lib/
│   ├── constants.js       # Types de marchés, presets
│   ├── db.js              # Couche d'abstraction base de données
│   ├── demoData.js        # Données démo + query builder in-memory
│   ├── supabase.js        # Client Supabase
│   └── utils.js           # Helpers (dates, classNames)
├── pages/
│   ├── LoginPage.jsx
│   ├── MatchPage.jsx
│   ├── PlayerPage.jsx
│   ├── TournamentPage.jsx
│   └── TournamentsPage.jsx
├── styles/
│   └── global.css
├── App.jsx                # Routes
└── main.jsx               # Entry point
```

## Build production

```bash
npm run build
npm run preview
```

Le dossier `dist/` peut être déployé sur Vercel, Netlify, ou tout hébergeur statique.
