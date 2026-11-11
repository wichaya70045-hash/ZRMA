'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Terminal,
  Cpu,
  Radio,
  Key,
  Lock,
  Fingerprint,
  EyeOff,
  Binary,
  Globe,
} from 'lucide-react';
import type { AvatarFrame, BannerTheme, NameColor } from '@/types';

export const AVATAR_FRAME_CLASSES: Record<AvatarFrame, string> = {
  none: '',
  crimson: 'ring-2 ring-red-500 shadow-[0_0_10px_rgba(239,68,68,0.45)]',
  amber: 'ring-2 ring-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.45)]',
  emerald: 'ring-2 ring-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.45)]',
  neon: 'ring-2 ring-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.55)]',
  rainbow:
    'ring-2 ring-fuchsia-500 shadow-[0_0_12px_rgba(217,70,239,0.5)] bg-gradient-to-tr from-pink-500/20 via-amber-400/20 to-cyan-400/20',
};

export const AVATAR_FRAME_OPTIONS: { id: AvatarFrame; label: string; previewClass: string }[] = [
  { id: 'none', label: 'เรียบง่าย (None)', previewClass: 'border border-slate-300 dark:border-zinc-700' },
  { id: 'crimson', label: 'กรอบแดงเพลิง (Crimson)', previewClass: 'ring-2 ring-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' },
  { id: 'amber', label: 'กรอบทองคำ (Amber)', previewClass: 'ring-2 ring-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' },
  { id: 'emerald', label: 'กรอบมรกต (Emerald)', previewClass: 'ring-2 ring-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' },
  { id: 'neon', label: 'กรอบไซเบอร์ (Neon Cyan)', previewClass: 'ring-2 ring-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]' },
  { id: 'rainbow', label: 'กรอบออโรร่า (Prism)', previewClass: 'ring-2 ring-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.55)]' },
];

export const BANNER_THEME_CLASSES: Record<BannerTheme, string> = {
  obsidian: 'bg-gradient-to-r from-zinc-900 via-slate-800 to-zinc-900',
  'crimson-grid': 'bg-gradient-to-r from-red-950 via-rose-800 to-zinc-950',
  'amber-cyber': 'bg-gradient-to-r from-amber-950 via-orange-700 to-yellow-900',
  aurora: 'bg-gradient-to-r from-emerald-950 via-teal-700 to-cyan-900',
  sunset: 'bg-gradient-to-r from-purple-950 via-fuchsia-800 to-rose-800',
};

export const BANNER_THEME_OPTIONS: { id: BannerTheme; label: string; className: string }[] = [
  { id: 'obsidian', label: 'ออบซิเดียนมืด (Obsidian)', className: BANNER_THEME_CLASSES.obsidian },
  { id: 'crimson-grid', label: 'แดงข่าวด่วน (Crimson)', className: BANNER_THEME_CLASSES['crimson-grid'] },
  { id: 'amber-cyber', label: 'อำพันไซเบอร์ (Amber)', className: BANNER_THEME_CLASSES['amber-cyber'] },
  { id: 'aurora', label: 'แสงเหนือ (Aurora)', className: BANNER_THEME_CLASSES.aurora },
  { id: 'sunset', label: 'นีออนทไวไลท์ (Sunset)', className: BANNER_THEME_CLASSES.sunset },
];

export const NAME_COLOR_CLASSES: Record<NameColor, string> = {
  default: 'text-slate-700 dark:text-zinc-200',
  red: 'text-red-600 dark:text-red-400',
  amber: 'text-amber-600 dark:text-amber-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  cyan: 'text-cyan-600 dark:text-cyan-400',
  purple: 'text-purple-600 dark:text-purple-400',
  pink: 'text-pink-600 dark:text-pink-400',
};

export const NAME_COLOR_OPTIONS: { id: NameColor; label: string; swatchClass: string }[] = [
  { id: 'default', label: 'มาตรฐาน', swatchClass: 'bg-zinc-400' },
  { id: 'red', label: 'แดงคริมสัน', swatchClass: 'bg-red-500' },
  { id: 'amber', label: 'ทองอำพัน', swatchClass: 'bg-amber-400' },
  { id: 'emerald', label: 'เขียวมรกต', swatchClass: 'bg-emerald-400' },
  { id: 'cyan', label: 'ฟ้าไซเบอร์', swatchClass: 'bg-cyan-400' },
  { id: 'purple', label: 'ม่วงอเมทิสต์', swatchClass: 'bg-purple-400' },
  { id: 'pink', label: 'ชมพูนีออน', swatchClass: 'bg-pink-400' },
];

