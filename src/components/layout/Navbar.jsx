import { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Components';
import { DEMO_MODE, supabase } from '@/lib/supabase';
import UserAvatar from '@/components/ui/UserAvatar';
import ProfileModal from '@/components/profile/ProfileModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (DEMO_MODE) return;

    const channel = supabase.channel('connection-check')
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {DEMO_MODE && (
        <div className="demo-banner">
          ⚡ Mode démo — Connectez Supabase pour la persistance des données
        </div>
      )}
      <nav className="nav-bar">
        <div className="nav-logo" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="var(--accent-gold)" width="28" height="28">
            <path d="M2.5 19h19l-2-14-5.5 6L12 4l-2 7-5.5-6-2 14z" />
          </svg>
          PRONOKING
        </div>
        {user && (
          <div className="nav-right">
            {!DEMO_MODE && (
              <div className="realtime-indicator" title={connected ? 'Temps réel actif' : 'Connexion...'}>
                <span className={`realtime-dot ${connected ? 'connected' : 'connecting'}`} />
                <span className="realtime-label">{connected ? 'Live' : '...'}</span>
              </div>
            )}
            <button
              className="nav-user nav-user-clickable"
              onClick={() => setShowProfile(true)}
              title="Mon profil"
            >
              <UserAvatar user={user} size={32} />
              <span>{user.username}</span>
            </button>
            <Button variant="ghost" onClick={handleLogout} title="Déconnexion">
              <LogOut size={18} />
            </Button>
          </div>
        )}
      </nav>

      <ProfileModal open={showProfile} onClose={() => setShowProfile(false)} />
    </>
  );
}
