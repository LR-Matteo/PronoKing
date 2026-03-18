import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTournaments, fetchAllMembers, joinTournament } from '@/lib/db';
import { Button, PageTransition, EmptyState } from '@/components/ui/Components';
import TournamentCard from '@/components/tournaments/TournamentCard';
import CreateTournamentModal from '@/components/tournaments/CreateTournamentModal';
import JoinTournamentModal from '@/components/tournaments/JoinTournamentModal';

export default function TournamentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [members, setMembers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [joinTarget, setJoinTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [t, m] = await Promise.all([fetchTournaments(), fetchAllMembers()]);
      setTournaments(t);
      setMembers(m);
    } catch {
      // erreur silencieuse — la liste reste vide
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const isMember = (tId) => members.some((m) => m.tournament_id === tId && m.user_id === user.id);
  const memberCount = (tId) => members.filter((m) => m.tournament_id === tId).length;

  const handleClick = (t) => {
    if (isMember(t.id)) {
      navigate(`/tournament/${t.id}`);
    } else {
      setJoinTarget(t);
    }
  };

  const handleJoin = async (t) => {
    await joinTournament(t.id, user.id);
    setJoinTarget(null);
    load();
    navigate(`/tournament/${t.id}`);
  };

  return (
    <PageTransition>
      <div className="page-header flex-between">
        <div>
          <h1>Tournois</h1>
          <p className="subtitle">Rejoignez un tournoi ou créez le vôtre</p>
        </div>
        <Button variant="gold" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Créer
        </Button>
      </div>

      {loading ? (
        <EmptyState description="Chargement..." />
      ) : tournaments.length === 0 ? (
        <EmptyState
          icon={<Trophy size={48} />}
          title="Aucun tournoi"
          description="Créez votre premier tournoi de pronostics !"
        />
      ) : (
        <div className="grid-2">
          {tournaments.map((t) => (
            <TournamentCard
              key={t.id}
              tournament={t}
              memberCount={memberCount(t.id)}
              isMember={isMember(t.id)}
              isAdmin={t.admin_id === user.id}
              onClick={() => handleClick(t)}
            />
          ))}
        </div>
      )}

      <CreateTournamentModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); load(); }}
      />

      <JoinTournamentModal
        open={!!joinTarget}
        tournament={joinTarget}
        memberCount={joinTarget ? memberCount(joinTarget.id) : 0}
        onClose={() => setJoinTarget(null)}
        onJoin={handleJoin}
      />
    </PageTransition>
  );
}
