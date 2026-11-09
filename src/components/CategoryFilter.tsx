'use client';

import React from 'react';
import { Category } from '@/types';
import { Flame, Clock, Zap, Layers } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedSort: 'latest' | 'hot' | 'breaking';
  onSelectSort: (sort: 'latest' | 'hot' | 'breaking') => void;
}

const CATEGORIES: { key: string; label: string; icon: string }[] = [
  { key: 'all', label: 'ทั้งหมด', icon: '🌐' },
  { key: 'breaking', label: 'ข่าวด่วน', icon: '🚨' },
  { key: 'tech', label: 'เทคโนโลยี', icon: '💻' },
  { key: 'society', label: 'สังคม & การเมือง', icon: '🏛️' },
  { key: 'finance', label: 'เศรษฐกิจ & การเงิน', icon: '📈' },
  { key: 'general', label: 'ทั่วไป & พูดคุย', icon: '💬' },
  { key: 'science', label: 'วิทยาศาสตร์', icon: '🔬' },
];

export default function CategoryFilter({
  selectedCategory,
  onSelectCategory,
  selectedSort,
  onSelectSort,
}: CategoryFilterProps) {
  return (
    <div className="space-y-3 mb-6">
      {/* Category Pills (Horizontal Scrollable on Mobile) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none text-xs">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => onSelectCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-semibold'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sort Buttons */}
      <div className="flex items-center justify-between border-t border-b border-slate-800/80 py-2.5">
        <div className="flex items-center gap-1 text-slate-400 text-xs">
          <Layers className="w-3.5 h-3.5" />
          <span>เรียงตาม:</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => onSelectSort('latest')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
              selectedSort === 'latest'
                ? 'bg-slate-800 text-emerald-400 font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>ล่าสุด</span>
          </button>

          <button
            onClick={() => onSelectSort('hot')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
              selectedSort === 'hot'
                ? 'bg-slate-800 text-amber-400 font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>มาแรง</span>
          </button>

          <button
            onClick={() => onSelectSort('breaking')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
              selectedSort === 'breaking'
                ? 'bg-slate-800 text-rose-400 font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>ข่าวด่วน</span>
          </button>
        </div>
      </div>
    </div>
  );
}
