import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, TrendingUp, Target, Zap, Trophy, ChevronLeft } from 'lucide-react';
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

// ── Fetch all data needed for stats ──────────────────────────────────────────
async function loadStatsData(userId) {
  const bets = await fetchAllUserBets(userId);
  if (bets.length === 0) return { bets: [], optionMap: new Map(), marketMap: new Map(), matchMap: new Map(), tournamentMap: new Map() };

  const matchIds = [...new Set(bets.map((b) => b.match_id))];

  // Batch fetch matches
  let matches = [];
  if (!DEMO_MODE) {
    const { data } = await supabase.from('matches').select('*').in('id', matchIds);
    matches = data || [];
  }

  const markets = await fetchMarketsByMatches(matchIds);
  const marketIds = markets.map((m) => m.id);
  const options = await fetchMarketOptionsByMarkets(marketIds);

  // Also fetch option IDs directly used in bets (some options may come from other markets)
  const betOptionIds = [...new Set(bets.map((b) => b.market_option_id))];
  const missingOptionIds = betOptionIds.filter((id) => !options.some((o) => o.id === id));
  let extraOptions = [];
  if (missingOptionIds.length > 0 && !DEMO_MODE) {
    const { data } = await supabase.from('market_options').select('*').in('id', missingOptionIds);
    extraOptions = data || [];
  }

  const allOptions = [...options, ...extraOptions];

  // Fetch tournaments
  const tournaments = await fetchTournaments();

  return {
    bets,
    optionMap: new Map(allOptions.map((o) => [o.id, o])),
    marketMap: new Map(markets.map((m) => [m.id, m])),
    matchMap: new Map(matches.map((m) => [m.id, m])),
    tournamentMap: new Map(tournaments.map((t) => [t.id, t.name])),
  };
}

// ── Stat card component ───────────────────────────────────────────────────────
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

