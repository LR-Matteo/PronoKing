-- ============================================
-- PRONOKING - Schema Supabase
-- ============================================
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- ==================== OPTION A : MIGRATION (recommandé) ====================
-- Si les tables existent déjà et que vous voulez juste ajouter les nouvelles colonnes
-- sans perdre les données existantes, exécutez uniquement ce bloc :
--
-- ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT NULL;
-- ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;
-- ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS token_mode TEXT DEFAULT 'per_match';
-- ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS token_bank INTEGER DEFAULT NULL;
-- ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS max_tokens_per_match INTEGER DEFAULT NULL;
--
-- ==================== OPTION B : RESET COMPLET ====================
-- ⚠️  Supprime TOUTES les données. À n'utiliser que sur une base vierge ou en dev.

DROP TABLE IF EXISTS bets CASCADE;
DROP TABLE IF EXISTS market_options CASCADE;
DROP TABLE IF EXISTS markets CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS tournament_members CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ==================== TABLES ====================

-- Profils utilisateurs
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tournois
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT false,
  password TEXT,
  tokens_per_match INTEGER DEFAULT 10,
  token_mode TEXT DEFAULT 'per_match',
  token_bank INTEGER DEFAULT NULL,
  max_tokens_per_match INTEGER DEFAULT NULL,
  max_members INTEGER DEFAULT NULL,
  is_locked BOOLEAN DEFAULT false,
  admin_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Membres d'un tournoi
CREATE TABLE tournament_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

-- Matchs
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  kickoff TIMESTAMPTZ NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  is_finished BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Marchés de paris (1N2, score exact, buteur, etc.)
CREATE TABLE markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Options d'un marché avec cotes
CREATE TABLE market_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  odds NUMERIC(5,2) NOT NULL DEFAULT 2.0,
  is_winner BOOLEAN DEFAULT false
);

-- Paris des joueurs
CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  market_option_id UUID REFERENCES market_options(id) ON DELETE CASCADE,
  tokens INTEGER NOT NULL,
  points_won NUMERIC(7,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== INDEX ====================

CREATE INDEX idx_tournament_members_tournament ON tournament_members(tournament_id);
CREATE INDEX idx_tournament_members_user ON tournament_members(user_id);
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_markets_match ON markets(match_id);
CREATE INDEX idx_market_options_market ON market_options(market_id);
CREATE INDEX idx_bets_match ON bets(match_id);
CREATE INDEX idx_bets_user ON bets(user_id);

-- ==================== ROW LEVEL SECURITY ====================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

-- Policies permissives pour le développement
-- ⚠️  À RESTREINDRE en production !

CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public insert profiles" ON profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Public insert tournaments" ON tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update tournaments" ON tournaments FOR UPDATE USING (true);
CREATE POLICY "Public delete tournaments" ON tournaments FOR DELETE USING (true);

CREATE POLICY "Public read tournament_members" ON tournament_members FOR SELECT USING (true);
CREATE POLICY "Public insert tournament_members" ON tournament_members FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Public insert matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update matches" ON matches FOR UPDATE USING (true);

CREATE POLICY "Public read markets" ON markets FOR SELECT USING (true);
CREATE POLICY "Public insert markets" ON markets FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read market_options" ON market_options FOR SELECT USING (true);
CREATE POLICY "Public insert market_options" ON market_options FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update market_options" ON market_options FOR UPDATE USING (true);

CREATE POLICY "Public read bets" ON bets FOR SELECT USING (true);
CREATE POLICY "Public insert bets" ON bets FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update bets" ON bets FOR UPDATE USING (true);
CREATE POLICY "Public delete bets" ON bets FOR DELETE USING (true);
