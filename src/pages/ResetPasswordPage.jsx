import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Message } from '@/components/ui/Components';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!password || !confirm) { setError('Tous les champs sont requis'); return; }
    if (password.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères'); return; }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <div className="field-pattern" />
      <div className="auth-page">
        <div className="auth-card fade-in">
          <div className="auth-logo">
            <KeyRound size={36} color="var(--accent-gold)" />
            <h2 style={{ marginTop: 8 }}>Nouveau mot de passe</h2>
          </div>

          {success ? (
            <div style={{ textAlign: 'center' }}>
              <CheckCircle size={40} color="var(--accent-green)" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--accent-green)', fontSize: 14 }}>
                Mot de passe mis à jour ! Redirection...
              </p>
            </div>
          ) : (
            <>
              <Message type="error">{error}</Message>
              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <label>Nouveau mot de passe</label>
                  <input
                    className="input-field"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6 caractères minimum"
                    autoComplete="new-password"
                  />
                </div>
                <div className="input-group">
                  <label>Confirmer le mot de passe</label>
                  <input
                    className="input-field"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
                <Button variant="gold" size="lg" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Mise à jour...' : 'Confirmer'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
