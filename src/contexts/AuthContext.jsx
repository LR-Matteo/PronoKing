import { createContext, useContext, useState, useCallback } from 'react';
import { findProfileByUsername, createProfile, loginProfile } from '@/lib/db';

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
    const profile = await loginProfile(username, password);
    if (!profile) throw new Error('Pseudo ou mot de passe incorrect');
    setUser(profile);
    localStorage.setItem('pronoking_user', JSON.stringify(profile));
    return profile;
  }, []);

  const register = useCallback(async (username, password) => {
    const existing = await findProfileByUsername(username);
    if (existing) throw new Error('Ce pseudo est déjà pris');
    const profile = await createProfile({ username, password_hash: password });
    setUser(profile);
    localStorage.setItem('pronoking_user', JSON.stringify(profile));
    return profile;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('pronoking_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
