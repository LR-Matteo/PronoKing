import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ChevronLeft, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Message } from '@/components/ui/Components';
import { DEMO_MODE } from '@/lib/supabase';
import { validateEmail } from '@/lib/validation';
import '@/styles/components/auth.css';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    if (emailErr) { setError(emailErr); return; }
    setError('');
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
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
            <h2 style={{ marginTop: 8 }}>Mot de passe oublié</h2>
          </div>

          {DEMO_MODE ? (
            <>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                En mode démo, la réinitialisation se fait via l'administrateur du tournoi. Contacte-le pour obtenir un nouveau mot de passe.
              </p>
            </>
          ) : sent ? (
            <div style={{ textAlign: 'center' }}>
              <Send size={40} color="var(--accent-green)" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                Un email a été envoyé à <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.<br />
                Clique sur le lien pour réinitialiser ton mot de passe.
              </p>
            </div>
          ) : (
            <>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
                Saisis ton adresse email — tu recevras un lien pour créer un nouveau mot de passe.
              </p>
              <Message type="error">{error}</Message>
              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <label>Email</label>
                  <input
                    className="input-field"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    autoComplete="email"
                  />
                </div>
                <Button variant="gold" size="lg" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Envoi...' : 'Envoyer le lien'}
                </Button>
              </form>
            </>
          )}

          <Button variant="ghost" onClick={() => navigate('/login')} style={{ width: '100%', marginTop: 16 }}>
            <ChevronLeft size={16} /> Retour à la connexion
          </Button>
        </div>
      </div>
    </div>
  );
}
