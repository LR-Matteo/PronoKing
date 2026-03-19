import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchTournament,
  fetchMatches,
  fetchTournamentMembers,
  fetchProfilesByIds,
  fetchMarketsByMatches,
  fetchMarketOptionsByMarkets,
  fetchBetsByMatches,
} from '@/lib/db';
import { supabase, DEMO_MODE } from '@/lib/supabase';

export function useTournamentData(tournamentId) {
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [members, setMembers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [marketOptions, setMarketOptions] = useState([]);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const matchIdsRef = useRef([]);
  const marketIdsRef = useRef([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      // Round 1 — tout en parallèle
      // En prod : une seule requête pour matches+markets+options grâce au nested select
      // En demo : fallback sur les fonctions classiques
      let matchesPromise;
      if (DEMO_MODE) {
        matchesPromise = fetchMatches(tournamentId).then((m) => ({ matches: m, markets: [], options: [] }));
      } else {
        matchesPromise = supabase
          .from('matches')
          .select('*, markets(*, market_options(*))')
          .eq('tournament_id', tournamentId)
          .order('kickoff', { ascending: true })
          .then(({ data, error }) => {
            if (error) throw error;
            const rows = data || [];
            const markets = rows.flatMap((x) => x.markets || []);
            const options = markets.flatMap((mk) => mk.market_options || []);
            const matches = rows.map(({ markets: _m, ...rest }) => rest);
            return { matches, markets, options };
          });
      }

      const [t, { matches: m, markets: allMarkets, options: allOptions }, mem] = await Promise.all([
        fetchTournament(tournamentId),
        matchesPromise,
        fetchTournamentMembers(tournamentId),
      ]);

      const matchIds = m.map((x) => x.id);
      matchIdsRef.current = matchIds;
      marketIdsRef.current = allMarkets.map((mk) => mk.id);

      // Round 2 — bets + profils membres uniquement (pas tous les profils)
      const memberUserIds = mem.map((x) => x.user_id);
      const [allBets, p] = await Promise.all([
        fetchBetsByMatches(matchIds),
        fetchProfilesByIds(memberUserIds),
      ]);

      setTournament(t);
      setMatches(m);
      setMembers(mem);
      setProfiles(p);
      setMarkets(allMarkets);
      setMarketOptions(allOptions);
      setBets(allBets);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  const silentReloadBets = useCallback(async () => {
    const ids = matchIdsRef.current;
    if (!ids.length) return;
    const data = await fetchBetsByMatches(ids);
    setBets(data);
  }, []);

  const silentReloadMatches = useCallback(async () => {
    if (DEMO_MODE) {
      const m = await fetchMatches(tournamentId);
      setMatches(m);
      matchIdsRef.current = m.map((x) => x.id);
      return;
    }
    const { data, error } = await supabase
      .from('matches')
      .select('*, markets(*, market_options(*))')
      .eq('tournament_id', tournamentId)
      .order('kickoff', { ascending: true });
    if (error) return;
    const rows = data || [];
    const newMarkets = rows.flatMap((x) => x.markets || []);
    const newOptions = newMarkets.flatMap((mk) => mk.market_options || []);
    const cleanMatches = rows.map(({ markets: _m, ...rest }) => rest);
    setMatches(cleanMatches);
    setMarkets(newMarkets);
    setMarketOptions(newOptions);
    matchIdsRef.current = cleanMatches.map((x) => x.id);
    marketIdsRef.current = newMarkets.map((mk) => mk.id);
  }, [tournamentId]);

  useEffect(() => {
    if (tournamentId) load();
  }, [tournamentId, load]);

  // Écoute les mises à jour d'avatar depuis ProfileModal (demo + prod)
  useEffect(() => {
    const handler = (e) => {
      setProfiles((prev) =>
        prev.map((p) => (p.id === e.detail.id ? { ...p, ...e.detail.updates } : p))
      );
    };
    window.addEventListener('pronoking:profile-updated', handler);
    return () => window.removeEventListener('pronoking:profile-updated', handler);
  }, []);

  // ==================== SUPABASE REALTIME ====================
  useEffect(() => {
    if (DEMO_MODE || !tournamentId) return;

    const channel = supabase
      .channel(`tournament-${tournamentId}`)

      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tournaments', filter: `id=eq.${tournamentId}` },
        (payload) => {
          if (payload.new) setTournament((prev) => ({ ...prev, ...payload.new }));
        }
      )

      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${tournamentId}` },
        () => { silentReloadMatches(); }
      )

      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bets' },
        (payload) => {
          const mid = payload.new?.match_id || payload.old?.match_id;
          if (mid && matchIdsRef.current.includes(mid)) {
            silentReloadBets();
          }
        }
      )

      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'market_options' },
        (payload) => {
          if (payload.new && marketIdsRef.current.includes(payload.new.market_id)) {
            setMarketOptions((prev) =>
              prev.map((o) => (o.id === payload.new.id ? { ...o, ...payload.new } : o))
            );
          }
        }
      )

      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tournament_members', filter: `tournament_id=eq.${tournamentId}` },
        (payload) => {
          if (payload.new) setMembers((prev) => [...prev, payload.new]);
        }
      )

      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          if (payload.new) {
            setProfiles((prev) =>
              prev.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p))
            );
          }
        }
      )

      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [tournamentId, silentReloadBets, silentReloadMatches]);

  return {
    tournament,
    matches,
    members,
    profiles,
    markets,
    marketOptions,
    bets,
    loading,
    error,
    reload: load,
  };
}
