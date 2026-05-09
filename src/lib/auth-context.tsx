import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from './types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('auralex_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, _password: string) => {
    // Mock login
    await new Promise(r => setTimeout(r, 800));
    const u: User = { id: '1', name: email.split('@')[0], email };
    setUser(u);
    localStorage.setItem('auralex_user', JSON.stringify(u));
  }, []);

  const signup = useCallback(async (name: string, email: string, _password: string) => {
    await new Promise(r => setTimeout(r, 800));
    const u: User = { id: '1', name, email };
    setUser(u);
    localStorage.setItem('auralex_user', JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('auralex_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
