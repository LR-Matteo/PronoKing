import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, DEMO_MODE } from '@/lib/supabase';
import { findProfileByUsername, createProfile, updateProfile, fetchProfile } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/crypto';

const AuthContext = createContext(null);
const CACHE_KEY = 'pronoking_profile';


function writeCache(profile) {
  if (profile) localStorage.setItem(CACHE_KEY, JSON.stringify(profile));
  else localStorage.removeItem(CACHE_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (DEMO_MODE) {
      // Vider toute session démo persistée au démarrage
      localStorage.removeItem('pronoking_user');
      return;
    }

    // Déconnecter toute session Supabase existante au démarrage → login obligatoire
    supabase.auth.signOut();
    writeCache(null);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        writeCache(null);
        return;
      }
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const profile = await fetchProfile(session.user.id);
          if (profile) {
            const fullUser = { ...profile, email: session.user.email };
            setUser(fullUser);
            writeCache(fullUser);
          }
        } catch {}
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (emailOrUsername, password) => {
    if (DEMO_MODE) {
      const profile = await findProfileByUsername(emailOrUsername);
      if (!profile) throw new Error('Pseudo ou mot de passe incorrect');
      const valid = await verifyPassword(password, profile.password_hash);
      if (!valid) throw new Error('Pseudo ou mot de passe incorrect');
      const safeProfile = { ...profile, password_hash: undefined };
      setUser(safeProfile);
      localStorage.setItem('pronoking_user', JSON.stringify(safeProfile));
      return safeProfile;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email: emailOrUsername, password });
    if (error) throw new Error('Email ou mot de passe incorrect');
    const profile = await fetchProfile(data.user.id);
    if (!profile) throw new Error("Profil introuvable — contacte l'administrateur");
    const fullUser = { ...profile, email: data.user.email };
    setLoading(false);
    setUser(fullUser);
    writeCache(fullUser);
    return fullUser;
  }, []);

  const register = useCallback(async (username, password, email) => {
    if (DEMO_MODE) {
      if (password.length < 6) throw new Error('Le mot de passe doit faire au moins 6 caractères');
      const existing = await findProfileByUsername(username);
      if (existing) throw new Error('Ce pseudo est déjà pris');
      const hash = await hashPassword(password);
      const profile = await createProfile({ username, password_hash: hash });
      const safeProfile = { ...profile, password_hash: undefined };
      setUser(safeProfile);
      localStorage.setItem('pronoking_user', JSON.stringify(safeProfile));
      return safeProfile;
    }
    if (password.length < 6) throw new Error('Le mot de passe doit faire au moins 6 caractères');
    const existing = await findProfileByUsername(username);
    if (existing) throw new Error('Ce pseudo est déjà pris');
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
    if (error) throw new Error(error.message);
    let profile = null;
    for (let i = 0; i < 6; i++) {
      await new Promise((r) => setTimeout(r, 500));
      profile = await fetchProfile(data.user.id);
      if (profile) break;
    }
    if (!profile) throw new Error('Profil introuvable après inscription — réessaie.');
    const fullUser = { ...profile, email };
    setLoading(false);
    setUser(fullUser);
    writeCache(fullUser);
    return fullUser;
  }, []);

  const logout = useCallback(async () => {
    if (DEMO_MODE) {
      setUser(null);
      localStorage.removeItem('pronoking_user');
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    writeCache(null);
  }, []);

  const updateUser = useCallback(async (updates) => {
    await updateProfile(user.id, updates);
    const updated = { ...user, ...updates };
    setUser(updated);
    if (DEMO_MODE) localStorage.setItem('pronoking_user', JSON.stringify(updated));
    else writeCache(updated);
    window.dispatchEvent(new CustomEvent('pronoking:profile-updated', { detail: { id: user.id, updates } }));
  }, [user]);

  const changePassword = useCallback(async (newPassword) => {
    if (newPassword.length < 6) throw new Error('Le mot de passe doit faire au moins 6 caractères');
    if (DEMO_MODE) {
      const hash = await hashPassword(newPassword);
      await updateProfile(user.id, { password_hash: hash });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }, [user]);

  const resetPassword = useCallback(async (email) => {
    if (DEMO_MODE) throw new Error("Non disponible en mode démo — contacte l'admin du tournoi");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, changePassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
