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
    <div className="bg-[#101217] border border-white/[0.07] rounded-xl overflow-hidden shadow-sm w-full max-w-full">
      
      {/* 1. Subreddit Horizontal Navigation Pills */}
      <div className="px-3 pt-3 pb-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none font-mono text-xs max-w-full">
        {/* z/all */}
        <button
          onClick={() => onSelectCategory('all')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border active:scale-95 ${
            selectedCategory === 'all'
              ? 'bg-yellow-400 text-zinc-950 border-yellow-400 font-bold shadow-sm'
              : 'bg-white/[0.03] hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 border-white/[0.06]'
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

          let activeClasses = 'bg-yellow-400 text-zinc-950 border-yellow-400 font-bold shadow-sm';
          if (isBreaking && isActive) {
            activeClasses = 'bg-red-600 text-white border-red-500 font-bold shadow-sm';
          }

          return (
            <button
              key={comm.name}
              onClick={() => onSelectCategory(comm.name)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border active:scale-95 ${
                isActive
                  ? activeClasses
                  : 'bg-white/[0.03] hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 border-white/[0.06]'
              }`}
            >
              <IconComp
                size={13}
                strokeWidth={isActive ? 2.2 : 1.75}
                className={
                  isActive
                    ? ''
                    : isBreaking
                    ? 'text-red-400'
                    : 'text-zinc-400'
                }
              />
              <span>z/{comm.name}</span>
            </button>
          );
        })}

        {/* Create new z/ button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border border-dashed border-white/20 hover:border-yellow-400 text-zinc-400 hover:text-yellow-400 hover:bg-yellow-400/[0.05]"
          title="สร้างห้อง z/ ใหม่"
        >
          <Plus size={13} />
          <span>+ สร้าง z/</span>
        </button>
      </div>

      {/* 2. Unified Controls Bar: Sort + Search + View Layout */}
      <div className="px-3 py-2 border-t border-white/[0.06] bg-black/20 flex flex-wrap items-center justify-between gap-2.5 text-xs w-full">
        
        {/* Left: Reddit Sorting Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5 sm:pb-0 scrollbar-none">
          <button
            onClick={() => onSelectSort('hot')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors shrink-0 ${
              selectedSort === 'hot'
                ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
            }`}
          >
            <Flame size={13} className={selectedSort === 'hot' ? 'text-orange-400' : ''} />
            <span>Hot</span>
          </button>

          <button
            onClick={() => onSelectSort('new')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors shrink-0 ${
              selectedSort === 'new'
                ? 'bg-yellow-400 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
            }`}
          >
            <Sparkles size={13} />
            <span>New</span>
          </button>

          <button
            onClick={() => onSelectSort('top')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors shrink-0 ${
              selectedSort === 'top'
                ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
            }`}
          >
            <Award size={13} className={selectedSort === 'top' ? 'text-yellow-400' : ''} />
            <span>Top</span>
          </button>

          <button
            onClick={() => onSelectSort('rising')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors shrink-0 ${
              selectedSort === 'rising'
                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
            }`}
          >
            <Zap size={13} className={selectedSort === 'rising' ? 'text-red-400' : ''} />
            <span>Rising</span>
          </button>
        </div>

        {/* Center/Right: Integrated Minimal Search Input */}
        {onSearchChange && (
          <div className="relative flex-1 min-w-[120px] sm:min-w-[140px] max-w-xs order-last sm:order-none w-full sm:w-auto">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหาในฟีด..."
              className="w-full bg-[#141721] border border-white/[0.08] focus:border-red-500/50 rounded-lg pl-7 pr-6 py-1 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
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
            <div className="flex items-center gap-0.5 bg-black/40 p-0.5 rounded-lg border border-white/[0.06]">
              <button
                type="button"
                onClick={() => onLayoutChange('card')}
                className={`p-1 rounded transition-colors ${
                  layout === 'card'
                    ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                    : 'text-zinc-500 hover:text-zinc-300'
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
                    ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                    : 'text-zinc-500 hover:text-zinc-300'
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
