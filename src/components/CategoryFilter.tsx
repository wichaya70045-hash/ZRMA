'use client';

import React from 'react';
import {
  Layers,
  AlertCircle,
  Terminal,
  Landmark,
  TrendingUp,
  MessageSquare,
  Atom,
  Clock,
  Flame,
  Zap,
  Award,
  Sparkles,
} from 'lucide-react';
import { RedditSort } from '@/types';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedSort: RedditSort;
  onSelectSort: (sort: RedditSort) => void;
}

const CATEGORIES = [
  { key: 'all', label: 'r/all', icon: Layers },
  { key: 'breaking', label: 'r/breaking', icon: AlertCircle, isBreaking: true },
  { key: 'tech', label: 'r/tech', icon: Terminal },
  { key: 'finance', label: 'r/finance', icon: TrendingUp },
  { key: 'society', label: 'r/society', icon: Landmark },
  { key: 'general', label: 'r/general', icon: MessageSquare },
  { key: 'science', label: 'r/science', icon: Atom },
];

export default function CategoryFilter({
  selectedCategory,
  onSelectCategory,
  selectedSort,
  onSelectSort,
}: CategoryFilterProps) {
  return (
    <div className="space-y-3">
      {/* Subreddit Horizontal Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none font-mono">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.key;
          
          let activeClasses = 'bg-yellow-400 text-zinc-950 border-yellow-400 font-bold shadow-sm';
          if (cat.isBreaking && isActive) {
            activeClasses = 'bg-red-600 text-white border-red-500 font-bold shadow-sm';
          }

          return (
            <button
              key={cat.key}
              onClick={() => onSelectCategory(cat.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border active:scale-95 ${
                isActive
                  ? activeClasses
                  : 'bg-white/[0.03] hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 border-white/[0.06] hover:border-yellow-500/30'
              }`}
            >
              <Icon
                size={13}
                strokeWidth={isActive ? 2.2 : 1.75}
                className={
                  isActive
                    ? ''
                    : cat.isBreaking
                    ? 'text-red-400'
                    : 'text-zinc-400'
                }
              />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Reddit Sort Bar: Hot, New, Top, Rising */}
      <div className="bg-[#101217] border border-white/[0.06] rounded-xl p-1.5 flex items-center justify-between gap-2 text-xs">
        <div className="inline-flex items-center gap-1">
          
          {/* Hot */}
          <button
            onClick={() => onSelectSort('hot')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors active:scale-95 ${
              selectedSort === 'hot'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
            }`}
          >
            <Flame size={14} className={selectedSort === 'hot' ? 'text-orange-400' : ''} />
            <span>Hot</span>
          </button>

          {/* New */}
          <button
            onClick={() => onSelectSort('new')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors active:scale-95 ${
              selectedSort === 'new'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
            }`}
          >
            <Sparkles size={14} className={selectedSort === 'new' ? 'text-yellow-400' : ''} />
            <span>New</span>
          </button>

          {/* Top */}
          <button
            onClick={() => onSelectSort('top')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors active:scale-95 ${
              selectedSort === 'top'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
            }`}
          >
            <Award size={14} className={selectedSort === 'top' ? 'text-red-400' : ''} />
            <span>Top</span>
          </button>

          {/* Rising */}
          <button
            onClick={() => onSelectSort('rising')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors active:scale-95 ${
              selectedSort === 'rising'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
            }`}
          >
            <TrendingUp size={14} className={selectedSort === 'rising' ? 'text-amber-400' : ''} />
            <span>Rising</span>
          </button>
        </div>

        <div className="hidden sm:block text-[11px] font-mono text-zinc-500 pr-2">
          FEED RANKING
        </div>
      </div>
    </div>
  );
}
