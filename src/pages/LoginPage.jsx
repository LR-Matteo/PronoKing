import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Message } from '@/components/ui/Components';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Tous les champs sont requis');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(username.trim(), password);
      } else {
        await login(username.trim(), password);
      }
      navigate('/');
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
            <h1>PRONOKING</h1>
            <p>Le roi des pronostics</p>
          </div>

          <Message type="error">{error}</Message>

          <form onSubmit={handleSubmit}>
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
            <div className="input-group">
              <label>Mot de passe</label>
              <input
                className="input-field"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
            </div>
            <Button variant="gold" size="lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Chargement...' : isRegister ? "S'inscrire" : 'Se connecter'}
            </Button>
          </form>

          <div className="auth-toggle">
            {isRegister ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
            <span onClick={() => { setIsRegister(!isRegister); setError(''); }}>
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
