import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { fetchProfile, fetchMatches, fetchBets, fetchMarkets, fetchMarketOptions } from '@/lib/db';
import { Button, PageTransition, EmptyState } from '@/components/ui/Components';

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
      const [p, m] = await Promise.all([
        fetchProfile(playerId),
        fetchMatches(tournamentId),
      ]);
      setPlayer(p);
      setMatches(m);

      let allBets = [], allMarkets = [], allOptions = [];

      await Promise.all(
        m.map(async (match) => {
          const [b, mk] = await Promise.all([
            fetchBets(match.id),
            fetchMarkets(match.id),
          ]);
          // Only keep this player's bets
          allBets = [...allBets, ...b.filter((bet) => bet.user_id === playerId)];
          allMarkets = [...allMarkets, ...mk];
        })
      );

      await Promise.all(
        allMarkets.map(async (mk) => {
          const opts = await fetchMarketOptions(mk.id);
          allOptions = [...allOptions, ...opts];
        })
      );

      setBets(allBets);
      setMarkets(allMarkets);
      setMarketOptions(allOptions);
    } finally {
      setLoading(false);
    }
  }, [playerId, tournamentId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <EmptyState description="Chargement..." />;
  if (!player) return <EmptyState description="Joueur introuvable" />;

  const totalPoints = bets.reduce((s, b) => s + (parseFloat(b.points_won) || 0), 0);
  const totalTokensBet = bets.reduce((s, b) => s + b.tokens, 0);
  const matchesWithBets = matches.filter((m) => bets.some((b) => b.match_id === m.id));

  return (
    <PageTransition>
      <Button
        variant="ghost"
        onClick={() => navigate(`/tournament/${tournamentId}`)}
        style={{ marginBottom: 16 }}
      >
        <ChevronLeft size={16} /> Retour au tournoi
      </Button>

      {/* Player header */}
      <div className="card" style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--gradient-gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Oswald', fontWeight: 700, fontSize: 28,
          color: 'var(--bg-primary)', margin: '0 auto 12px',
        }}>
          {player.username[0].toUpperCase()}
        </div>
        <h2 style={{ fontSize: 24 }}>{player.username}</h2>

        <div className="player-stats-row" style={{ marginTop: 16 }}>
          <StatBlock value={totalPoints.toFixed(1)} label="Points" color="var(--accent-gold)" />
          <StatBlock value={totalTokensBet} label="Jetons misés" color="var(--text-secondary)" />
          <StatBlock value={matchesWithBets.length} label="Matchs pariés" color="var(--text-secondary)" />
        </div>
      </div>

      {/* Bets detail */}
      <h3 style={{ fontSize: 18, marginBottom: 16, fontFamily: 'Oswald', textTransform: 'uppercase', letterSpacing: 1 }}>
        Détail des paris
      </h3>

      {matchesWithBets.length === 0 ? (
        <EmptyState description="Aucun pari enregistré" />
      ) : (
        matchesWithBets.map((match) => {
          const matchBets = bets.filter((b) => b.match_id === match.id);
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
                const opt = marketOptions.find((o) => o.id === bet.market_option_id);
                const market = opt ? markets.find((m) => m.id === opt.market_id) : null;

                const borderColor = match.is_finished
                  ? (opt?.is_winner ? 'var(--accent-green)' : 'var(--accent-red)')
                  : 'var(--border)';

                return (
                  <div
                    key={bet.id}
                    style={{
                      display: 'flex', alignItems: 'center',
                      padding: '6px 12px', fontSize: 14,
                      color: 'var(--text-secondary)', gap: 8,
                      borderLeft: `2px solid ${borderColor}`,
                      marginBottom: 4,
                    }}
                  >
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
