'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { TickerItem } from '@/types';
import { useSettings } from '@/lib/settings';
import {
  Radio,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  X,
  Pin,
  Flame,
  Zap,
  Clock,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

export default function BreakingNewsTicker() {
  const { settings } = useSettings();
  const [items, setItems] = useState<TickerItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial ticker items
  const fetchTickerData = async () => {
    try {
      const res = await fetch('/api/ticker');
      const data = await res.json();
      if (data.items && Array.isArray(data.items)) {
        setItems(data.items);
      }
    } catch (err) {
      console.error('Error fetching ticker:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickerData();
  }, []);

  // Listen for real-time SSE stream to receive breaking news instantly
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/chat/stream?room=global');

      eventSource.addEventListener('new_thread', (event) => {
        try {
          const newThread = JSON.parse(event.data);
          let badge: 'PINNED' | 'BREAKING' | 'RISING' | 'HOT' = 'HOT';
          if (newThread.is_pinned === 1) {
            badge = 'PINNED';
          } else if (newThread.category === 'breaking') {
            badge = 'BREAKING';
          } else if (Number(newThread.score) >= 5) {
            badge = 'RISING';
          }

          const newTickerItem: TickerItem = {
            id: newThread.id,
            title: newThread.title,
            category: newThread.category,
            score: Number(newThread.score || 0),
            comment_count: Number(newThread.comment_count || 0),
            is_pinned: Number(newThread.is_pinned || 0),
            created_at: newThread.created_at || new Date().toISOString(),
            badge,
          };

          setItems((prev) => [newTickerItem, ...prev.filter((i) => i.id !== newTickerItem.id)]);
          // Jump to newest headline
          setCurrentIndex(0);
        } catch (err) {
          console.error('Error processing ticker new_thread:', err);
        }
      });

      eventSource.addEventListener('content_hidden', (event) => {
        try {
          const { target_type, id } = JSON.parse(event.data);
          if (target_type === 'thread') {
            setItems((prev) => prev.filter((i) => i.id !== id));
          }
        } catch {}
      });
    } catch (err) {
      console.error('SSE ticker error:', err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  // Auto-cycle through items every 4.5 seconds
  useEffect(() => {
    if (isPaused || items.length <= 1 || isDismissed) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 4500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, items.length, isDismissed]);

  if (!settings.showNewsTicker) {
    return null;
  }

  // Minimized state: small radar pill that allows user to reopen ticker
  if (isDismissed) {
    return (
      <div className="w-full bg-[#0a0c10]/95 border-b border-white/[0.04] py-1 px-3 sm:px-4 flex items-center justify-end">
        <button
          onClick={() => setIsDismissed(false)}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-[10px] font-mono text-zinc-400 hover:text-yellow-400 transition-colors"
          title="เปิดแถบข่าวด่วนเรียลไทม์"
        >
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
          </span>
          <span>แสดงแถบข่าวด่วน ({items.length})</span>
        </button>
      </div>
    );
  }

  if (isLoading && items.length === 0) {
    return null;
  }

  if (items.length === 0) {
    return null;
  }

  const currentItem = items[currentIndex] || items[0];

  const getTimeAgo = (dateStr: string) => {
    const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diffSec < 60) return 'เมื่อสักครู่';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    return `${Math.floor(diffHr / 24)}d`;
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const togglePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPaused((prev) => !prev);
  };

  return (
    <aside
      aria-label="Breaking News Ticker"
      className="w-full bg-[#090b0e] border-b border-white/[0.07] text-xs select-none z-30 transition-all overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-9 flex items-center justify-between gap-2.5 sm:gap-3.5 overflow-hidden">
        
        {/* Left Live Indicator Badge */}
        <Link
          href="/?category=breaking"
          className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-red-400 hover:border-red-400 hover:bg-red-950 transition-colors shrink-0 group focus-visible:outline-none"
          title="ดูกระทู้ใน z/breaking ทั้งหมด"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span
              className={`absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 ${
                settings.reduceMotion ? '' : 'animate-ping'
              }`}
            />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <Radio size={11} className="shrink-0 text-red-400 group-hover:scale-110 transition-transform" />
          <span className="font-mono font-bold text-[10px] tracking-wider uppercase hidden sm:inline">
            BREAKING WIRE
          </span>
          <span className="font-mono font-bold text-[10px] tracking-wider uppercase sm:hidden">
            LIVE
          </span>
        </Link>

        {/* Center Live Headline Carousel */}
        <div
          className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden py-0.5 cursor-pointer"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Badge indicator */}
          {currentItem.badge === 'PINNED' ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-red-900/60 text-red-300 border border-red-500/40 shrink-0">
              <Pin size={9} />
              <span>ปักหมุด</span>
            </span>
          ) : currentItem.badge === 'BREAKING' ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-red-950/70 text-red-400 border border-red-500/30 shrink-0">
              <Radio size={9} />
              <span>ข่าวด่วน</span>
            </span>
          ) : currentItem.badge === 'RISING' ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-orange-950/70 text-orange-400 border border-orange-500/30 shrink-0">
              <Zap size={9} />
              <span>มาแรง</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-yellow-950/60 text-yellow-400 border border-yellow-500/30 shrink-0">
              <Flame size={9} />
              <span>ฮิต</span>
            </span>
          )}

          {/* Category slug */}
          <Link
            href={`/?category=${currentItem.category.replace(/^[zr]\//i, '')}`}
            className="font-mono text-[10px] text-zinc-400 hover:text-yellow-400 font-semibold shrink-0 hidden md:inline"
          >
            z/{currentItem.category.replace(/^[zr]\//i, '')}
          </Link>

          <span className="text-zinc-600 hidden md:inline">•</span>

          {/* Clickable Headline */}
          <Link
            href={`/thread/${currentItem.id}`}
            key={currentItem.id}
            className="font-medium text-xs text-zinc-200 hover:text-yellow-400 truncate flex-1 min-w-0 transition-colors animate-in fade-in duration-300"
            title={currentItem.title}
          >
            {currentItem.title}
          </Link>

          {/* Time Ago */}
          <span className="text-[10px] font-mono text-zinc-500 shrink-0 hidden sm:inline tabular-nums">
            {getTimeAgo(currentItem.created_at)}
          </span>
        </div>

        {/* Right Navigation & Controls */}
        <div className="flex items-center gap-1 shrink-0 text-zinc-400">
          {/* Index Counter */}
          <span className="font-mono text-[10px] text-zinc-500 tabular-nums px-1 hidden sm:inline">
            {currentIndex + 1}/{items.length}
          </span>

          {/* Pause / Play Button */}
          <button
            type="button"
            onClick={togglePause}
            className={`p-1 rounded hover:bg-white/[0.06] transition-colors ${
              isPaused ? 'text-yellow-400 bg-yellow-400/10' : 'text-zinc-400 hover:text-white'
            }`}
            title={isPaused ? 'เล่นต่อ (Auto-play)' : 'หยุดชั่วคราว (Pause)'}
            aria-label="Pause or play ticker"
          >
            {isPaused ? <Play size={11} /> : <Pause size={11} />}
          </button>

          {/* Prev Button */}
          <button
            type="button"
            onClick={handlePrev}
            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-white/[0.06] transition-colors"
            title="ข่าวก่อนหน้า"
            aria-label="Previous headline"
          >
            <ChevronLeft size={13} />
          </button>

          {/* Next Button */}
          <button
            type="button"
            onClick={handleNext}
            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-white/[0.06] transition-colors"
            title="ข่าวถัดไป"
            aria-label="Next headline"
          >
            <ChevronRight size={13} />
          </button>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 text-zinc-500 hover:text-red-400 rounded hover:bg-white/[0.06] transition-colors ml-0.5"
            title="ซ่อนแถบข่าวด่วน"
            aria-label="Dismiss news ticker"
          >
            <X size={12} />
          </button>
        </div>

      </div>
    </aside>
  );
}
