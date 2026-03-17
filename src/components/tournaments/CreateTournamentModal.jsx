import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createTournament, joinTournament } from '@/lib/db';
import { Modal, Button, Message } from '@/components/ui/Components';

export default function CreateTournamentModal({ open, onClose, onCreated }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [maxMembers, setMaxMembers] = useState('');

  // Token system
  const [tokenMode, setTokenMode] = useState('per_match');
  const [tokensPerMatch, setTokensPerMatch] = useState(10);
  const [tokenBank, setTokenBank] = useState(100);
  const [maxTokensPerMatch, setMaxTokensPerMatch] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) { setError('Le nom est requis'); return; }
    if (isPrivate && !password.trim()) { setError('Le mot de passe est requis pour un tournoi privé'); return; }
    if (maxMembers !== '' && (isNaN(maxMembers) || parseInt(maxMembers) < 2)) {
      setError('Le nombre max de participants doit être au moins 2');
      return;
    }
    if (tokenMode === 'per_match' && (!tokensPerMatch || tokensPerMatch < 1)) {
      setError('Le nombre de jetons par match doit être au moins 1');
      return;
    }
    if (tokenMode === 'bank' && (!tokenBank || tokenBank < 1)) {
      setError('La banque de jetons doit être au moins 1');
      return;
    }
    if (tokenMode === 'bank' && maxTokensPerMatch !== '' && (isNaN(maxTokensPerMatch) || parseInt(maxTokensPerMatch) < 1)) {
      setError('Le plafond par match doit être au moins 1');
      return;
    }

    setLoading(true);
    try {
      const t = await createTournament({
        name: name.trim(),
        description: description.trim() || null,
        is_private: isPrivate,
        password: isPrivate ? password : null,
        token_mode: tokenMode,
        tokens_per_match: tokenMode === 'per_match' ? tokensPerMatch : null,
        token_bank: tokenMode === 'bank' ? tokenBank : null,
        max_tokens_per_match: tokenMode === 'bank' && maxTokensPerMatch !== '' ? parseInt(maxTokensPerMatch) : null,
        max_members: maxMembers !== '' ? parseInt(maxMembers) : null,
        is_locked: false,
        admin_id: user.id,
      });
      await joinTournament(t.id, user.id);
      onCreated(t);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setIsPrivate(false);
    setPassword('');
    setMaxMembers('');
    setTokenMode('per_match');
    setTokensPerMatch(10);
    setTokenBank(100);
    setMaxTokensPerMatch('');
    setError('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Créer un tournoi">
      <Message type="error">{error}</Message>

      <div className="input-group">
        <label>Nom du tournoi</label>
        <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Euro 2026" />
      </div>

      <div className="input-group">
        <label>Description (optionnel)</label>
        <input className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Décrivez votre tournoi..." />
      </div>

      {/* Token mode selector */}
      <div className="input-group">
        <label>Système de jetons</label>
        <div className="token-mode-toggle">
          <button
            type="button"
            className={`token-mode-btn ${tokenMode === 'per_match' ? 'active' : ''}`}
            onClick={() => setTokenMode('per_match')}
          >
            Par match
          </button>
          <button
            type="button"
            className={`token-mode-btn ${tokenMode === 'bank' ? 'active' : ''}`}
            onClick={() => setTokenMode('bank')}
          >
            Banque unique
          </button>
        </div>
        <p className="input-hint">
          {tokenMode === 'per_match'
            ? 'Chaque joueur reçoit un budget fixe de jetons à chaque match (renouvelable).'
            : 'Chaque joueur dispose d\'une banque unique pour tout le tournoi (non renouvelable).'}
        </p>
      </div>

      {tokenMode === 'per_match' ? (
        <div className="input-group">
          <label>Jetons par match</label>
          <input
            className="input-field"
            type="number"
            min="1"
            max="100"
            value={tokensPerMatch}
            onChange={(e) => setTokensPerMatch(parseInt(e.target.value) || 10)}
          />
        </div>
      ) : (
        <>
          <div className="input-group">
            <label>Banque initiale de jetons</label>
            <input
              className="input-field"
              type="number"
              min="1"
              value={tokenBank}
              onChange={(e) => setTokenBank(parseInt(e.target.value) || 100)}
            />
          </div>
          <div className="input-group">
            <label>Plafond de jetons par match (optionnel)</label>
            <input
              className="input-field"
              type="number"
              min="1"
              value={maxTokensPerMatch}
              onChange={(e) => setMaxTokensPerMatch(e.target.value)}
              placeholder="Illimité"
            />
            <p className="input-hint">Limite les all-in sur un seul match.</p>
          </div>
        </>
      )}

      <div className="input-group">
        <label>Nombre max de participants (optionnel)</label>
        <input
          className="input-field"
          type="number"
          min="2"
          value={maxMembers}
          onChange={(e) => setMaxMembers(e.target.value)}
          placeholder="Illimité"
        />
      </div>

      <div className="input-group">
        <label className="checkbox-wrap">
          <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
          Tournoi privé (mot de passe requis)
        </label>
      </div>

      {isPrivate && (
        <div className="input-group">
          <label>Mot de passe du tournoi</label>
          <input
            className="input-field"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe pour rejoindre"
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <Button variant="gold" onClick={handleCreate} disabled={loading}>
          {loading ? 'Création...' : 'Créer le tournoi'}
        </Button>
        <Button variant="ghost" onClick={handleClose}>Annuler</Button>
      </div>
    </Modal>
  );
}