export const ICON_KEY_OPTIONS: { id: string; label: string }[] = [
  { id: 'shield', label: 'โล่ป้องกัน' },
  { id: 'terminal', label: 'เทอร์มินัล' },
  { id: 'cpu', label: 'ชิปประมวลผล' },
  { id: 'radar', label: 'เรดาร์' },
  { id: 'key', label: 'กุญแจเข้ารหัส' },
  { id: 'lock', label: 'แม่กุญแจ' },
  { id: 'fingerprint', label: 'ลายนิ้วมือ' },
  { id: 'eye-off', label: 'ไม่ระบุตัวตน' },
  { id: 'binary', label: 'ไบนารี' },
  { id: 'globe', label: 'เครือข่ายโลก' },
];

interface IdentityAvatarProps {
  iconKey?: string;
  theme?: string; // 'red' | 'yellow' | 'orange' | 'amber' | 'zinc'
  avatarUrl?: string | null;
  frame?: AvatarFrame | null;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export default function IdentityAvatar({
  iconKey = 'shield',
  theme = 'zinc',
  avatarUrl,
  frame = 'none',
  className = '',
  size = 'md',
}: IdentityAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const sizeMap = {
    xs: { box: 'w-5 h-5 rounded', iconSize: 11, stroke: 1.75 },
    sm: { box: 'w-6 h-6 rounded-md', iconSize: 13, stroke: 1.75 },
    md: { box: 'w-8 h-8 rounded-lg', iconSize: 15, stroke: 1.75 },
    lg: { box: 'w-10 h-10 rounded-xl', iconSize: 18, stroke: 1.75 },
    xl: { box: 'w-20 h-20 rounded-2xl', iconSize: 34, stroke: 1.75 },
  };

  const { box, iconSize, stroke } = sizeMap[size] || sizeMap.md;

  const renderIcon = () => {
    switch (iconKey?.toLowerCase()) {
      case 'terminal':
        return <Terminal size={iconSize} strokeWidth={stroke} />;
      case 'cpu':
        return <Cpu size={iconSize} strokeWidth={stroke} />;
      case 'radar':
        return <Radio size={iconSize} strokeWidth={stroke} />;
      case 'key':
        return <Key size={iconSize} strokeWidth={stroke} />;
      case 'lock':
        return <Lock size={iconSize} strokeWidth={stroke} />;
      case 'fingerprint':
        return <Fingerprint size={iconSize} strokeWidth={stroke} />;
      case 'eye-off':
        return <EyeOff size={iconSize} strokeWidth={stroke} />;
      case 'binary':
        return <Binary size={iconSize} strokeWidth={stroke} />;
      case 'globe':
        return <Globe size={iconSize} strokeWidth={stroke} />;
      case 'shield':
      default:
        return <Shield size={iconSize} strokeWidth={stroke} />;
    }
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'red':
        return 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/25';
      case 'yellow':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/25';
      case 'orange':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25';
      case 'amber':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25';
      case 'zinc':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/[0.04] dark:text-zinc-300 dark:border-white/[0.08]';
    }
  };

  const frameClass = frame ? AVATAR_FRAME_CLASSES[frame] || '' : '';
  const showImage = Boolean(avatarUrl && !imgError);

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden border ${getThemeClasses()} ${box} ${frameClass} ${className}`}
      aria-hidden="true"
    >
      {showImage ? (
        <img
          src={avatarUrl!}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        renderIcon()
      )}
    </div>
  );
}

interface AuthorIdentityChipProps {
  alias: string;
  avatarIcon?: string;
  avatarUrl?: string | null;
  username?: string | null;
  frame?: AvatarFrame | null;
  nameColor?: NameColor | null;
  badge?: string | null;
  avatarSize?: 'xs' | 'sm' | 'md';
  prefix?: string;
  onClickStopPropagation?: boolean;
}

export function AuthorIdentityChip({
  alias,
  avatarIcon = 'shield',
  avatarUrl,
  username,
  frame,
  nameColor,
  badge,
  avatarSize = 'xs',
  prefix = '',
  onClickStopPropagation = true,
}: AuthorIdentityChipProps) {
  const cleanName = alias.replace(/^[ur]\//i, '');
  const colorClass = nameColor ? NAME_COLOR_CLASSES[nameColor] || NAME_COLOR_CLASSES.default : NAME_COLOR_CLASSES.default;

  const content = (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <IdentityAvatar
        iconKey={avatarIcon}
        avatarUrl={avatarUrl}
        frame={frame}
        theme={frame && frame !== 'none' ? 'amber' : 'zinc'}
        size={avatarSize}
      />
      <span className={`font-medium truncate max-w-[160px] ${colorClass}`}>
        {prefix}{cleanName}
      </span>
      {badge && (
        <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[9.5px] font-bold text-amber-600 dark:text-amber-300 leading-none shrink-0">
          {badge}
        </span>
      )}
    </span>
  );

  if (username) {
    return (
      <Link
        href={`/u/${encodeURIComponent(username)}`}
        onClick={(e) => {
          if (onClickStopPropagation) e.stopPropagation();
        }}
        className="inline-flex items-center hover:underline decoration-current/50 transition-colors"
        title={`ดูโปรไฟล์ @${username}`}
      >
        {content}
      </Link>
    );
  }

  return content;
}
