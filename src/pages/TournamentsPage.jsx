import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trophy, Compass } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTournaments, fetchMembersByUser, fetchMemberCounts, fetchAllMembers, joinTournament } from '@/lib/db';
import { Button, PageTransition, EmptyState } from '@/components/ui/Components';
import TournamentCard from '@/components/tournaments/TournamentCard';
import CreateTournamentModal from '@/components/tournaments/CreateTournamentModal';
import JoinTournamentModal from '@/components/tournaments/JoinTournamentModal';

const CACHE_KEY_T = 'pronoking_tournaments';

function readTCache(userId) {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY_T));
    return c?.userId === userId ? c : null;
  } catch { return null; }
}
function writeTCache(userId, tournaments, members, memberCounts) {
  try {
    localStorage.setItem(CACHE_KEY_T, JSON.stringify({ userId, tournaments, members, memberCounts }));
  } catch {}
}

export default function TournamentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Cache synchrone → pas d'écran de chargement au retour sur la page
  const cachedRef = useRef(readTCache(user.id));
  const cached = cachedRef.current;
  const [tournaments, setTournaments] = useState(cached?.tournaments || []);
  const [userMembers, setUserMembers] = useState(cached?.members || []);
  const [memberCounts, setMemberCounts] = useState(cached?.memberCounts || []);
  const [allMembers, setAllMembers] = useState(null);
  const [tab, setTab] = useState('mine');
  const [showCreate, setShowCreate] = useState(false);
  const [joinTarget, setJoinTarget] = useState(null);
  const [loading, setLoading] = useState(!cached);
  const [loadError, setLoadError] = useState(false);

  // Chargement réseau — silencieux si le cache a déjà fourni des données
  // Promise.race garantit qu'on ne reste jamais bloqué > 8s (ex. refresh token mobile)
  const load = useCallback(async () => {
    setLoadError(false);
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000));
    try {
      const [t, m, counts] = await Promise.race([
        Promise.all([fetchTournaments(), fetchMembersByUser(user.id), fetchMemberCounts()]),
        timeout,
      ]);
      setTournaments(t);
      setUserMembers(m);
      setMemberCounts(counts);
      writeTCache(user.id, t, m, counts);
      cachedRef.current = { userId: user.id, tournaments: t, members: m, memberCounts: counts };
    } catch {
      if (!cachedRef.current) setLoadError(true);
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
    // memberCounts est chargé dès le départ (requête légère, juste tournament_id)
    // allMembers est chargé uniquement si l'onglet Découvrir est ouvert
    const source = allMembers || memberCounts;
    const map = new Map();
    for (const m of source) map.set(m.tournament_id, (map.get(m.tournament_id) || 0) + 1);
    return map;
  }, [allMembers, memberCounts]);

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
      ) : loadError ? (
        <EmptyState
          title="Erreur de connexion"
          description="Impossible de charger les tournois. Vérifie ta connexion internet."
        >
          <Button variant="gold" onClick={load} style={{ marginTop: 16 }}>
            Réessayer
          </Button>
        </EmptyState>
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
