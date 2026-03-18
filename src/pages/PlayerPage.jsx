import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import {
  fetchProfile,
  fetchMatches,
  fetchMarketsByMatches,
  fetchMarketOptionsByMarkets,
  fetchBetsByMatches,
} from '@/lib/db';
import { Button, PageTransition, EmptyState } from '@/components/ui/Components';
import UserAvatar from '@/components/ui/UserAvatar';

export default function PlayerPage() {
  const { tournamentId, playerId } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [matches, setMatches] = useState([]);
  const [bets, setBets] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [marketOptions, setMarketOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [p, allMatches] = await Promise.all([
        fetchProfile(playerId),
        fetchMatches(tournamentId),
      ]);
      setPlayer(p);
      setMatches(allMatches);

      const matchIds = allMatches.map((m) => m.id);

      // 3 requêtes batch au lieu de N+1
      const [allBets, allMarkets] = await Promise.all([
        fetchBetsByMatches(matchIds),
        fetchMarketsByMatches(matchIds),
      ]);

      const marketIds = allMarkets.map((m) => m.id);
      const allOptions = await fetchMarketOptionsByMarkets(marketIds);

      setBets(allBets.filter((b) => b.user_id === playerId));
      setMarkets(allMarkets);
      setMarketOptions(allOptions);
    } finally {
      setLoading(false);
    }
  }, [playerId, tournamentId]);

  useEffect(() => { load(); }, [load]);

  // Maps O(1) au lieu de find() O(n) dans la boucle de rendu
  const optionMap = useMemo(() => new Map(marketOptions.map((o) => [o.id, o])), [marketOptions]);
  const marketMap = useMemo(() => new Map(markets.map((m) => [m.id, m])), [markets]);
  const betsByMatch = useMemo(() => {
    const map = new Map();
    for (const b of bets) {
      if (!map.has(b.match_id)) map.set(b.match_id, []);
      map.get(b.match_id).push(b);
    }
    return map;
  }, [bets]);

  if (loading) return <EmptyState description="Chargement..." />;
  if (!player) return <EmptyState description="Joueur introuvable" />;

  const totalPoints = bets.reduce((s, b) => s + (parseFloat(b.points_won) || 0), 0);
  const totalTokensBet = bets.reduce((s, b) => s + b.tokens, 0);
  const matchesWithBets = matches.filter((m) => betsByMatch.has(m.id));

  return (
    <PageTransition>
      <Button variant="ghost" onClick={() => navigate(`/tournament/${tournamentId}`)} style={{ marginBottom: 16 }}>
        <ChevronLeft size={16} /> Retour au tournoi
      </Button>

      <div className="card" style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <UserAvatar user={player} size={72} />
        </div>
        <h2 style={{ fontSize: 24 }}>{player.username}</h2>
        <div className="player-stats-row" style={{ marginTop: 16 }}>
          <StatBlock value={totalPoints.toFixed(1)} label="Points" color="var(--accent-gold)" />
          <StatBlock value={totalTokensBet} label="Jetons misés" color="var(--text-secondary)" />
          <StatBlock value={matchesWithBets.length} label="Matchs pariés" color="var(--text-secondary)" />
        </div>
      </div>

      <h3 style={{ fontSize: 18, marginBottom: 16, fontFamily: 'Oswald', textTransform: 'uppercase', letterSpacing: 1 }}>
        Détail des paris
      </h3>

      {matchesWithBets.length === 0 ? (
        <EmptyState description="Aucun pari enregistré" />
      ) : (
        matchesWithBets.map((match) => {
          const matchBets = betsByMatch.get(match.id) || [];
          const matchPoints = matchBets.reduce((s, b) => s + (parseFloat(b.points_won) || 0), 0);

          return (
            <div key={match.id} className="card" style={{ marginBottom: 12 }}>
              <div className="flex-between" style={{ marginBottom: 12 }}>
                <div>
                  <span style={{ fontFamily: 'Oswald', fontSize: 16, fontWeight: 600 }}>
                    {match.home_team} vs {match.away_team}
                  </span>
                  {match.is_finished && (
                    <span style={{ marginLeft: 8, fontFamily: 'Oswald', color: 'var(--accent-gold)' }}>
                      ({match.home_score} - {match.away_score})
                    </span>
                  )}
                </div>
                {match.is_finished && (
                  <span style={{
                    fontFamily: 'Oswald', fontSize: 18, fontWeight: 600,
                    color: matchPoints > 0 ? 'var(--accent-green)' : 'var(--text-muted)',
                  }}>
                    +{matchPoints.toFixed(1)} pts
                  </span>
                )}
              </div>

              {matchBets.map((bet) => {
                const opt = optionMap.get(bet.market_option_id);
                const market = opt ? marketMap.get(opt.market_id) : null;
                const borderColor = match.is_finished
                  ? (opt?.is_winner ? 'var(--accent-green)' : 'var(--accent-red)')
                  : 'var(--border)';

                return (
                  <div key={bet.id} style={{
                    display: 'flex', alignItems: 'center',
                    padding: '6px 12px', fontSize: 14,
                    color: 'var(--text-secondary)', gap: 8,
                    borderLeft: `2px solid ${borderColor}`,
                    marginBottom: 4,
                  }}>
                    <span style={{ flex: 1 }}>
                      {market?.label}:{' '}
                      <strong style={{ color: 'var(--text-primary)' }}>{opt?.label || '?'}</strong>
                    </span>
                    <span style={{ color: 'var(--accent-cyan)', fontFamily: 'Oswald' }}>
                      ×{opt ? parseFloat(opt.odds).toFixed(2) : '?'}
                    </span>
                    <span style={{ color: 'var(--accent-gold)', fontFamily: 'Oswald' }}>
                      {bet.tokens}J
                    </span>
                    {match.is_finished && (
                      <span style={{
                        fontFamily: 'Oswald',
                        color: parseFloat(bet.points_won) > 0 ? 'var(--accent-green)' : 'var(--text-muted)',
                      }}>
                        → {parseFloat(bet.points_won).toFixed(1)}pts
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </PageTransition>
  );
}

function StatBlock({ value, label, color }) {
  return (
    <div>
      <div style={{ fontFamily: 'Oswald', fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    </div>
  );
}
