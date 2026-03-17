import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Modal, Button, Message } from '@/components/ui/Components';
import UserAvatar from '@/components/ui/UserAvatar';

const AVATARS = [
  '🦁', '🐯', '🦊', '🐺', '🦅', '🦋',
  '🐬', '🦈', '🐉', '🦄', '🦝', '🦩',
  '⚡', '🔥', '⭐', '🌙', '🌊', '💎',
  '👑', '🎯', '🚀', '⚽', '🏆', '🎮',
  '🎸', '🌈', '🍀', '❄️', '🌺', '🎭',
];

export default function ProfileModal({ open, onClose }) {
  const { user, updateUser } = useAuth();
  const [selected, setSelected] = useState(user?.avatar || null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUser({ avatar: selected });
      setMsg('Profil mis à jour !');
      setTimeout(() => { setMsg(''); onClose(); }, 1200);
    } catch (err) {
      setMsg(err.message);
    }
    setSaving(false);
  };

  const handleClose = () => {
    setSelected(user?.avatar || null);
    setMsg('');
    onClose();
  };

  if (!user) return null;

  return (
    <Modal open={open} onClose={handleClose} title="Mon profil">
      {/* Avatar actuel */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <UserAvatar user={{ ...user, avatar: selected }} size={72} />
        <div style={{ fontFamily: 'Oswald', fontSize: 20, fontWeight: 600 }}>{user.username}</div>
      </div>

      {/* Grille de choix */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
          Choisissez votre avatar
        </div>
        <div className="avatar-picker-grid">
          {AVATARS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={`avatar-picker-item ${selected === emoji ? 'active' : ''}`}
              onClick={() => setSelected(emoji)}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <div style={{ fontSize: 13, color: 'var(--accent-green)', marginBottom: 12, textAlign: 'center' }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <Button variant="gold" onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
        <Button variant="ghost" onClick={handleClose}>Annuler</Button>
      </div>
    </Modal>
  );
}
