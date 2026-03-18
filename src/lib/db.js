import { supabase, DEMO_MODE } from './supabase';
import { demoDb } from './demoData';

/**
 * Database abstraction layer.
 * Uses Supabase in production, in-memory store in demo mode.
 */
const db = DEMO_MODE ? demoDb : supabase;

export default db;

// ==================== QUERY HELPERS ====================

export async function fetchTournaments() {
  const { data, error } = await db.from('tournaments').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchTournament(id) {
  const { data, error } = await db.from('tournaments').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function updateTournament(id, updates) {
  const { data, error } = await db.from('tournaments').update(updates).eq('id', id);
  if (error) throw error;
  return data;
}

export async function deleteTournament(id) {
  const { data, error } = await db.from('tournaments').delete().eq('id', id);
  if (error) throw error;
  return data;
}

export async function createTournament(tournament) {
  const { data, error } = await db.from('tournaments').insert(tournament).select().single();
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function fetchTournamentMembers(tournamentId) {
  const { data, error } = await db.from('tournament_members').select('*').eq('tournament_id', tournamentId);
  if (error) throw error;
  return data || [];
}

export async function fetchAllMembers() {
  const { data, error } = await db.from('tournament_members').select('*');
  if (error) throw error;
  return data || [];
}

export async function joinTournament(tournamentId, userId) {
  const { data, error } = await db.from('tournament_members').insert({ tournament_id: tournamentId, user_id: userId });
  if (error) throw error;
  return data;
}

export async function fetchMatches(tournamentId) {
  const { data, error } = await db.from('matches').select('*').eq('tournament_id', tournamentId).order('kickoff', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function fetchMatch(id) {
  const { data, error } = await db.from('matches').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createMatch(match) {
  const { data, error } = await db.from('matches').insert(match).select().single();
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function updateMatch(id, updates) {
  const { data, error } = await db.from('matches').update(updates).eq('id', id);
  if (error) throw error;
  return data;
}

export async function fetchMarkets(matchId) {
  const { data, error } = await db.from('markets').select('*').eq('match_id', matchId);
  if (error) throw error;
  return data || [];
}

export async function fetchMarketsByMatches(matchIds) {
  if (!matchIds || matchIds.length === 0) return [];
  const { data, error } = await db.from('markets').select('*').in('match_id', matchIds);
  if (error) throw error;
  return data || [];
}

export async function createMarket(market) {
  const { data, error } = await db.from('markets').insert(market).select().single();
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function fetchMarketOptions(marketId) {
  const { data, error } = await db.from('market_options').select('*').eq('market_id', marketId);
  if (error) throw error;
  return data || [];
}

export async function fetchMarketOptionsByMarkets(marketIds) {
  if (!marketIds || marketIds.length === 0) return [];
  const { data, error } = await db.from('market_options').select('*').in('market_id', marketIds);
  if (error) throw error;
  return data || [];
}

export async function createMarketOption(option) {
  const { data, error } = await db.from('market_options').insert(option);
  if (error) throw error;
  return data;
}

export async function updateMarketOption(id, updates) {
  const { data, error } = await db.from('market_options').update(updates).eq('id', id);
  if (error) throw error;
  return data;
}

export async function fetchBets(matchId) {
  const { data, error } = await db.from('bets').select('*').eq('match_id', matchId);
  if (error) throw error;
  return data || [];
}

export async function fetchBetsByMatches(matchIds) {
  if (!matchIds || matchIds.length === 0) return [];
  const { data, error } = await db.from('bets').select('*').in('match_id', matchIds);
  if (error) throw error;
  return data || [];
}

export async function fetchUserBets(matchId, userId) {
  const { data, error } = await db.from('bets').select('*').eq('match_id', matchId).eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

export async function fetchBetsByUser(userId, matchIds) {
  if (!matchIds || matchIds.length === 0) return [];
  const { data, error } = await db.from('bets').select('*').eq('user_id', userId).in('match_id', matchIds);
  if (error) throw error;
  return data || [];
}

export async function createBet(bet) {
  const { data, error } = await db.from('bets').insert(bet);
  if (error) throw error;
  return data;
}

export async function updateBet(id, updates) {
  const { data, error } = await db.from('bets').update(updates).eq('id', id);
  if (error) throw error;
  return data;
}

export async function deleteBet(id) {
  const { data, error } = await db.from('bets').delete().eq('id', id);
  if (error) throw error;
  return data;
}

export async function fetchProfiles() {
  const { data, error } = await db.from('profiles').select('*');
  if (error) throw error;
  return data || [];
}

export async function fetchProfile(id) {
  const { data, error } = await db.from('profiles').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function findProfileByUsername(username) {
  const { data, error } = await db.from('profiles').select('*').eq('username', username).limit(1);
  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

export async function updateProfile(id, updates) {
  const { data, error } = await db.from('profiles').update(updates).eq('id', id);
  if (error) throw error;
  return data;
}

export async function createProfile(profile) {
  const { data, error } = await db.from('profiles').insert(profile).select().single();
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function loginProfile(username) {
  // Récupère uniquement par username — la vérification du mot de passe se fait côté JS
  return findProfileByUsername(username);
}
