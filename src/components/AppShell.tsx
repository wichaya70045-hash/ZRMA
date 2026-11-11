'use client';

import React, { useState, useCallback } from 'react';
import Navbar from './Navbar';
import BreakingNewsTicker from './BreakingNewsTicker';
import LeftSidebar from './LeftSidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = useCallback(() => {
    setMobileSidebarOpen((prev) => !prev);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  return (
    <>
      <Navbar onToggleLeftSidebar={toggleMobileSidebar} />
      <BreakingNewsTicker />

      <div className="flex-1 max-w-[1440px] w-full mx-auto flex items-start">
        <LeftSidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={closeMobileSidebar}
        />

        <main className="flex-1 min-w-0 px-3 sm:px-5 py-3 sm:py-6 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-white/[0.08] bg-white/80 dark:bg-[#08090c]/90 py-8 text-center text-xs text-zinc-500 w-full overflow-hidden backdrop-blur-sm">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-4 space-y-2">
          <div className="flex items-center justify-center gap-2 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-zinc-900 dark:text-zinc-200 font-bold tracking-wider">ZRMA COMMUNITY</span>
            <span className="text-zinc-400 dark:text-zinc-600">•</span>
            <span className="text-amber-600 dark:text-yellow-400/90 font-semibold">ZERO-LOG PRIVACY STANDARD</span>
          </div>
          <p className="text-[11px] text-zinc-500 max-w-xl mx-auto leading-relaxed">
            ระบบชุมชนนิรนามที่ไม่เก็บ IP Address • ข้อมูลถูกทำลายอัตโนมัติตามระยะเวลา (TTL) • ห้องแชทสดจำกัด 100 ข้อความล่าสุด
          </p>
        </div>
      </footer>
    </>
  );
}
