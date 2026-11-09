'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Thread, RedditSort } from '@/types';
import ThreadCard from '@/components/ThreadCard';
import CategoryFilter from '@/components/CategoryFilter';
import CommunitySidebar from '@/components/CommunitySidebar';
import LiveChatBox from '@/components/LiveChatBox';
import {
  Search,
  Plus,
  Radio,
  FileText,
  Shield,
  Zap,
  Flame,
  Clock,
  TrendingUp,
  Award,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState<RedditSort>('hot');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabMobile, setActiveTabMobile] = useState<'threads' | 'chat'>('threads');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category');
      if (cat) {
        setSelectedCategory(cat.replace(/^r\//, ''));
      }
    }
  }, []);

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
    <div className="space-y-4">
      
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
          ฟีดโพสต์ ({filteredThreads.length})
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
          <span>ห้องแชทสด</span>
        </button>
      </div>

      {/* Main Grid: Feed (Left 8 cols) & Community Sidebar (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Feed and Controls */}
        <section
          className={`lg:col-span-8 space-y-3.5 ${
            activeTabMobile === 'chat' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Reddit-style Create Post Prompt Bar */}
          <div className="bg-[#101217] border border-white/[0.08] hover:border-white/[0.14] rounded-xl p-2.5 flex items-center gap-2.5 shadow-sm transition-colors">
            <div className="w-8 h-8 rounded-full bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
              <Shield size={16} />
            </div>
            <Link
              href="/new"
              className="flex-1 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              สร้างโพสต์ใหม่ใน r/{selectedCategory === 'all' ? 'all' : selectedCategory}...
            </Link>
            <Link
              href="/new"
              className="btn-primary !py-1.5 !px-3 text-xs shrink-0"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>โพสต์</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              id="main-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาตามหัวข้อ, ข้อความ, หรือรหัสผู้เขียน..."
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

          {/* Subreddits & Reddit Sorting Tabs */}
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedSort={selectedSort}
            onSelectSort={(sort) => setSelectedSort(sort as RedditSort)}
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
              <h3 className="text-sm font-semibold text-zinc-200">ไม่พบโพสต์ที่ตรงกับเงื่อนไข</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                อาจยังไม่มีโพสต์ในหมวดหมู่นี้ หรือกระทู้อาจหมดอายุและถูกลบทำลายไปแล้วตามนโยบายความเป็นส่วนตัว
              </p>
              <div className="pt-2">
                <Link
                  href="/new"
                  className="btn-secondary text-xs hover:border-red-500/40"
                >
                  <Plus size={13} className="text-red-400" />
                  <span>สร้างโพสต์แรกเลย</span>
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

        {/* Right Column: Reddit Community Sidebar & Live Chat */}
        <aside
          className={`lg:col-span-4 lg:sticky lg:top-16 space-y-4 ${
            activeTabMobile === 'threads' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Reddit Community Info Widget */}
          <CommunitySidebar
            currentCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
          />

          {/* Live Lounge Chat Widget */}
          <LiveChatBox roomId="global" title="r/lounge ห้องแชทสด" />
        </aside>

      </div>
    </div>
  );
}
