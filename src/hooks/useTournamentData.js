import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchTournament,
  fetchMatches,
  fetchTournamentMembers,
  fetchProfiles,
  fetchMarkets,
  fetchMarketOptions,
  fetchBets,
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

  // Refs pour éviter les closures périmées dans les callbacks Realtime
  const matchIdsRef = useRef([]);
  const marketIdsRef = useRef([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [t, m, mem, p] = await Promise.all([
        fetchTournament(tournamentId),
        fetchMatches(tournamentId),
        fetchTournamentMembers(tournamentId),
        fetchProfiles(),
      ]);

      setTournament(t);
      setMatches(m);
      setMembers(mem);
      setProfiles(p);

      const matchIds = m.map((x) => x.id);
      matchIdsRef.current = matchIds;

      let allMarkets = [];
      let allBets = [];

      await Promise.all(
        matchIds.map(async (mid) => {
          const [mk, b] = await Promise.all([fetchMarkets(mid), fetchBets(mid)]);
          allMarkets = [...allMarkets, ...mk];
          allBets = [...allBets, ...b];
        })
      );

      let allOptions = [];
      await Promise.all(
        allMarkets.map(async (mk) => {
          const opts = await fetchMarketOptions(mk.id);
          allOptions = [...allOptions, ...opts];
        })
      );

      marketIdsRef.current = allMarkets.map((mk) => mk.id);

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

  // Rechargement silencieux (sans spinner) pour les updates Realtime
  const silentReloadBets = useCallback(async () => {
    const ids = matchIdsRef.current;
    if (!ids.length) return;
    const results = await Promise.all(ids.map((mid) => fetchBets(mid)));
    setBets(results.flat());
  }, []);

  const silentReloadMatches = useCallback(async () => {
    const m = await fetchMatches(tournamentId);
    setMatches(m);
    matchIdsRef.current = m.map((x) => x.id);
  }, [tournamentId]);

  const silentReloadProfiles = useCallback(async () => {
    const p = await fetchProfiles();
    setProfiles(p);
  }, []);

  useEffect(() => {
    if (tournamentId) load();
  }, [tournamentId, load]);

  // Écoute les mises à jour de profil (avatar, etc.) déclenchées depuis ProfileModal
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

      // Tournoi modifié (verrou, suppression…)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tournaments', filter: `id=eq.${tournamentId}` },
        (payload) => {
          if (payload.new) setTournament((prev) => ({ ...prev, ...payload.new }));
        }
      )

      // Match ajouté, score mis à jour, match terminé
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${tournamentId}` },
        () => { silentReloadMatches(); }
      )

      // Paris posés/modifiés → classement recalculé
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

      // Option gagnante validée par l'admin
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

      // Nouveau membre rejoint
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tournament_members', filter: `tournament_id=eq.${tournamentId}` },
        (payload) => {
          if (payload.new) setMembers((prev) => [...prev, payload.new]);
        }
      )

      // Avatar ou profil mis à jour
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

    return () => { supabase.removeChannel(channel); };
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
