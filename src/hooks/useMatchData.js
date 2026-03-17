import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMatch, fetchTournament, fetchMarkets, fetchMarketOptionsByMarkets, fetchBets } from '@/lib/db';
import { supabase, DEMO_MODE } from '@/lib/supabase';

export function useMatchData(matchId, tournamentId) {
  const [match, setMatch] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [marketOptions, setMarketOptions] = useState([]);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ref pour les IDs de marchés (évite les closures périmées)
  const marketIdsRef = useRef([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [m, t, mk, b] = await Promise.all([
        fetchMatch(matchId),
        fetchTournament(tournamentId),
        fetchMarkets(matchId),
        fetchBets(matchId),
      ]);

      const marketIds = (mk || []).map((market) => market.id);
      marketIdsRef.current = marketIds;

      const allOpts = await fetchMarketOptionsByMarkets(marketIds);

      setMatch(m);
      setTournament(t);
      setMarkets(mk);
      setMarketOptions(allOpts);
      setBets(b);
    } finally {
      setLoading(false);
    }
  }, [matchId, tournamentId]);

  useEffect(() => {
    if (matchId) load();
  }, [matchId, load]);

  // ==================== SUPABASE REALTIME ====================
  useEffect(() => {
    if (DEMO_MODE || !matchId) return;

    const channel = supabase
      .channel(`match-${matchId}`)

      // Score mis à jour / match terminé par l'admin
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
        (payload) => {
          if (payload.new) setMatch((prev) => ({ ...prev, ...payload.new }));
        }
      )

      // Pari posé, modifié ou supprimé par un joueur
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bets', filter: `match_id=eq.${matchId}` },
        () => { fetchBets(matchId).then(setBets); }
      )

      // Option gagnante validée (is_winner mis à jour)
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

      // Nouveau marché ajouté par l'admin
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'markets', filter: `match_id=eq.${matchId}` },
        async (payload) => {
          if (payload.new) {
            const opts = await fetchMarketOptions(payload.new.id);
            marketIdsRef.current = [...marketIdsRef.current, payload.new.id];
            setMarkets((prev) => [...prev, payload.new]);
            setMarketOptions((prev) => [...prev, ...opts]);
          }
        }
      )

      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  return { match, tournament, markets, marketOptions, bets, loading, reload: load };
}
