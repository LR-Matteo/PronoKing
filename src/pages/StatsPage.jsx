import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '@/styles/components/stats.css';
import { BarChart2, TrendingUp, Target, Zap, Trophy, ChevronLeft, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchAllUserBets,
  fetchMarketOptionsByMarkets,
  fetchMarketsByMatches,
  fetchTournaments,
} from '@/lib/db';
import { supabase, DEMO_MODE } from '@/lib/supabase';
import { PageTransition, EmptyState, Button } from '@/components/ui/Components';
import UserAvatar from '@/components/ui/UserAvatar';

const MARKET_LABELS = {
  '1N2': 'Résultat final',
  'exact_score': 'Score exact',
  'total_goals': 'Total de buts',
  'btts': 'Les deux équipes marquent',
  'handicap': 'Handicap',
};
function marketLabel(type) {
  return MARKET_LABELS[type] || type;
}

// ── Fetch all data ─────────────────────────────────────────────────────────────
async function loadStatsData(userId) {
  const bets = await fetchAllUserBets(userId);
  if (bets.length === 0) return { bets: [], optionMap: new Map(), marketMap: new Map(), matchMap: new Map(), tournamentMap: new Map() };

  const matchIds = [...new Set(bets.map((b) => b.match_id))];

  // Tout en parallèle : matches + markets + tournois
  const [matchesResult, markets, tournaments] = await Promise.all([
    DEMO_MODE ? Promise.resolve({ data: [] }) : supabase.from('matches').select('*').in('id', matchIds),
    fetchMarketsByMatches(matchIds),
    fetchTournaments(),
  ]);

  const matches = matchesResult.data || [];
  const marketIds = markets.map((m) => m.id);
  const options = await fetchMarketOptionsByMarkets(marketIds);

  return {
    bets,
    optionMap: new Map(options.map((o) => [o.id, o])),
    marketMap: new Map(markets.map((m) => [m.id, m])),
    matchMap: new Map(matches.map((m) => [m.id, m])),
    tournamentMap: new Map(tournaments.map((t) => [t.id, t.name])),
  };
}

// ── Compute stats from a filtered bet list ─────────────────────────────────────
function computeStats(bets, optionMap, marketMap, matchMap) {
  const finishedBets = bets.filter((b) => matchMap.get(b.match_id)?.is_finished);

  const totalTokens = bets.reduce((s, b) => s + b.tokens, 0);
  const totalPoints = bets.reduce((s, b) => s + (parseFloat(b.points_won) || 0), 0);
  const wonBets = finishedBets.filter((b) => optionMap.get(b.market_option_id)?.is_winner);
  const winRate = finishedBets.length > 0 ? (wonBets.length / finishedBets.length) * 100 : 0;
  const roi = totalTokens > 0 ? ((totalPoints - totalTokens) / totalTokens) * 100 : 0;

  // Par type de marché
  const byType = {};
  for (const bet of finishedBets) {
    const opt = optionMap.get(bet.market_option_id);
    const market = opt ? marketMap.get(opt.market_id) : null;
    if (!market) continue;
    const t = market.type;
    if (!byType[t]) byType[t] = { won: 0, total: 0, points: 0, tokens: 0 };
    byType[t].total++;
    byType[t].tokens += bet.tokens;
    byType[t].points += parseFloat(bet.points_won) || 0;
    if (opt?.is_winner) byType[t].won++;
  }
  const byTypeArr = Object.entries(byType)
    .map(([type, v]) => ({ type, ...v, rate: v.total > 0 ? (v.won / v.total) * 100 : 0 }))
    .sort((a, b) => b.points - a.points);

  // Top 5 paris
  const topBets = [...finishedBets]
    .filter((b) => parseFloat(b.points_won) > 0)
    .sort((a, b) => parseFloat(b.points_won) - parseFloat(a.points_won))
    .slice(0, 5)
    .map((b) => {
      const opt = optionMap.get(b.market_option_id);
      const market = opt ? marketMap.get(opt.market_id) : null;
      const match = matchMap.get(b.match_id);
      return { ...b, opt, market, match };
    });

  // Cotes moyennes
  const oddsWon = wonBets.map((b) => parseFloat(optionMap.get(b.market_option_id)?.odds || 0)).filter(Boolean);
  const oddsLost = finishedBets
    .filter((b) => !optionMap.get(b.market_option_id)?.is_winner)
    .map((b) => parseFloat(optionMap.get(b.market_option_id)?.odds || 0)).filter(Boolean);
  const avgOddsWon = oddsWon.length > 0 ? oddsWon.reduce((s, v) => s + v, 0) / oddsWon.length : 0;
  const avgOddsLost = oddsLost.length > 0 ? oddsLost.reduce((s, v) => s + v, 0) / oddsLost.length : 0;

  return { bets, finishedBets, wonBets, totalTokens, totalPoints, winRate, roi, byTypeArr, topBets, avgOddsWon, avgOddsLost };
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = 'var(--accent-gold)' }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ color }}>{icon}</div>
      <div className="stat-card-value" style={{ color }}>{value}</div>
      <div className="stat-card-label">{label}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}

