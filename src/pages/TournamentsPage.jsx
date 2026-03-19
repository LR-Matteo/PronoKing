import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trophy, Compass } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTournaments, fetchMembersByUser, fetchAllMembers, joinTournament } from '@/lib/db';
import { Button, PageTransition, EmptyState } from '@/components/ui/Components';
import TournamentCard from '@/components/tournaments/TournamentCard';
import CreateTournamentModal from '@/components/tournaments/CreateTournamentModal';
import JoinTournamentModal from '@/components/tournaments/JoinTournamentModal';

export default function TournamentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [userMembers, setUserMembers] = useState([]); // membres de l'utilisateur uniquement
  const [allMembers, setAllMembers] = useState(null);  // null = pas encore chargé
  const [tab, setTab] = useState('mine');
  const [showCreate, setShowCreate] = useState(false);
  const [joinTarget, setJoinTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  // Chargement initial rapide : seulement les tournois + memberships de l'utilisateur
  const load = useCallback(async () => {
    try {
      const [t, m] = await Promise.all([fetchTournaments(), fetchMembersByUser(user.id)]);
      setTournaments(t);
      setUserMembers(m);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  // Chargement différé des counts pour l'onglet Découvrir
  useEffect(() => {
    if (tab === 'discover' && allMembers === null) {
      fetchAllMembers().then(setAllMembers).catch(() => setAllMembers([]));
    }
  }, [tab, allMembers]);

  // Index pré-calculés O(1)
  const membershipSet = useMemo(
    () => new Set(userMembers.map((m) => m.tournament_id)),
    [userMembers]
  );
  const memberCountMap = useMemo(() => {
    const map = new Map();
    for (const m of (allMembers || [])) map.set(m.tournament_id, (map.get(m.tournament_id) || 0) + 1);
    return map;
  }, [allMembers]);

  const myTournaments = useMemo(
    () => tournaments.filter((t) => membershipSet.has(t.id)),
    [tournaments, membershipSet]
  );
  const discoverTournaments = useMemo(
    () => tournaments.filter((t) => !membershipSet.has(t.id)),
    [tournaments, membershipSet]
  );

  const handleJoin = async (t) => {
    await joinTournament(t.id, user.id);
    setJoinTarget(null);
    setAllMembers(null); // forcer le rechargement des counts
    load();
    navigate(`/tournament/${t.id}`);
  };

  const currentList = tab === 'mine' ? myTournaments : discoverTournaments;

  return (
    <PageTransition>
      <div className="page-header flex-between">
        <div>
          <h1>Tournois</h1>
          <p className="subtitle">
            {tab === 'mine' ? 'Vos tournois en cours' : 'Rejoignez un nouveau tournoi'}
          </p>
        </div>
        <Button variant="gold" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Créer
        </Button>
      </div>

      {/* Onglets */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button
          className={`tab ${tab === 'mine' ? 'active' : ''}`}
          onClick={() => setTab('mine')}
        >
          <Trophy size={14} />
          Mes tournois
          {!loading && myTournaments.length > 0 && (
            <span className="tab-count">({myTournaments.length})</span>
          )}
        </button>
        <button
          className={`tab ${tab === 'discover' ? 'active' : ''}`}
          onClick={() => setTab('discover')}
        >
          <Compass size={14} />
          Découvrir
          {!loading && discoverTournaments.length > 0 && (
            <span className="tab-count">({discoverTournaments.length})</span>
          )}
        </button>
      </div>

      {loading ? (
        <EmptyState description="Chargement..." />
      ) : currentList.length === 0 ? (
        tab === 'mine' ? (
          <EmptyState
            icon={<Trophy size={48} />}
            title="Aucun tournoi"
            description="Créez votre premier tournoi ou rejoignez-en un depuis l'onglet Découvrir !"
          >
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <Button variant="gold" onClick={() => setShowCreate(true)}>
                <Plus size={14} /> Créer un tournoi
              </Button>
              <Button variant="ghost" onClick={() => setTab('discover')}>
                <Compass size={14} /> Découvrir
              </Button>
            </div>
          </EmptyState>
        ) : (
          <EmptyState
            icon={<Compass size={48} />}
            title="Aucun tournoi disponible"
            description="Tous les tournois existants sont déjà les vôtres, ou créez-en un nouveau !"
          />
        )
      ) : (
        <div className="grid-2">
          {currentList.map((t) => (
            <TournamentCard
              key={t.id}
              tournament={t}
              memberCount={memberCountMap.get(t.id) || 0}
              isMember={tab === 'mine'}
              isAdmin={t.admin_id === user.id}
              onClick={() => {
                if (tab === 'mine') {
                  navigate(`/tournament/${t.id}`);
                } else {
                  setJoinTarget(t);
                }
              }}
            />
          ))}
        </div>
      )}

      <CreateTournamentModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(t) => { setShowCreate(false); load(); navigate(`/tournament/${t.id}`); }}
      />

      <JoinTournamentModal
        open={!!joinTarget}
        tournament={joinTarget}
        memberCount={joinTarget ? (memberCountMap.get(joinTarget.id) || 0) : 0}
        onClose={() => setJoinTarget(null)}
        onJoin={handleJoin}
      />
    </PageTransition>
  );
}
