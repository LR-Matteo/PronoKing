import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronRight, Star, Target, Zap } from 'lucide-react';
import { formatDateShort, isMatchUpcoming } from '@/lib/utils';
import { TokenCoin } from '@/components/ui/Components';

export default function PlayerDashboard({
  userId,
  tournamentId,
  tournament,
  matches,
  members,
  profiles,
  bets,
}) {
  const navigate = useNavigate();

  const isBankMode = tournament?.token_mode === 'bank';
  const tokenBank = tournament?.token_bank || 0;
  const myTotalTokensSpent = useMemo(
    () => bets.filter((b) => b.user_id === userId).reduce((s, b) => s + (parseInt(b.tokens) || 0), 0),
    [bets, userId]
  );
  const bankRemaining = tokenBank - myTotalTokensSpent;

  const { myRank, myPoints, upcomingUnbet, nextUnbet } = useMemo(() => {
    // Classement
    const rankings = members
      .map((m) => {
        const points = bets
          .filter((b) => b.user_id === m.user_id)
          .reduce((sum, b) => sum + (parseFloat(b.points_won) || 0), 0);
        return { userId: m.user_id, points };
      })
      .sort((a, b) => b.points - a.points);

    const myRankIdx = rankings.findIndex((r) => r.userId === userId);
    const myRank = myRankIdx >= 0 ? myRankIdx + 1 : null;
    const myPoints = rankings[myRankIdx]?.points || 0;

    // Matchs à venir sans pari
    const betMatchIds = new Set(bets.filter((b) => b.user_id === userId).map((b) => b.match_id));
    const upcomingUnbet = matches
      .filter((m) => !m.is_finished && isMatchUpcoming(m.kickoff) && !betMatchIds.has(m.id))
      .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

    return {
      myRank,
      myPoints,
      upcomingUnbet,
      nextUnbet: upcomingUnbet[0] || null,
    };
  }, [userId, members, bets, matches]);

  const rankLabel = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const totalUpcoming = matches.filter((m) => !m.is_finished && isMatchUpcoming(m.kickoff)).length;
  const tokensPerMatch = tournament?.tokens_per_match || 0;
  const totalBudgetLeft = isBankMode ? bankRemaining : upcomingUnbet.length * tokensPerMatch;

  return (
    <div className="player-dashboard">
      {/* 3 stats */}
      <div className="dashboard-stats">
        <div className="dashboard-stat">
          <span className="dashboard-stat-icon"><Star size={15} /></span>
          <span className="dashboard-stat-value">
            {myRank ? rankLabel(myRank) : '—'}
          </span>
          <span className="dashboard-stat-label">Ma position</span>
        </div>

        <div className="dashboard-stat">
          <span className="dashboard-stat-icon"><Zap size={15} /></span>
          <span className="dashboard-stat-value">{myPoints.toFixed(1)}</span>
          <span className="dashboard-stat-label">Mes points</span>
        </div>

        <div className={`dashboard-stat ${upcomingUnbet.length > 0 ? 'dashboard-stat-alert' : ''}`}>
          <span className="dashboard-stat-icon"><Target size={15} /></span>
          <span className="dashboard-stat-value">
            {totalUpcoming - upcomingUnbet.length}
            <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 2 }}>
              /{totalUpcoming}
            </span>
          </span>
          <span className="dashboard-stat-label">Paris posés</span>
        </div>
      </div>

      {/* Jauge banque (mode banque uniquement) */}
      {isBankMode && (
        <div className="dashboard-bank">
          <div className="dashboard-bank-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <TokenCoin size={14} /> Ma banque
            </span>
            <span className={bankRemaining <= tokenBank * 0.2 ? 'dashboard-bank-low' : ''}>
              {bankRemaining} / {tokenBank} jetons
            </span>
          </div>
          <div className="dashboard-bank-bar">
            <div
              className="dashboard-bank-fill"
              style={{ width: `${Math.max(0, (bankRemaining / tokenBank) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Alerte prochain match sans pari */}
      {nextUnbet && (
        <div
          className="dashboard-alert"
          onClick={() => navigate(`/tournament/${tournamentId}/match/${nextUnbet.id}`)}
        >
          <div className="dashboard-alert-left">
            <AlertCircle size={16} />
            <div>
              <div className="dashboard-alert-title">
                {nextUnbet.home_team} vs {nextUnbet.away_team}
              </div>
              <div className="dashboard-alert-sub">
                {formatDateShort(nextUnbet.kickoff)}
                {upcomingUnbet.length > 1 && (
                  <span style={{ marginLeft: 8, opacity: 0.7 }}>
                    +{upcomingUnbet.length - 1} autre{upcomingUnbet.length > 2 ? 's' : ''}
                  </span>
                )}
                {totalBudgetLeft > 0 && (
                  <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <TokenCoin size={11} /> {totalBudgetLeft} jetons disponibles
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="dashboard-alert-cta">
            Parier <ChevronRight size={14} />
          </div>
        </div>
      )}
    </div>
  );
}