// ── Progress bar ──────────────────────────────────────────────────────────────
function WinBar({ rate, color = 'var(--accent-green)' }) {
  return (
    <div className="win-bar-bg">
      <div className="win-bar-fill" style={{ width: `${Math.max(rate, 2)}%`, background: color }} />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StatsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatsData(user.id)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [user.id]);

  const stats = useMemo(() => {
    if (!data) return null;
    const { bets, optionMap, marketMap, matchMap, tournamentMap } = data;

    const finishedBets = bets.filter((b) => {
      const match = matchMap.get(b.match_id);
      return match?.is_finished;
    });

    const totalTokens = bets.reduce((s, b) => s + b.tokens, 0);
    const totalPoints = bets.reduce((s, b) => s + (parseFloat(b.points_won) || 0), 0);
    const wonBets = finishedBets.filter((b) => optionMap.get(b.market_option_id)?.is_winner);
    const winRate = finishedBets.length > 0 ? (wonBets.length / finishedBets.length) * 100 : 0;
    const roi = totalTokens > 0 ? ((totalPoints - totalTokens) / totalTokens) * 100 : 0;

    // ── Par type de marché ──
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

    // ── Top 5 paris ──
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

    // ── Par tournoi ──
    const byTournament = {};
    for (const bet of bets) {
      const match = matchMap.get(bet.match_id);
      if (!match) continue;
      const tId = match.tournament_id;
      if (!byTournament[tId]) byTournament[tId] = { name: tournamentMap.get(tId) || '?', points: 0, bets: 0, won: 0 };
      byTournament[tId].bets++;
      byTournament[tId].points += parseFloat(bet.points_won) || 0;
      if (optionMap.get(bet.market_option_id)?.is_winner) byTournament[tId].won++;
    }
    const byTournamentArr = Object.values(byTournament).sort((a, b) => b.points - a.points);

    // ── Cote moyenne gagnants vs perdants ──
    const oddsWon = wonBets.map((b) => parseFloat(optionMap.get(b.market_option_id)?.odds || 0)).filter(Boolean);
    const oddsLost = finishedBets
      .filter((b) => !optionMap.get(b.market_option_id)?.is_winner)
      .map((b) => parseFloat(optionMap.get(b.market_option_id)?.odds || 0)).filter(Boolean);
    const avgOddsWon = oddsWon.length > 0 ? oddsWon.reduce((s, v) => s + v, 0) / oddsWon.length : 0;
    const avgOddsLost = oddsLost.length > 0 ? oddsLost.reduce((s, v) => s + v, 0) / oddsLost.length : 0;

    return { bets, finishedBets, totalTokens, totalPoints, winRate, roi, byTypeArr, topBets, byTournamentArr, avgOddsWon, avgOddsLost };
  }, [data]);

  if (loading) return (
    <PageTransition>
      <EmptyState description="Chargement des statistiques..." />
    </PageTransition>
  );

  if (!stats || stats.bets.length === 0) return (
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

  const { totalTokens, totalPoints, winRate, roi, byTypeArr, topBets, byTournamentArr, avgOddsWon, avgOddsLost, finishedBets } = stats;

  return (
    <PageTransition>
      <Button variant="ghost" onClick={() => navigate('/')} style={{ marginBottom: 16 }}>
        <ChevronLeft size={16} /> Retour
      </Button>

      {/* Header */}
      <div className="card" style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <UserAvatar user={user} size={60} />
        </div>
        <div style={{ fontFamily: 'Oswald', fontSize: 22, fontWeight: 600 }}>{user.username}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>Mes statistiques</div>
      </div>

      {/* Vue d'ensemble */}
      <h3 className="stats-section-title"><BarChart2 size={16} /> Vue d'ensemble</h3>
      <div className="stats-grid-4">
        <StatCard
          icon={<Target size={20} />}
          label="Taux de réussite"
          value={`${winRate.toFixed(0)}%`}
          sub={`${finishedBets.filter((b) => data.optionMap.get(b.market_option_id)?.is_winner).length}/${finishedBets.length} paris`}
          color={winRate >= 50 ? 'var(--accent-green)' : 'var(--accent-red)'}
        />
        <StatCard
          icon={<Trophy size={20} />}
          label="Points gagnés"
          value={totalPoints.toFixed(1)}
          sub={`${stats.bets.length} paris au total`}
          color="var(--accent-gold)"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="ROI"
          value={`${roi > 0 ? '+' : ''}${roi.toFixed(0)}%`}
          sub={`${totalTokens} jetons misés`}
          color={roi >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}
        />
        <StatCard
          icon={<Zap size={20} />}
          label="Cote moyenne"
          value={avgOddsWon > 0 ? `×${avgOddsWon.toFixed(2)}` : '—'}
          sub="sur les paris gagnés"
          color="var(--accent-cyan)"
        />
      </div>

      {/* Par type de marché */}
      {byTypeArr.length > 0 && (
        <>
          <h3 className="stats-section-title"><Target size={16} /> Par type de marché</h3>
          <div className="card" style={{ marginBottom: 24 }}>
            {byTypeArr.map((t) => (
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

      {/* Cote & risque */}
      {(avgOddsWon > 0 || avgOddsLost > 0) && (
        <>
          <h3 className="stats-section-title"><TrendingUp size={16} /> Profil de risque</h3>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="stats-odds-row">
              <div className="stats-odds-block" style={{ borderColor: 'var(--accent-green)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Cote moy. gagnants</div>
                <div style={{ fontFamily: 'Oswald', fontSize: 26, color: 'var(--accent-green)' }}>
                  ×{avgOddsWon > 0 ? avgOddsWon.toFixed(2) : '—'}
                </div>
              </div>
              <div className="stats-odds-vs">VS</div>
              <div className="stats-odds-block" style={{ borderColor: 'var(--accent-red)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Cote moy. perdants</div>
                <div style={{ fontFamily: 'Oswald', fontSize: 26, color: 'var(--accent-red)' }}>
                  ×{avgOddsLost > 0 ? avgOddsLost.toFixed(2) : '—'}
                </div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, textAlign: 'center' }}>
              {avgOddsWon >= avgOddsLost
                ? 'Tu joues plus souvent de grosses cotes quand tu gagnes — profil audacieux !'
                : 'Tu perds plus souvent sur les grosses cotes — essaie les favoris !'}
            </p>
          </div>
        </>
      )}

      {/* Top 5 paris */}
      {topBets.length > 0 && (
        <>
          <h3 className="stats-section-title"><Trophy size={16} /> Top {topBets.length} meilleurs paris</h3>
          <div className="card" style={{ marginBottom: 24 }}>
            {topBets.map((bet, i) => (
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

      {/* Par tournoi */}
      {byTournamentArr.length > 0 && (
        <>
          <h3 className="stats-section-title"><Trophy size={16} /> Par tournoi</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {byTournamentArr.map((t, i) => (
              <div key={i} className="card stats-tournament-row">
                <div style={{ fontFamily: 'Oswald', fontSize: 15, flex: 1 }}>{t.name}</div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t.bets} paris</span>
                  <span style={{
                    fontFamily: 'Oswald', fontSize: 18, fontWeight: 600,
                    color: t.points > 0 ? 'var(--accent-gold)' : 'var(--text-muted)',
                  }}>
                    {t.points > 0 ? '+' : ''}{t.points.toFixed(1)} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </PageTransition>
  );
}
