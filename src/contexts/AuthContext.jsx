import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, DEMO_MODE } from '@/lib/supabase';
import { findProfileByUsername, createProfile, updateProfile, fetchProfile } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/crypto';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEMO_MODE) {
      try {
        const stored = JSON.parse(localStorage.getItem('pronoking_user'));
        setUser(stored);
      } catch {}
      setLoading(false);
      return;
    }

    // Restore Supabase session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          const profile = await fetchProfile(session.user.id);
          if (profile) setUser({ ...profile, email: session.user.email });
        } catch {}
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        return;
      }
      if (session?.user) {
        try {
          const profile = await fetchProfile(session.user.id);
          if (profile) setUser({ ...profile, email: session.user.email });
        } catch {
          setUser(null);
        }
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
    const fullUser = { ...profile, email: data.user.email };
    setUser(fullUser);
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
    // Le username est passé en metadata — le trigger SQL crée le profil automatiquement
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw new Error(error.message);
    // Attendre que le trigger ait créé le profil
    await new Promise((r) => setTimeout(r, 500));
    const profile = await fetchProfile(data.user.id);
    const fullUser = { ...profile, email };
    setUser(fullUser);
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
  }, []);

  const updateUser = useCallback(async (updates) => {
    await updateProfile(user.id, updates);
    const updated = { ...user, ...updates };
    setUser(updated);
    if (DEMO_MODE) localStorage.setItem('pronoking_user', JSON.stringify(updated));
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
    if (DEMO_MODE) throw new Error('Non disponible en mode démo — contacte l\'admin du tournoi');
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
