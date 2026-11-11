'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  AlertCircle,
  Terminal,
  Flame,
  Zap,
  Award,
  Sparkles,
  Plus,
  Cpu,
  Radar,
  Globe,
  TrendingUp,
  MessageSquare,
  Search,
  X,
  LayoutGrid,
  LayoutList,
} from 'lucide-react';
import { RedditSort, Community } from '@/types';
import CreateCommunityModal from './CreateCommunityModal';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedSort: RedditSort;
  onSelectSort: (sort: RedditSort) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  layout?: 'card' | 'compact';
  onLayoutChange?: (l: 'card' | 'compact') => void;
  threadCount?: number;
}

const ICON_MAP: Record<string, any> = {
  terminal: Terminal,
  flame: Flame,
  zap: Zap,
  cpu: Cpu,
  radar: Radar,
  globe: Globe,
  trending: TrendingUp,
  chat: MessageSquare,
  alert: AlertCircle,
};

export default function CategoryFilter({
  selectedCategory,
  onSelectCategory,
  selectedSort,
  onSelectSort,
  searchQuery = '',
  onSearchChange,
  layout = 'card',
  onLayoutChange,
  threadCount,
}: CategoryFilterProps) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/communities')
      .then((res) => res.json())
      .then((data) => {
        if (data.communities) setCommunities(data.communities);
      })
      .catch(() => {});
  }, []);

  const handleCreated = (newComm: Community) => {
    setCommunities((prev) => [newComm, ...prev.filter((c) => c.name !== newComm.name)]);
    onSelectCategory(newComm.name);
  };

  return (
    <div className="bg-white dark:bg-[#0e1015]/90 border border-zinc-200 dark:border-white/[0.08] rounded-xl overflow-hidden shadow-sm dark:shadow-lg w-full max-w-full backdrop-blur-sm">
      
      {/* 1. Subreddit Horizontal Navigation Pills */}
      <div className="px-3 pt-3 pb-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none font-mono text-xs max-w-full">
        {/* z/all */}
        <button
          onClick={() => onSelectCategory('all')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border active:scale-95 ${
            selectedCategory === 'all'
              ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-zinc-950 border-amber-400 dark:border-yellow-300 font-bold shadow-[0_0_12px_rgba(250,204,21,0.25)]'
              : 'bg-zinc-100 dark:bg-white/[0.03] hover:bg-zinc-200/70 dark:hover:bg-white/[0.07] text-zinc-700 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 border-zinc-200 dark:border-white/[0.06]'
          }`}
        >
          <Layers size={13} strokeWidth={selectedCategory === 'all' ? 2.5 : 1.75} />
          <span>z/all</span>
        </button>

        {/* Dynamic subreddits */}
        {communities.map((comm) => {
          const isActive = selectedCategory === comm.name;
          const IconComp = ICON_MAP[comm.icon] || Terminal;
          const isBreaking = comm.name === 'breaking';

          let activeClasses = 'bg-gradient-to-r from-yellow-400 to-amber-400 text-zinc-950 border-amber-400 dark:border-yellow-300 font-bold shadow-[0_0_12px_rgba(250,204,21,0.25)]';
          if (isBreaking && isActive) {
            activeClasses = 'bg-gradient-to-r from-red-600 to-red-700 text-white border-red-500 font-bold shadow-[0_0_12px_rgba(239,68,68,0.3)]';
          }

          return (
            <button
              key={comm.name}
              onClick={() => onSelectCategory(comm.name)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border active:scale-95 ${
                isActive
                  ? activeClasses
                  : 'bg-zinc-100 dark:bg-white/[0.03] hover:bg-zinc-200/70 dark:hover:bg-white/[0.07] text-zinc-700 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 border-zinc-200 dark:border-white/[0.06]'
              }`}
            >
              <IconComp
                size={13}
                strokeWidth={isActive ? 2.2 : 1.75}
                className={
                  isActive
                    ? ''
                    : isBreaking
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-zinc-500 dark:text-zinc-400'
                }
              />
              <span>z/{comm.name}</span>
            </button>
          );
        })}

        {/* Create new z/ button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border border-dashed border-zinc-300 dark:border-white/20 hover:border-amber-500 dark:hover:border-yellow-400 text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-yellow-400 hover:bg-amber-500/[0.06] dark:hover:bg-yellow-400/[0.05]"
          title="สร้างห้อง z/ ใหม่"
        >
          <Plus size={13} />
          <span>+ สร้าง z/</span>
        </button>
      </div>

      {/* 2. Unified Controls Bar: Sort + Search + View Layout */}
      <div className="px-3 py-2 border-t border-zinc-200 dark:border-white/[0.06] bg-zinc-50/80 dark:bg-black/20 flex flex-wrap items-center justify-between gap-2.5 text-xs w-full">
        
        {/* Left: Reddit Sorting Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5 sm:pb-0 scrollbar-none">
          <button
            onClick={() => onSelectSort('hot')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors shrink-0 ${
              selectedSort === 'hot'
                ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/[0.03]'
            }`}
          >
            <Flame size={13} className={selectedSort === 'hot' ? 'text-orange-600 dark:text-orange-400' : ''} />
            <span>Hot</span>
          </button>

          <button
            onClick={() => onSelectSort('new')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors shrink-0 ${
              selectedSort === 'new'
                ? 'bg-yellow-400 text-zinc-950 font-bold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/[0.03]'
            }`}
          >
            <Sparkles size={13} />
            <span>New</span>
          </button>

          <button
            onClick={() => onSelectSort('top')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors shrink-0 ${
              selectedSort === 'top'
                ? 'bg-amber-500/15 dark:bg-yellow-500/15 text-amber-700 dark:text-yellow-400 border border-amber-500/30 dark:border-yellow-500/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/[0.03]'
            }`}
          >
            <Award size={13} className={selectedSort === 'top' ? 'text-amber-600 dark:text-yellow-400' : ''} />
            <span>Top</span>
          </button>

          <button
            onClick={() => onSelectSort('rising')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors shrink-0 ${
              selectedSort === 'rising'
                ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/[0.03]'
            }`}
          >
            <Zap size={13} className={selectedSort === 'rising' ? 'text-red-600 dark:text-red-400' : ''} />
            <span>Rising</span>
          </button>
        </div>

        {/* Center/Right: Integrated Minimal Search Input */}
        {onSearchChange && (
          <div className="relative flex-1 min-w-[120px] sm:min-w-[140px] max-w-xs order-last sm:order-none w-full sm:w-auto">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหาในฟีด..."
              className="w-full bg-white dark:bg-[#141721] border border-zinc-200 dark:border-white/[0.08] focus:border-red-500/50 rounded-lg pl-7 pr-6 py-1 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                <X size={11} />
              </button>
            )}
          </div>
        )}

        {/* Right: Layout Switcher & Post Count */}
        <div className="flex items-center gap-2 shrink-0">
          {typeof threadCount === 'number' && (
            <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
              {threadCount} โพสต์
            </span>
          )}

          {onLayoutChange && (
            <div className="flex items-center gap-0.5 bg-zinc-200/60 dark:bg-black/40 p-0.5 rounded-lg border border-zinc-200 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => onLayoutChange('card')}
                className={`p-1 rounded transition-colors ${
                  layout === 'card'
                    ? 'bg-white dark:bg-yellow-500/15 text-amber-600 dark:text-yellow-400 border border-zinc-200 dark:border-yellow-500/30 shadow-sm dark:shadow-none'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
                title="มุมมองการ์ด (Card View)"
              >
                <LayoutGrid size={13} />
              </button>
              <button
                type="button"
                onClick={() => onLayoutChange('compact')}
                className={`p-1 rounded transition-colors ${
                  layout === 'compact'
                    ? 'bg-white dark:bg-yellow-500/15 text-amber-600 dark:text-yellow-400 border border-zinc-200 dark:border-yellow-500/30 shadow-sm dark:shadow-none'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
                title="มุมมองกะทัดรัด (Compact View)"
              >
                <LayoutList size={13} />
              </button>
            </div>
          )}
        </div>

      </div>

      <CreateCommunityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCommunityCreated={handleCreated}
      />
    </div>
  );
}