function WinBar({ rate, color = 'var(--accent-green)' }) {
  return (
    <div className="win-bar-bg">
      <div className="win-bar-fill" style={{ width: `${Math.max(rate, 2)}%`, background: color }} />
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function StatsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState(null); // null = tous

  useEffect(() => {
    loadStatsData(user.id)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [user.id]);

  // Tournois ayant des paris de cet utilisateur
  const userTournaments = useMemo(() => {
    if (!data) return [];
    const seen = new Set();
    for (const bet of data.bets) {
      const match = data.matchMap.get(bet.match_id);
      if (match?.tournament_id) seen.add(match.tournament_id);
    }
    return [...seen].map((id) => ({ id, name: data.tournamentMap.get(id) || '?' }));
  }, [data]);

  // Paris filtrés selon le tournoi sélectionné
  const filteredBets = useMemo(() => {
    if (!data) return [];
    if (!selectedTournament) return data.bets;
    return data.bets.filter((b) => data.matchMap.get(b.match_id)?.tournament_id === selectedTournament);
  }, [data, selectedTournament]);

  const stats = useMemo(() => {
    if (!data || filteredBets.length === 0) return null;
    return computeStats(filteredBets, data.optionMap, data.marketMap, data.matchMap);
  }, [data, filteredBets]);

  if (loading) return (
    <PageTransition>
      <EmptyState description="Chargement des statistiques..." />
    </PageTransition>
  );

  if (!data || data.bets.length === 0) return (
    <PageTransition>
      <Button variant="ghost" onClick={() => navigate('/')} style={{ marginBottom: 16 }}>
        <ChevronLeft size={16} /> Retour
      </Button>
      <EmptyState
        icon={<BarChart2 size={48} />}
        title="Aucune statistique"
        description="Place tes premiers paris pour voir tes stats ici !"
      />
    </PageTransition>
  );

  return (
    <PageTransition>
      <Button variant="ghost" onClick={() => navigate('/')} style={{ marginBottom: 16 }}>
        <ChevronLeft size={16} /> Retour
      </Button>

      {/* Header */}
      <div className="card" style={{ marginBottom: 20, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <UserAvatar user={user} size={56} />
        </div>
        <div style={{ fontFamily: 'Oswald', fontSize: 20, fontWeight: 600 }}>{user.username}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>Statistiques</div>
      </div>

      {/* Filtre par tournoi */}
      {userTournaments.length > 1 && (
        <div className="stats-filter-bar">
          <button
            className={`stats-filter-btn ${!selectedTournament ? 'active' : ''}`}
            onClick={() => setSelectedTournament(null)}
          >
            <Globe size={13} /> Tous
          </button>
          {userTournaments.map((t) => (
            <button
              key={t.id}
              className={`stats-filter-btn ${selectedTournament === t.id ? 'active' : ''}`}
              onClick={() => setSelectedTournament(t.id)}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {/* Pas de paris dans ce tournoi */}
      {!stats ? (
        <EmptyState description="Aucun pari dans ce tournoi" />
      ) : (
        <>
          {/* Vue d'ensemble */}
          <h3 className="stats-section-title"><BarChart2 size={16} /> Vue d'ensemble</h3>
          <div className="stats-grid-4">
            <StatCard
              icon={<Target size={20} />}
              label="Taux de réussite"
              value={`${stats.winRate.toFixed(0)}%`}
              sub={`${stats.wonBets.length}/${stats.finishedBets.length} paris`}
              color={stats.winRate >= 50 ? 'var(--accent-green)' : 'var(--accent-red)'}
            />
            <StatCard
              icon={<Trophy size={20} />}
              label="Points gagnés"
              value={stats.totalPoints.toFixed(1)}
              sub={`${stats.bets.length} paris`}
              color="var(--accent-gold)"
            />
            <StatCard
              icon={<TrendingUp size={20} />}
              label="ROI"
              value={`${stats.roi > 0 ? '+' : ''}${stats.roi.toFixed(0)}%`}
              sub={`${stats.totalTokens} jetons misés`}
              color={stats.roi >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}
            />
            <StatCard
              icon={<Zap size={20} />}
              label="Cote moy. gagnée"
              value={stats.avgOddsWon > 0 ? `×${stats.avgOddsWon.toFixed(2)}` : '—'}
              sub="sur les paris gagnés"
              color="var(--accent-cyan)"
            />
          </div>

          {/* Par type de marché */}
          {stats.byTypeArr.length > 0 && (
            <>
              <h3 className="stats-section-title"><Target size={16} /> Par type de marché</h3>
              <div className="card" style={{ marginBottom: 24 }}>
                {stats.byTypeArr.map((t) => (
                  <div key={t.type} className="stats-market-row">
                    <div className="stats-market-name">{marketLabel(t.type)}</div>
                    <div style={{ flex: 1 }}>
                      <div className="stats-market-meta">
                        <span>{t.won}/{t.total} gagnés</span>
                        <span style={{ color: t.points > 0 ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                          {t.points > 0 ? '+' : ''}{t.points.toFixed(1)} pts
                        </span>
                        <span style={{ color: 'var(--accent-cyan)' }}>{t.rate.toFixed(0)}%</span>
                      </div>
                      <WinBar rate={t.rate} color={t.rate >= 50 ? 'var(--accent-green)' : 'var(--accent-gold)'} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Profil de risque */}
          {(stats.avgOddsWon > 0 || stats.avgOddsLost > 0) && (
            <>
              <h3 className="stats-section-title"><TrendingUp size={16} /> Profil de risque</h3>
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="stats-odds-row">
                  <div className="stats-odds-block" style={{ borderColor: 'var(--accent-green)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Cote moy. gagnants</div>
                    <div style={{ fontFamily: 'Oswald', fontSize: 26, color: 'var(--accent-green)' }}>
                      ×{stats.avgOddsWon > 0 ? stats.avgOddsWon.toFixed(2) : '—'}
                    </div>
                  </div>
                  <div className="stats-odds-vs">VS</div>
                  <div className="stats-odds-block" style={{ borderColor: 'var(--accent-red)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Cote moy. perdants</div>
                    <div style={{ fontFamily: 'Oswald', fontSize: 26, color: 'var(--accent-red)' }}>
                      ×{stats.avgOddsLost > 0 ? stats.avgOddsLost.toFixed(2) : '—'}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, textAlign: 'center' }}>
                  {stats.avgOddsWon >= stats.avgOddsLost
                    ? 'Tu joues plus souvent de grosses cotes quand tu gagnes — profil audacieux !'
                    : 'Tu perds plus souvent sur les grosses cotes — essaie les favoris !'}
                </p>
              </div>
            </>
          )}

          {/* Top paris */}
          {stats.topBets.length > 0 && (
            <>
              <h3 className="stats-section-title"><Trophy size={16} /> Top {stats.topBets.length} meilleurs paris</h3>
              <div className="card" style={{ marginBottom: 24 }}>
                {stats.topBets.map((bet, i) => (
                  <div key={bet.id} className="stats-top-bet">
                    <div className="stats-top-bet-rank">#{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                        {bet.opt?.label || '?'}
                        <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 12 }}>
                          — {bet.market ? marketLabel(bet.market.type) : ''}
                        </span>
                      </div>
                      {bet.match && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {bet.match.home_team} vs {bet.match.away_team}
                          {bet.match.is_finished && ` (${bet.match.home_score}-${bet.match.away_score})`}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'Oswald', fontSize: 16, color: 'var(--accent-green)' }}>
                        +{parseFloat(bet.points_won).toFixed(1)} pts
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {bet.tokens}J × {parseFloat(bet.opt?.odds || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Par tournoi — visible uniquement en vue globale */}
          {!selectedTournament && userTournaments.length > 1 && (
            <>
              <h3 className="stats-section-title"><Globe size={16} /> Par tournoi</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {userTournaments.map((t) => {
                  const tBets = data.bets.filter((b) => data.matchMap.get(b.match_id)?.tournament_id === t.id);
                  const tPoints = tBets.reduce((s, b) => s + (parseFloat(b.points_won) || 0), 0);
                  const tWon = tBets.filter((b) => data.optionMap.get(b.market_option_id)?.is_winner).length;
                  const tFinished = tBets.filter((b) => data.matchMap.get(b.match_id)?.is_finished).length;
                  return (
                    <button
                      key={t.id}
                      className="card stats-tournament-row"
                      onClick={() => setSelectedTournament(t.id)}
                      style={{ cursor: 'pointer', textAlign: 'left', width: '100%' }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'Oswald', fontSize: 15 }}>{t.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {tBets.length} paris · {tWon}/{tFinished} gagnés
                        </div>
                      </div>
                      <div style={{
                        fontFamily: 'Oswald', fontSize: 20, fontWeight: 600,
                        color: tPoints > 0 ? 'var(--accent-gold)' : 'var(--text-muted)',
                      }}>
                        {tPoints > 0 ? '+' : ''}{tPoints.toFixed(1)} pts
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </PageTransition>
  );
}
