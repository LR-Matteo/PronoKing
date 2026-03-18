import { Clock } from 'lucide-react';
import { Badge, TokenCoin } from '@/components/ui/Components';
import TeamLogo from '@/components/ui/TeamLogo';
import { formatDateShort, isMatchStarted, isMatchUpcoming } from '@/lib/utils';

export default function MatchCard({ match, userBets = [], matchMarkets = [], onClick }) {
  const hasBet = userBets.length > 0;
  const totalTokens = userBets.reduce((s, b) => s + b.tokens, 0);
  const totalPoints = userBets.reduce((s, b) => s + (parseFloat(b.points_won) || 0), 0);

  return (
    <div className="match-card card-hover" style={{ cursor: 'pointer' }} onClick={onClick}>
      <div className="match-card-header">
        <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={12} /> {formatDateShort(match.kickoff)}
        </span>
        {match.is_finished ? (
          <Badge color="red">Terminé</Badge>
        ) : isMatchStarted(match.kickoff) ? (
          <Badge color="green">En cours</Badge>
        ) : (
          <Badge color="blue">À venir</Badge>
        )}
      </div>

      <div className="match-card-body">
        <div className="match-teams">
          <div className="match-team">
            <TeamLogo name={match.home_team} size={36} />
            <div className="match-team-name">{match.home_team}</div>
          </div>
          {match.is_finished || (match.home_score !== null && match.away_score !== null) ? (
            <div className="match-score">{match.home_score} - {match.away_score}</div>
          ) : (
            <div className="match-vs">VS</div>
          )}
          <div className="match-team">
            <TeamLogo name={match.away_team} size={36} />
            <div className="match-team-name">{match.away_team}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {matchMarkets.length} marché{matchMarkets.length > 1 ? 's' : ''}
          </div>

          {hasBet && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <TokenCoin size={14} /> {totalTokens} misés
              </span>
              {match.is_finished && (
                <span style={{
                  fontSize: 14,
                  fontFamily: 'Oswald',
                  fontWeight: 600,
                  color: totalPoints > 0 ? 'var(--accent-green)' : 'var(--text-muted)',
                }}>
                  +{totalPoints.toFixed(1)} pts
                </span>
              )}
            </div>
          )}

          {!hasBet && !match.is_finished && isMatchUpcoming(match.kickoff) && (
            <Badge color="gold">Parier →</Badge>
          )}
        </div>
      </div>
    </div>
  );
}
