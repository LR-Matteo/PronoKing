import { useNavigate } from 'react-router-dom';
import { KeyRound, ChevronLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Components';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <div className="field-pattern" />
      <div className="auth-page">
        <div className="auth-card fade-in">
          <div className="auth-logo">
            <KeyRound size={36} color="var(--accent-gold)" />
            <h2 style={{ marginTop: 8 }}>Mot de passe oublié</h2>
          </div>

          <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            <p style={{ marginBottom: 12 }}>
              PronoKing ne gère pas d'adresses e-mail, donc la réinitialisation se fait
              via l'administrateur d'un de tes tournois.
            </p>
            <div className="forgot-step">
              <span className="forgot-step-num">1</span>
              Contacte l'admin de ton tournoi (par message ou en direct).
            </div>
            <div className="forgot-step">
              <span className="forgot-step-num">2</span>
              Il génère un <strong style={{ color: 'var(--text-primary)' }}>code temporaire</strong> depuis
              le panneau d'administration du tournoi.
            </div>
            <div className="forgot-step">
              <span className="forgot-step-num">3</span>
              Connecte-toi avec ce code, puis change ton mot de passe dans
              ton <strong style={{ color: 'var(--text-primary)' }}>profil</strong>.
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px', borderRadius: 8,
            background: 'color-mix(in srgb, var(--accent-green) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent-green) 30%, transparent)',
            color: 'var(--accent-green)', fontSize: 13, marginBottom: 24,
          }}>
            <ShieldCheck size={16} />
            Les mots de passe sont chiffrés — même l'admin ne peut pas lire le tien.
          </div>

          <Button variant="ghost" onClick={() => navigate('/login')} style={{ width: '100%' }}>
            <ChevronLeft size={16} /> Retour à la connexion
          </Button>
        </div>
      </div>
    </div>
  );
}
