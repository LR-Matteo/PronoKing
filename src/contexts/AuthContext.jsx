import { createContext, useContext, useState, useCallback } from 'react';
import { findProfileByUsername, createProfile, updateProfile } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/crypto';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pronoking_user'));
    } catch {
      return null;
    }
  });

  const login = useCallback(async (username, password) => {
    const profile = await findProfileByUsername(username);
    if (!profile) throw new Error('Pseudo ou mot de passe incorrect');
    const valid = await verifyPassword(password, profile.password_hash);
    if (!valid) throw new Error('Pseudo ou mot de passe incorrect');
    // Ne pas stocker le hash en localStorage
    const safeProfile = { ...profile, password_hash: undefined };
    setUser(safeProfile);
    localStorage.setItem('pronoking_user', JSON.stringify(safeProfile));
    return safeProfile;
  }, []);

  const register = useCallback(async (username, password) => {
    if (password.length < 6) throw new Error('Le mot de passe doit faire au moins 6 caractères');
    const existing = await findProfileByUsername(username);
    if (existing) throw new Error('Ce pseudo est déjà pris');
    const hash = await hashPassword(password);
    const profile = await createProfile({ username, password_hash: hash });
    const safeProfile = { ...profile, password_hash: undefined };
    setUser(safeProfile);
    localStorage.setItem('pronoking_user', JSON.stringify(safeProfile));
    return safeProfile;
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (newPassword.length < 6) throw new Error('Le nouveau mot de passe doit faire au moins 6 caractères');
    // Re-fetch pour avoir le hash à jour
    const profile = await findProfileByUsername(user.username);
    if (!profile) throw new Error('Profil introuvable');
    const valid = await verifyPassword(currentPassword, profile.password_hash);
    if (!valid) throw new Error('Mot de passe actuel incorrect');
    const newHash = await hashPassword(newPassword);
    await updateProfile(user.id, { password_hash: newHash });
  }, [user]);

  const updateUser = useCallback(async (updates) => {
    const updated = { ...user, ...updates };
    await updateProfile(user.id, updates);
    setUser(updated);
    localStorage.setItem('pronoking_user', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('pronoking:profile-updated', { detail: { id: user.id, updates } }));
  }, [user]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('pronoking_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
