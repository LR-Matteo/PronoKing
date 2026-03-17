import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Settings, Lock, Unlock, Trash2, Trophy, CalendarDays } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useTournamentData } from '@/hooks/useTournamentData';
import { isMatchUpcoming, isMatchStarted } from '@/lib/utils';
import { updateTournament, deleteTournament } from '@/lib/db';
import { Button, Badge, TokenCoin, PageTransition, EmptyState, Modal } from '@/components/ui/Components';
import Leaderboard from '@/components/players/Leaderboard';
import PlayerDashboard from '@/components/players/PlayerDashboard';
import MatchCard from '@/components/matches/MatchCard';
import AddMatchModal from '@/components/matches/AddMatchModal';

export default function TournamentPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tournament, matches, members, profiles, markets, marketOptions, bets, loading, reload } = useTournamentData(id);
  const { addToast } = useToast();

  const [mainTab, setMainTab] = useState('matches');
  const [matchTab, setMatchTab] = useState('upcoming');

  const [showAddMatch, setShowAddMatch] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Notifications Realtime — un seul effet pour éviter les désynchronisations
  const initializedRef = useRef(false);
  const prevMatchCountRef = useRef(0);
  const prevLockedRef = useRef(null);

  useEffect(() => {
    if (loading) return;

    // Premier passage : mémoriser l'état initial sans notifier
    if (!initializedRef.current) {
      initializedRef.current = true;
      prevMatchCountRef.current = matches.length;
      prevLockedRef.current = tournament?.is_locked;
      return;
    }

    // Nouveau match ajouté
    if (matches.length > prevMatchCountRef.current) {
      const newMatch = [...matches].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      addToast(`📅 Nouveau match : ${newMatch.home_team} vs ${newMatch.away_team}`, 'info');
    }
    prevMatchCountRef.current = matches.length;

    // Tournoi verrouillé / déverrouillé
    if (tournament?.is_locked !== prevLockedRef.current) {
      addToast(
        tournament.is_locked ? '🔒 Le tournoi a été verrouillé' : '🔓 Le tournoi est de nouveau ouvert',
        'warning'
      );
    }
    prevLockedRef.current = tournament?.is_locked;
  }, [loading, matches.length, tournament?.is_locked]);

  if (loading) return <EmptyState description="Chargement..." />;
  if (!tournament) return <EmptyState description="Tournoi introuvable" />;

  const isAdmin = tournament.admin_id === user.id;

  const upcomingMatches = useMemo(
    () => matches.filter((m) => !m.is_finished && isMatchUpcoming(m.kickoff)),
    [matches]
  );
  const startedMatches = useMemo(
    () => matches.filter((m) => !m.is_finished && isMatchStarted(m.kickoff)),
    [matches]
  );
  const finishedMatches = useMemo(
    () => matches.filter((m) => m.is_finished),
    [matches]
  );

  const matchSubTabs = useMemo(() => [
    { key: 'upcoming', label: 'À venir', count: upcomingMatches.length },
    { key: 'live', label: 'En cours', count: startedMatches.length },
    { key: 'finished', label: 'Terminés', count: finishedMatches.length },
  ], [upcomingMatches.length, startedMatches.length, finishedMatches.length]);

  const currentMatches =
    matchTab === 'upcoming' ? upcomingMatches :
    matchTab === 'live' ? startedMatches :
    finishedMatches;

  const handleToggleLock = async () => {
    setAdminLoading(true);
    try {
      await updateTournament(id, { is_locked: !tournament.is_locked });
      reload();
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDelete = async () => {
    setAdminLoading(true);
    setAdminError('');
    try {
      await deleteTournament(id);
      setShowDeleteConfirm(false);
      navigate('/');
    } catch (err) {
      setAdminError(err.message || 'Erreur lors de la suppression');
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <PageTransition>
      <Button variant="ghost" onClick={() => navigate('/')} style={{ marginBottom: 16 }}>
        <ChevronLeft size={16} /> Retour aux tournois
      </Button>

      {/* Header — toujours visible */}
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1>{tournament.name}</h1>
            {tournament.description && <p className="subtitle">{tournament.description}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {tournament.is_locked && <Badge color="red">Verrouillé</Badge>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13 }}>
              <TokenCoin size={18} />
              {tournament.token_mode === 'bank'
                ? `${tournament.token_bank} jetons (banque)`
                : `${tournament.tokens_per_match} jetons/match`}
            </div>
          </div>
        </div>
      </div>

      {/* Onglets principaux */}
      <div className="main-tabs">
        <button
          className={`main-tab ${mainTab === 'matches' ? 'active' : ''}`}
          onClick={() => setMainTab('matches')}
        >
          <CalendarDays size={16} />
          Matchs
          {startedMatches.length > 0 && (
            <span className="main-tab-badge">{startedMatches.length}</span>
          )}
        </button>
        <button
          className={`main-tab ${mainTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setMainTab('leaderboard')}
        >
          <Trophy size={16} />
          Classement
        </button>
      </div>

      {/* ===== ONGLET MATCHS ===== */}
      {mainTab === 'matches' && (
        <>
          {/* Dashboard joueur */}
          <PlayerDashboard
            userId={user.id}
            tournamentId={id}
            tournament={tournament}
            matches={matches}
            members={members}
            profiles={profiles}
            bets={bets}
          />

          {/* Admin controls */}
          {isAdmin && (
            <div className="admin-section">
              <h3><Settings size={16} /> Administration</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button variant="gold" size="sm" onClick={() => setShowAddMatch(true)}>
                  <Plus size={14} /> Ajouter un match
                </Button>
                <Button variant="ghost" size="sm" onClick={handleToggleLock} disabled={adminLoading}>
                  {tournament.is_locked
                    ? <><Unlock size={14} /> Déverrouiller</>
                    : <><Lock size={14} /> Verrouiller</>}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{ color: 'var(--accent-red)' }}
                >
                  <Trash2 size={14} /> Supprimer le tournoi
                </Button>
              </div>
            </div>
          )}

          {/* Sous-onglets matchs */}
          <div className="tabs">
            {matchSubTabs.map((t) => (
              <button
                key={t.key}
                className={`tab ${matchTab === t.key ? 'active' : ''}`}
                onClick={() => setMatchTab(t.key)}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>

          {/* Liste des matchs */}
          <div className="flex-col gap-16">
            {currentMatches.length === 0 ? (
              <EmptyState description={`Aucun match ${matchTab === 'upcoming' ? 'à venir' : matchTab === 'live' ? 'en cours' : 'terminé'}`} />
            ) : (
              currentMatches.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  userId={user.id}
                  bets={bets}
                  markets={markets}
                  onClick={() => navigate(`/tournament/${id}/match/${m.id}`)}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* ===== ONGLET CLASSEMENT ===== */}
      {mainTab === 'leaderboard' && (
        <Leaderboard
          members={members}
          profiles={profiles}
          bets={bets}
          tournamentId={id}
        />
      )}

      <AddMatchModal
        open={showAddMatch}
        tournamentId={id}
        onClose={() => setShowAddMatch(false)}
        onAdded={() => { setShowAddMatch(false); reload(); }}
      />

      {/* Modale confirmation suppression */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setAdminError(''); }}
        title="Supprimer le tournoi"
      >
        <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
          Êtes-vous sûr de vouloir supprimer <strong style={{ color: 'var(--text-primary)' }}>{tournament.name}</strong> ?
        </p>
        <p style={{ color: 'var(--accent-red)', fontSize: 13, marginBottom: 20 }}>
          Cette action est irréversible. Tous les matchs, marchés et paris associés seront supprimés.
        </p>
        {adminError && (
          <p style={{ color: 'var(--accent-red)', fontSize: 13, marginBottom: 12, background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 6 }}>
            Erreur : {adminError}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12 }}>
          <Button
            variant="gold"
            onClick={handleDelete}
            disabled={adminLoading}
            style={{ background: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}
          >
            <Trash2 size={14} /> {adminLoading ? 'Suppression...' : 'Supprimer définitivement'}
          </Button>
          <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
        </div>
      </Modal>
    </PageTransition>
  );
}
