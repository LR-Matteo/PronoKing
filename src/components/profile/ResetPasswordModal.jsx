import { useState } from 'react';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { Modal, Button, Message } from '@/components/ui/Components';
import { generateTempPassword, hashPassword } from '@/lib/crypto';
import { updateProfile } from '@/lib/db';
import UserAvatar from '@/components/ui/UserAvatar';

export default function ResetPasswordModal({ open, members, profiles, onClose }) {
  const [selectedId, setSelectedId] = useState('');
  const [tempCode, setTempCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!selectedId) { setError('Sélectionne un joueur'); return; }
    setError('');
    setLoading(true);
    try {
      const code = generateTempPassword();
      const hash = await hashPassword(code);
      await updateProfile(selectedId, { password_hash: hash });
      setTempCode(code);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tempCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setSelectedId('');
    setTempCode('');
    setCopied(false);
    setError('');
    onClose();
  };

  const selectedProfile = profiles.find((p) => p.id === selectedId);

  return (
    <Modal open={open} onClose={handleClose} title="Réinitialiser un mot de passe">
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
        Génère un code temporaire pour un joueur. Il pourra ensuite le changer depuis son profil.
      </p>

      {/* Sélection du joueur */}
      <div className="input-group">
        <label>Joueur</label>
        <div className="member-select-list">
          {members.map((m) => {
            const profile = profiles.find((p) => p.id === m.user_id);
            if (!profile) return null;
            return (
              <button
                key={m.user_id}
                type="button"
                className={`member-select-item ${selectedId === m.user_id ? 'active' : ''}`}
                onClick={() => { setSelectedId(m.user_id); setTempCode(''); }}
              >
                <UserAvatar user={profile} size={28} />
                <span>{profile.username}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Message type="error">{error}</Message>

      <Button
        variant="gold"
        onClick={handleGenerate}
        disabled={loading || !selectedId}
        style={{ marginBottom: tempCode ? 16 : 0 }}
      >
        <RefreshCw size={14} />
        {loading ? 'Génération...' : 'Générer un code temporaire'}
      </Button>

      {/* Affichage du code généré */}
      {tempCode && (
        <div className="temp-code-box">
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              Code temporaire pour <strong>{selectedProfile?.username}</strong>
            </div>
            <div className="temp-code-value">{tempCode}</div>
          </div>
          <button className="temp-code-copy" onClick={handleCopy} title="Copier">
            {copied ? <Check size={16} color="var(--accent-green)" /> : <Copy size={16} />}
          </button>
        </div>
      )}

      {tempCode && (
        <p style={{ fontSize: 12, color: 'var(--accent-gold)', marginTop: 10 }}>
          ⚠️ Note ce code maintenant — il ne sera plus affiché après la fermeture.
        </p>
      )}

      <div style={{ marginTop: 16 }}>
        <Button variant="ghost" onClick={handleClose}>Fermer</Button>
      </div>
    </Modal>
  );
}
