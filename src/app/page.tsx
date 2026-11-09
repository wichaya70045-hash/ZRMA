'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Thread } from '@/types';
import ThreadCard from '@/components/ThreadCard';
import CategoryFilter from '@/components/CategoryFilter';
import LiveChatBox from '@/components/LiveChatBox';
import {
  Search,
  Plus,
  Radio,
  FileText,
  Shield,
  Zap,
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
      
      {/* Page Header (Black, Red & Yellow Accents) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[11px] font-mono text-yellow-400 font-semibold uppercase tracking-wider">
              Secure & Anonymous Platform
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            บอร์ดข่าวและกระทู้สนทนา
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
            พื้นที่แลกเปลี่ยนข่าวสารแบบไม่ระบุตัวตน ปราศจากการเก็บ IP Address พร้อมระบบทำลายข้อมูลอัตโนมัติ (TTL)
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/new"
            className="btn-primary"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>ตั้งกระทู้ใหม่</span>
          </Link>
        </div>
      </div>

      {/* Mobile Segmented Switcher */}
      <div className="flex lg:hidden bg-black/40 p-1 rounded-lg border border-white/[0.06] text-xs">
        <button
          onClick={() => setActiveTabMobile('threads')}
          className={`flex-1 py-1.5 rounded font-medium transition-colors ${
            activeTabMobile === 'threads'
              ? 'bg-red-600 text-white font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          กระทู้ ({filteredThreads.length})
        </button>
        <button
          onClick={() => setActiveTabMobile('chat')}
          className={`flex-1 py-1.5 rounded font-medium flex items-center justify-center gap-1.5 transition-colors ${
            activeTabMobile === 'chat'
              ? 'bg-yellow-400 text-zinc-950 font-bold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Radio size={12} className={activeTabMobile === 'chat' ? 'text-zinc-950' : 'text-yellow-400'} />
          <span>แชทสด</span>
        </button>
      </div>

      {/* Main Grid (Asymmetric 8:4 split on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Feed and Unified Control Bar */}
        <section
          className={`lg:col-span-7 xl:col-span-8 space-y-4 ${
            activeTabMobile === 'chat' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Unified Search Control */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหากระทู้, คำสำคัญ, หรือรหัสผู้เขียน..."
              className="w-full bg-[#101217] border border-white/[0.08] focus:border-red-500 rounded-lg pl-9 pr-8 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-zinc-500 hover:text-zinc-300"
              >
                ESC
              </button>
            )}
          </div>

          {/* Category Filter & Sorting */}
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedSort={selectedSort}
            onSelectSort={setSelectedSort}
          />

          {/* Thread List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-[#101217] border border-white/[0.06] rounded-xl p-4 animate-pulse space-y-2.5"
                >
                  <div className="h-3 bg-white/[0.06] rounded w-1/4"></div>
                  <div className="h-4 bg-white/[0.06] rounded w-3/4"></div>
                  <div className="h-3 bg-white/[0.06] rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="bg-[#101217] border border-white/[0.07] rounded-xl p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] text-zinc-400 flex items-center justify-center mx-auto border border-white/[0.08]">
                <FileText size={18} />
              </div>
              <h3 className="text-sm font-semibold text-zinc-200">ไม่พบกระทู้ที่ตรงกับเงื่อนไข</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                อาจยังไม่มีกระทู้ในหมวดหมู่นี้ หรือกระทู้อาจหมดอายุและถูกลบทำลายไปแล้วตามนโยบายความเป็นส่วนตัว
              </p>
              <div className="pt-2">
                <Link
                  href="/new"
                  className="btn-secondary text-xs hover:border-red-500/40"
                >
                  <Plus size={13} className="text-red-400" />
                  <span>สร้างกระทู้ใหม่</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
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

        {/* Right Column: Terminal-Grade Live Chat */}
        <aside
          className={`lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20 space-y-3 ${
            activeTabMobile === 'threads' ? 'hidden lg:block' : 'block'
          }`}
        >
          <LiveChatBox roomId="global" title="ห้องสนทนาสดส่วนกลาง" />

          {/* Concise Telemetry Footer */}
          <div className="p-3 bg-[#101217] border border-white/[0.06] rounded-xl text-xs text-zinc-400 flex items-center gap-2.5">
            <Shield size={14} className="text-red-400 shrink-0" />
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              สตรีมแชทสดแบบ FIFO 100 ข้อความล่าสุด ไม่บันทึกประวัติถาวร
            </p>
          </div>
        </aside>

      </div>
    </div>
  );
}
