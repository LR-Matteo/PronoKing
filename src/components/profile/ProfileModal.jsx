import { useState, useRef } from 'react';
import { Upload, X, KeyRound, ChevronDown } from 'lucide-react';
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

function resizeImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 160;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfileModal({ open, onClose }) {
  const { user, updateUser, changePassword } = useAuth();
  const [selected, setSelected] = useState(user?.avatar || null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const [showPwSection, setShowPwSection] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Veuillez choisir un fichier image.');
      return;
    }
    setError('');
    const base64 = await resizeImage(file);
    setSelected(base64);
    e.target.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateUser({ avatar: selected });
      setMsg('Profil mis à jour !');
      setTimeout(() => { setMsg(''); onClose(); }, 1200);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const handleClose = () => {
    setSelected(user?.avatar || null);
    setMsg('');
    setError('');
    setShowPwSection(false);
    setNewPw(''); setConfirmPw('');
    setPwMsg(''); setPwError('');
    onClose();
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (!newPw || !confirmPw) { setPwError('Tous les champs sont requis'); return; }
    if (newPw !== confirmPw) { setPwError('Les mots de passe ne correspondent pas'); return; }
    setPwSaving(true);
    try {
      await changePassword(newPw);
      setPwMsg('Mot de passe modifié !');
      setNewPw(''); setConfirmPw('');
      setTimeout(() => { setPwMsg(''); setShowPwSection(false); }, 2000);
    } catch (err) {
      setPwError(err.message);
    }
    setPwSaving(false);
  };

  if (!user) return null;

  return (
    <Modal open={open} onClose={handleClose} title="Mon profil">
      {/* Avatar actuel + upload */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{ position: 'relative' }}>
          <UserAvatar user={{ ...user, avatar: selected }} size={80} />
          {selected && (
            <button
              className="avatar-clear-btn"
              onClick={() => setSelected(null)}
              title="Supprimer l'avatar"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <div style={{ fontFamily: 'Oswald', fontSize: 20, fontWeight: 600 }}>{user.username}</div>

        <button
          className="avatar-upload-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={14} />
          Choisir une photo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      <div className="avatar-divider">
        <span>ou choisir un emoji</span>
      </div>

      <div className="avatar-picker-grid" style={{ marginBottom: 16 }}>
        {AVATARS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className={`avatar-picker-item ${selected === emoji ? 'active' : ''}`}
            onClick={() => setSelected(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>

      {error && <Message type="error">{error}</Message>}
      {msg && (
        <div style={{ fontSize: 13, color: 'var(--accent-green)', marginBottom: 12, textAlign: 'center' }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Button variant="gold" onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
        <Button variant="ghost" onClick={handleClose}>Annuler</Button>
      </div>

      {/* Section changement de mot de passe */}
      <button
        type="button"
        className="pw-section-toggle"
        onClick={() => setShowPwSection((v) => !v)}
      >
        <KeyRound size={14} />
        Changer mon mot de passe
        <ChevronDown size={14} style={{ marginLeft: 'auto', transform: showPwSection ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {showPwSection && (
        <div style={{ marginTop: 12 }}>
          <div className="input-group">
            <label>Nouveau mot de passe</label>
            <input className="input-field" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="6 caractères minimum" />
          </div>
          <div className="input-group">
            <label>Confirmer le nouveau mot de passe</label>
            <input className="input-field" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="••••••••" />
          </div>
          {pwError && <Message type="error">{pwError}</Message>}
          {pwMsg && <div style={{ fontSize: 13, color: 'var(--accent-green)', marginBottom: 8 }}>{pwMsg}</div>}
          <Button variant="outline" onClick={handleChangePassword} disabled={pwSaving}>
            {pwSaving ? 'Modification...' : 'Confirmer le changement'}
          </Button>
        </div>
      )}
    </Modal>
  );
}
