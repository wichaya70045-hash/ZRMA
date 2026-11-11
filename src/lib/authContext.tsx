'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '@/types';
import AuthModal from '@/components/AuthModal';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  refreshUser: () => Promise<void>;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    username: string;
    password: string;
    display_name?: string;
    avatar_icon?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUserState: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      setUser(data.authenticated && data.user ? data.user : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const openAuthModal = useCallback((tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'เข้าสู่ระบบไม่สำเร็จ' };
      }
      setUser(data.user);
      setIsAuthModalOpen(false);
      return { success: true };
    } catch {
      return { success: false, error: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' };
    }
  }, []);

  const register = useCallback(
    async (payload: {
      username: string;
      password: string;
      display_name?: string;
      avatar_icon?: string;
    }) => {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'สมัครสมาชิกไม่สำเร็จ' };
        }
        setUser(data.user);
        setIsAuthModalOpen(false);
        return { success: true };
      } catch {
        return { success: false, error: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  }, []);

  const updateUserState = useCallback((nextUser: UserProfile) => {
    setUser(nextUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        refreshUser,
        login,
        register,
        logout,
        updateUserState,
      }}
    >
      {children}
      <AuthModal />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
