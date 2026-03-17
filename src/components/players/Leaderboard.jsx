import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { classNames } from '@/lib/utils';

export default function Leaderboard({ members, profiles, bets, tournamentId }) {
  const navigate = useNavigate();

  const rankings = useMemo(() => {
    return members
      .map((m) => {
        const profile = profiles.find((p) => p.id === m.user_id);
        const points = bets
          .filter((b) => b.user_id === m.user_id)
          .reduce((sum, b) => sum + (parseFloat(b.points_won) || 0), 0);
        return { userId: m.user_id, username: profile?.username || '?', points };
      })
      .sort((a, b) => b.points - a.points);
  }, [members, profiles, bets]);

  const rankClass = (i) => {
    if (i === 0) return 'rank-1';
    if (i === 1) return 'rank-2';
    if (i === 2) return 'rank-3';
    return 'rank-default';
  };

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Trophy size={18} /> Classement
      </h3>

      {rankings.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Aucun joueur pour le moment</p>
      ) : (
        rankings.map((r, i) => (
          <div
            key={r.userId}
            className="leaderboard-row"
            onClick={() => navigate(`/tournament/${tournamentId}/player/${r.userId}`)}
          >
            <div className={classNames('leaderboard-rank', rankClass(i))}>
              {i + 1}
            </div>
            <span className="leaderboard-name">{r.username}</span>
            <span className="leaderboard-points">
              {r.points.toFixed(1)}
              <span className="leaderboard-pts-label">pts</span>
            </span>
          </div>
        ))
      )}
    </div>
  );
}
