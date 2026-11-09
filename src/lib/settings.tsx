'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AppSettings {
  // Privacy & Anonymity
  strictZeroTrace: boolean;   // Auto-reroll alias & avatar on every single post/message
  blurMedia: boolean;         // Blur images & videos by default until clicked
  panicShortcut: boolean;     // Enable double ESC press to instant-wipe and redirect
  autoClearOnExit: boolean;   // Clear session storage on tab close

  // Feed & Reading
  feedLayout: 'card' | 'compact'; // Card view vs High-density row compact view
  defaultSort: 'hot' | 'breaking' | 'new' | 'top'; // Default feed sorting
  fontSize: 'normal' | 'comfortable'; // Standard (14px) vs Comfortable (16px)
  reduceMotion: boolean;      // Disable pulse & ping animations for performance

  // Live Chat & Ghost Lounges
  chatSound: boolean;         // Play subtle chime on incoming chat message
  enterToSend: boolean;       // Press Enter to send (Shift+Enter for newline)
  autoScrollChat: boolean;    // Auto-scroll chat to latest message

  // Theme & Appearance
  accentTheme: 'crimson' | 'amber' | 'stealth'; // Crimson (Default), Amber Gold, Stealth Noir
}

export const DEFAULT_SETTINGS: AppSettings = {
  strictZeroTrace: false,
  blurMedia: false,
  panicShortcut: true,
  autoClearOnExit: true,

  feedLayout: 'card',
  defaultSort: 'hot',
  fontSize: 'normal',
  reduceMotion: false,

  chatSound: true,
  enterToSend: true,
  autoScrollChat: true,

  accentTheme: 'crimson',
};

const SETTINGS_STORAGE_KEY = 'zrma_user_settings_v1';

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
  executePanicWipe: () => void;
  playChatChime: () => void;
  isReady: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isReady, setIsReady] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // Storage unavailable or blocked by browser privacy mode
    } finally {
      setIsReady(true);
    }
  }, []);

  // Sync settings updates to localStorage
  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Reset to default configuration
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch {
      // ignore
    }
  };

  // Execute instant panic wipe: clears session and redirects
  const executePanicWipe = () => {
    try {
      // Clear all session identities and draft states
      sessionStorage.clear();
      // Wipe sensitive local keys
      localStorage.removeItem('zrma_cached_drafts');
      localStorage.removeItem('zrma_recent_searches');
    } catch {
      // ignore
    }
    // Hard redirect to external neutral landing site
    window.location.replace('https://th.wikipedia.org');
  };

  // Web Audio subtle chime (no external MP3 asset required)
  const playChatChime = () => {
    if (!settings.chatSound || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Pleasant high double chime note
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08); // A5

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio playback failed or blocked by autoplay policy
    }
  };

  // Global Panic Shortcut: Detect two consecutive Escape presses within 400ms
  useEffect(() => {
    if (!settings.panicShortcut) return;

    let lastEscTime = 0;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const now = Date.now();
        if (now - lastEscTime < 400) {
          executePanicWipe();
        } else {
          lastEscTime = now;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.panicShortcut]);

  // Tab unload auto-clear listener
  useEffect(() => {
    if (!settings.autoClearOnExit) return;

    const handleBeforeUnload = () => {
      try {
        sessionStorage.clear();
      } catch {
        // ignore
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [settings.autoClearOnExit]);

  // Apply styling data attributes to root element
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Accent theme attribute
    root.setAttribute('data-accent-theme', settings.accentTheme);

    // Font size density attribute
    root.setAttribute('data-font-size', settings.fontSize);

    // Reduced motion attribute
    if (settings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [settings.accentTheme, settings.fontSize, settings.reduceMotion]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSetting,
        resetSettings,
        executePanicWipe,
        playChatChime,
        isReady,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
