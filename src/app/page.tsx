'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Thread } from '@/types';
import ThreadCard from '@/components/ThreadCard';
import CategoryFilter from '@/components/CategoryFilter';
import LiveChatBox from '@/components/LiveChatBox';
import {
  ShieldAlert,
  Flame,
  Search,
  MessageSquare,
  Sparkles,
  RefreshCw,
  PlusCircle,
  Radio,
  Clock
} from 'lucide-react';

export default function HomePage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState<'latest' | 'hot' | 'breaking'>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabMobile, setActiveTabMobile] = useState<'threads' | 'chat'>('threads');

  const fetchThreads = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      params.append('sort', selectedSort);

      const res = await fetch(`/api/threads?${params.toString()}`);
      const data = await res.json();
      if (data.threads) {
        setThreads(data.threads);
      }
    } catch (err) {
      console.error('Error fetching threads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [selectedCategory, selectedSort]);

  // Connect to SSE for real-time thread notifications
  useEffect(() => {
    const eventSource = new EventSource('/api/chat/stream?room=global');

    eventSource.addEventListener('new_thread', (event) => {
      try {
        const newThread: Thread = JSON.parse(event.data);
        setThreads((prev) => [newThread, ...prev]);
      } catch (err) {
        console.error('Error parsing new_thread:', err);
      }
    });

    eventSource.addEventListener('content_hidden', (event) => {
      try {
        const { target_type, id } = JSON.parse(event.data);
        if (target_type === 'thread') {
          setThreads((prev) =>
            prev.map((t) => (t.id === id ? { ...t, is_hidden: 1 } : t))
          );
        }
      } catch (err) {
        console.error('Error parsing content_hidden:', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const filteredThreads = threads.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.content.toLowerCase().includes(q) ||
      t.author_alias.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Welcome / Privacy Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/40 border border-emerald-800/30 p-4 sm:p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md">
                Privacy Guaranteed
              </span>
              <span className="text-xs text-slate-400">🛡️ No Sign-Up • Zero Logs • 100% Anonymous</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              พื้นที่ข่าวสาร & เสวนาแบบไร้ตัวตน
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              ไม่มีการเก็บ IP Address และประวัติการท่องเว็บ สุ่มชื่อใหม่ทุกกระทู้เพื่อป้องกันการแกะรอย พร้อมระบบทำลายข้อมูลอัตโนมัติ (TTL) 
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span>เปิดประเด็น / ตั้งกระทู้</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher (กระทู้ vs แชทสด) */}
      <div className="flex lg:hidden bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
        <button
          onClick={() => setActiveTabMobile('threads')}
          className={`flex-1 py-2 rounded-lg font-bold transition-all ${
            activeTabMobile === 'threads'
              ? 'bg-emerald-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📰 บอร์ดกระทู้ข่าว ({filteredThreads.length})
        </button>
        <button
          onClick={() => setActiveTabMobile('chat')}
          className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTabMobile === 'chat'
              ? 'bg-emerald-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <span>แชทสดส่วนกลาง (100 ข้อความ)</span>
        </button>
      </div>

      {/* Main Grid Layout (2 Columns on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Threads and Filters (8 cols on desktop) */}
        <section
          className={`lg:col-span-7 xl:col-span-8 space-y-4 ${
            activeTabMobile === 'chat' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหากระทู้, คำสำคัญ, หรือรหัสผู้เขียน..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/70"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ล้าง
              </button>
            )}
          </div>

          {/* Category Filter and Sorting */}
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedSort={selectedSort}
            onSelectSort={setSelectedSort}
          />

          {/* Thread List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 animate-pulse space-y-3"
                >
                  <div className="h-4 bg-slate-800 rounded w-1/4"></div>
                  <div className="h-6 bg-slate-800 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-800 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/60 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">ไม่พบกระทู้ที่ตรงกับเงื่อนไข</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                อาจยังไม่มีกระทู้ในหมวดหมู่นี้ หรือกระทู้อาจหมดอายุและถูกลบทำลายไปแล้วตามนโยบายความเป็นส่วนตัว
              </p>
              <div className="pt-2">
                <Link
                  href="/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>สร้างกระทู้แรกเลย</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredThreads.map((thread) => (
                <ThreadCard
                  key={thread.id}
                  thread={thread}
                  onVoteChange={(id, newScore) => {
                    setThreads((prev) =>
                      prev.map((t) => (t.id === id ? { ...t, score: newScore } : t))
                    );
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Sticky Live Chat (5 cols on desktop) */}
        <aside
          className={`lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20 space-y-4 ${
            activeTabMobile === 'threads' ? 'hidden lg:block' : 'block'
          }`}
        >
          <LiveChatBox roomId="global" title="ห้องสนทนาสดส่วนกลาง" />

          {/* Quick Privacy Tip Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 space-y-2 hidden lg:block">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <ShieldAlert className="w-4 h-4" />
              <span>ความปลอดภัยในการสนทนา</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              ข้อความในแชทสดจะถูกหมุนเวียนลบอัตโนมัติ (FIFO) โดยจำกัดสูงสุดไม่เกิน 100 ข้อความล่าสุดเสมอ เพื่อไม่ให้มีประวัติสนทนาตกค้างในระบบ
            </p>
          </div>
        </aside>

      </div>
    </div>
  );
}
