import { useState } from 'react';
import { Lock, Users } from 'lucide-react';
import { Modal, Button, Message, TokenCoin } from '@/components/ui/Components';

export default function JoinTournamentModal({ open, tournament, memberCount, onClose, onJoin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!tournament) return null;

  const isFull = tournament.max_members !== null && memberCount >= tournament.max_members;
  const isLocked = tournament.is_locked;
  const isBlocked = isFull || isLocked;

  const handleJoin = () => {
    if (tournament.is_private) {
      if (password !== tournament.password) {
        setError('Mot de passe incorrect');
        return;
      }
    }
    setError('');
    setPassword('');
    onJoin(tournament);
  };

  const handleClose = () => {
    setError('');
    setPassword('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title={`Rejoindre "${tournament.name}"`}>
      {/* Infos du tournoi */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13 }}>
          <Users size={14} />
          {memberCount}{tournament.max_members ? ` / ${tournament.max_members}` : ''} joueur{memberCount > 1 ? 's' : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13 }}>
          <TokenCoin size={14} />
          {tournament.tokens_per_match} jetons / match
        </div>
        {tournament.is_private && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13 }}>
            <Lock size={14} /> Privé
          </div>
        )}
      </div>

      {tournament.description && (
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
          {tournament.description}
        </p>
      )}

      {/* Blocages */}
      {isLocked && (
        <Message type="error">Ce tournoi est verrouillé par l'administrateur. Les inscriptions sont fermées.</Message>
      )}
      {!isLocked && isFull && (
        <Message type="error">Ce tournoi est complet ({tournament.max_members} participants maximum).</Message>
      )}

      {/* Mot de passe si privé et non bloqué */}
      {!isBlocked && tournament.is_private && (
        <>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 12 }}>
            Ce tournoi est privé. Entrez le mot de passe pour rejoindre.
          </p>
          <Message type="error">{error}</Message>
          <div className="input-group">
            <label>Mot de passe</label>
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe du tournoi"
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
          </div>
        </>
      )}

      {!isBlocked && !tournament.is_private && (
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
          Voulez-vous rejoindre ce tournoi ?
        </p>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        {!isBlocked && (
          <Button variant="gold" onClick={handleJoin}>Rejoindre</Button>
        )}
        <Button variant="ghost" onClick={handleClose}>
          {isBlocked ? 'Fermer' : 'Annuler'}
        </Button>
      </div>
    </Modal>
  );
}
