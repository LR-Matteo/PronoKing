import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Message } from '@/components/ui/Components';
import { DEMO_MODE } from '@/lib/supabase';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (DEMO_MODE) {
      if (!username.trim() || !password.trim()) { setError('Tous les champs sont requis'); return; }
    } else {
      if (isRegister && !username.trim()) { setError('Tous les champs sont requis'); return; }
      if (!email.trim() || !password.trim()) { setError('Tous les champs sont requis'); return; }
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(username.trim(), password, email.trim());
      } else {
        await login(DEMO_MODE ? username.trim() : email.trim(), password);
      }
      const redirect = sessionStorage.getItem('pronoking_redirect');
      if (redirect) {
        sessionStorage.removeItem('pronoking_redirect');
        navigate(redirect);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const switchMode = () => {
    setIsRegister((v) => !v);
    setError('');
    setUsername('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="app-container">
      <div className="field-pattern" />
      <div className="auth-page">
        <div className="auth-card fade-in">
          <div className="auth-logo">
            <h1>PRONOKING</h1>
            <p>Le roi des pronostics</p>
          </div>

          <Message type="error">{error}</Message>

          <form onSubmit={handleSubmit}>
            {/* Username: always in register, always in demo */}
            {(isRegister || DEMO_MODE) && (
              <div className="input-group">
                <label>Pseudo</label>
                <input
                  className="input-field"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Votre pseudo"
                  autoComplete="username"
                />
              </div>
            )}

            {/* Email: only in production mode */}
            {!DEMO_MODE && (
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
            )}

            <div className="input-group">
              <label>Mot de passe</label>
              <input
                className="input-field"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegister ? '6 caractères minimum' : 'Votre mot de passe'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
            </div>

            <Button variant="gold" size="lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Chargement...' : isRegister ? "S'inscrire" : 'Se connecter'}
            </Button>
          </form>

          <div className="auth-toggle">
            {isRegister ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
            <span onClick={switchMode}>
              {isRegister ? 'Se connecter' : "S'inscrire"}
            </span>
          </div>

          {!isRegister && (
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <Link to="/forgot-password" className="auth-forgot-link">
                Mot de passe oublié ?
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
