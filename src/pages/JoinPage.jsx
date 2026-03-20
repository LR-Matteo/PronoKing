import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import '@/styles/components/join.css';
import { Users, Lock, Trophy, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTournament, fetchTournamentMembers, joinTournament } from '@/lib/db';
import { Button, Message, TokenCoin, PageTransition } from '@/components/ui/Components';

export default function JoinPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Mot de passe éventuellement pré-rempli depuis le lien
  const encodedPwd = searchParams.get('p');
  const prefilledPwd = encodedPwd ? atob(encodedPwd) : null;

  useEffect(() => {
    async function load() {
      try {
        const [t, members] = await Promise.all([
          fetchTournament(id),
          fetchTournamentMembers(id),
        ]);
        setTournament(t);
        setMemberCount(members.length);

        // Déjà membre → redirect direct
        if (user && members.some((m) => m.user_id === user.id)) {
          navigate(`/tournament/${id}`, { replace: true });
          return;
        }
      } catch {
        setError('Tournoi introuvable ou lien invalide.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, user, navigate]);

  const handleJoin = async () => {
    if (!user) {
      // Sauvegarder la destination et rediriger vers login
      sessionStorage.setItem('pronoking_redirect', `/join/${id}${window.location.search}`);
      navigate('/login');
      return;
    }

    const pwd = prefilledPwd ?? password;
    if (tournament.is_private && pwd !== tournament.password) {
      setError('Mot de passe incorrect');
      return;
    }

    setJoining(true);
    setError('');
    try {
      await joinTournament(id, user.id);
      setSuccess(true);
      setTimeout(() => navigate(`/tournament/${id}`), 1200);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'inscription');
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="field-pattern" />
        <div className="auth-page">
          <div className="auth-card fade-in" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            Chargement...
          </div>
        </div>
      </div>
    );
  }

  const isFull = tournament?.max_members && memberCount >= tournament.max_members;
  const isLocked = tournament?.is_locked;
  const isBlocked = isFull || isLocked;
  const needsPassword = tournament?.is_private && !prefilledPwd;

  return (
    <div className="app-container">
      <div className="field-pattern" />
      <div className="auth-page">
        <div className="auth-card fade-in">

          {/* Header */}
          <div className="auth-logo" style={{ marginBottom: 8 }}>
            <Trophy size={36} color="var(--accent-gold)" />
            <h2 style={{ marginTop: 8 }}>Invitation au tournoi</h2>
          </div>

          {error && !tournament ? (
            <>
              <Message type="error">{error}</Message>
              <Button variant="ghost" onClick={() => navigate('/')} style={{ width: '100%', marginTop: 8 }}>
                <ChevronLeft size={16} /> Retour
              </Button>
            </>
          ) : tournament ? (
            <>
              {/* Infos tournoi */}
              <div className="join-tournament-card">
                <div className="join-tournament-name">{tournament.name}</div>
                {tournament.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '6px 0 0' }}>
                    {tournament.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                  <span className="join-tournament-meta">
                    <Users size={13} />
                    {memberCount}{tournament.max_members ? ` / ${tournament.max_members}` : ''} joueur{memberCount > 1 ? 's' : ''}
                  </span>
                  <span className="join-tournament-meta">
                    <TokenCoin size={13} />
                    {tournament.token_mode === 'bank'
                      ? `${tournament.token_bank} jetons`
                      : `${tournament.tokens_per_match} jetons/match`}
                  </span>
                  {tournament.is_private && (
                    <span className="join-tournament-meta">
                      <Lock size={13} /> Privé
                    </span>
                  )}
                </div>
              </div>

              {/* États bloquants */}
              {isLocked && <Message type="error">Ce tournoi est verrouillé — inscriptions fermées.</Message>}
              {!isLocked && isFull && <Message type="error">Ce tournoi est complet ({tournament.max_members} participants).</Message>}

              {/* Mot de passe manuel si privé sans lien pré-rempli */}
              {!isBlocked && needsPassword && (
                <div className="input-group" style={{ marginTop: 8 }}>
                  <label>Mot de passe du tournoi</label>
                  <input
                    className="input-field"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mot de passe"
                    onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  />
                </div>
              )}

              {error && <Message type="error">{error}</Message>}

              {success && (
                <div style={{ color: 'var(--accent-green)', fontSize: 14, textAlign: 'center', marginBottom: 8 }}>
                  Inscrit ! Redirection...
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                {!isBlocked && !success && (
                  <Button variant="gold" onClick={handleJoin} disabled={joining} style={{ flex: 1 }}>
                    {joining ? 'Inscription...' : user ? 'Rejoindre' : 'Se connecter pour rejoindre'}
                  </Button>
                )}
                {user && (
                  <Button variant="ghost" onClick={() => navigate('/')}>
                    <ChevronLeft size={14} />
                  </Button>
                )}
              </div>

              {!user && (
                <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', marginTop: 10 }}>
                  Tu seras redirigé vers la connexion, puis automatiquement inscrit au tournoi.
                </p>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
