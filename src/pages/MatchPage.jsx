import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Check, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useMatchData } from '@/hooks/useMatchData';
import { fetchMatches, fetchBetsByUser } from '@/lib/db';
import { isMatchStarted, isMatchUpcoming, formatDate } from '@/lib/utils';
import { Button, Badge, PageTransition, EmptyState } from '@/components/ui/Components';
import TeamLogo from '@/components/ui/TeamLogo';
import BettingPanel from '@/components/betting/BettingPanel';
import AddMarketModal from '@/components/betting/AddMarketModal';
import ValidateMatchModal from '@/components/betting/ValidateMatchModal';

export default function MatchPage() {
  const { tournamentId, matchId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { match, tournament, markets, marketOptions, bets, loading, reload } = useMatchData(matchId, tournamentId);
  const { addToast } = useToast();
  const [showAddMarket, setShowAddMarket] = useState(false);
  const [showValidate, setShowValidate] = useState(false);
  const [allTournamentBets, setAllTournamentBets] = useState([]);

  // In bank mode, load all user bets across the tournament for budget calculation
  useEffect(() => {
    if (!tournament || !user) return;
    if (tournament.token_mode !== 'bank') return;
    fetchMatches(tournament.id)
      .then((matches) => fetchBetsByUser(user.id, matches.map((m) => m.id)))
      .then(setAllTournamentBets)
      .catch(() => {});
  }, [tournament?.id, tournament?.token_mode, user?.id]);

  // Notification quand le match passe à "terminé"
  const prevFinishedRef = useRef(null);
  useEffect(() => {
    if (!match) return;
    if (prevFinishedRef.current === null) {
      prevFinishedRef.current = match.is_finished;
      return;
    }
    if (!prevFinishedRef.current && match.is_finished) {
      const myBets = bets.filter((b) => b.user_id === user.id);
      const myPoints = myBets.reduce((s, b) => s + (parseFloat(b.points_won) || 0), 0);
      if (myPoints > 0) {
        addToast(`🏆 Résultat validé — tu remportes ${myPoints.toFixed(1)} pts !`, 'success', 6000);
      } else {
        addToast(`⚽ Résultat validé — ${match.home_team} ${match.home_score}-${match.away_score} ${match.away_team}`, 'info');
      }
    }
    prevFinishedRef.current = match.is_finished;
  }, [match?.is_finished]);

  if (loading) return <EmptyState description="Chargement..." />;
  if (!match) return <EmptyState description="Match introuvable" />;

  const isAdmin = tournament?.admin_id === user.id;

  return (
    <PageTransition>
      <Button
        variant="ghost"
        onClick={() => navigate(`/tournament/${tournamentId}`)}
        style={{ marginBottom: 16 }}
      >
        <ChevronLeft size={16} /> Retour au tournoi
      </Button>

      {/* Match header card */}
      <div className="card" style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          {match.is_finished ? (
            <Badge color="red">Terminé</Badge>
          ) : isMatchStarted(match.kickoff) ? (
            <Badge color="green">En cours</Badge>
          ) : (
            <Badge color="blue">À venir — {formatDate(match.kickoff)}</Badge>
          )}
        </div>

        <div className="match-teams" style={{ marginBottom: 0 }}>
          <div className="match-team">
            <TeamLogo name={match.home_team} size={52} />
            <div className="match-team-name match-team-name-lg">{match.home_team}</div>
          </div>
          {match.is_finished || match.home_score !== null ? (
            <div className="match-score match-score-lg">{match.home_score} - {match.away_score}</div>
          ) : (
            <div className="match-vs match-vs-lg">VS</div>
          )}
          <div className="match-team">
            <TeamLogo name={match.away_team} size={52} />
            <div className="match-team-name match-team-name-lg">{match.away_team}</div>
          </div>
        </div>
      </div>

      {/* Admin controls */}
      {isAdmin && (
        <div className="admin-section">
          <h3><Settings size={16} /> Administration du match</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button variant="outline" size="sm" onClick={() => setShowAddMarket(true)}>
              <Plus size={14} /> Ajouter un marché
            </Button>
            {!match.is_finished && (
              <Button variant="gold" size="sm" onClick={() => setShowValidate(true)}>
                <Check size={14} /> Valider le résultat
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Betting panel or empty state */}
      {markets.length === 0 ? (
        <EmptyState
          description="Aucun marché de paris pour ce match"
        >
          {isAdmin && (
            <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)' }}>
              Ajoutez des marchés via le panneau d'administration ci-dessus
            </p>
          )}
        </EmptyState>
      ) : (
        <BettingPanel
          match={match}
          tournament={tournament}
          markets={markets}
          marketOptions={marketOptions}
          bets={bets}
          allTournamentBets={allTournamentBets}
          onBetsUpdated={() => {
            reload();
            // Refresh tournament-wide bets after saving
            if (tournament?.token_mode === 'bank') {
              fetchMatches(tournament.id)
                .then((matches) => fetchBetsByUser(user.id, matches.map((m) => m.id)))
                .then(setAllTournamentBets)
                .catch(() => {});
            }
          }}
        />
      )}

      {/* Modals */}
      <AddMarketModal
        open={showAddMarket}
        matchId={matchId}
        onClose={() => setShowAddMarket(false)}
        onAdded={() => { setShowAddMarket(false); reload(); }}
      />

      <ValidateMatchModal
        open={showValidate}
        match={match}
        markets={markets}
        marketOptions={marketOptions}
        bets={bets}
        onClose={() => setShowValidate(false)}
        onValidated={() => { setShowValidate(false); reload(); }}
      />
    </PageTransition>
  );
}
