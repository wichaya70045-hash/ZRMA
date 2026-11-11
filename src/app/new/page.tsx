'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Community,
  CaptchaChallenge,
  MediaType,
  MarketCondition,
  MarketDelivery,
} from '@/types';
import {
  getScopedIdentity,
  rerollScopedIdentity,
  setCustomScopedIdentity,
  saveAuthoredThread,
  AnonymousIdentity,
} from '@/lib/privacy';
import { useSettings } from '@/lib/settings';
import { useAuth } from '@/lib/authContext';
import IdentityAvatar, { NAME_COLOR_CLASSES } from '@/components/IdentityAvatar';
import CreateCommunityModal from '@/components/CreateCommunityModal';
import {
  ArrowLeft,
  Send,
  Link as LinkIcon,
  AlertCircle,
  RefreshCw,
  Dices,
  Clock,
  Terminal,
  ShieldCheck,
  UploadCloud,
  Image as ImageIcon,
  Film,
  X,
  Plus,
  Check,
  Flame,
  Zap,
  Globe,
  Cpu,
  Radar,
  MessageSquare,
  Atom,
  TrendingUp,
  Lock,
  Key,
  BarChart2,
  Trash2,
  Briefcase,
  Wrench,
  Tag,
  Banknote,
  Truck,
  MapPin,
  Phone,
  Sparkles,
  PackageCheck,
  PackageX,
  ChevronDown,
} from 'lucide-react';

const EXPIRY_OPTIONS = [
  { hours: 24, label: '24 ชั่วโมง', desc: 'ข่าวด่วน เหตุการณ์เฉพาะหน้า' },
  { hours: 72, label: '3 วัน', desc: 'ประเด็นที่อยู่ในกระแส' },
  { hours: 168, label: '7 วัน', desc: 'สาระและการแลกเปลี่ยนเชิงลึก' },
];

const ICON_MAP: Record<string, any> = {
  terminal: Terminal,
  flame: Flame,
  zap: Zap,
  cpu: Cpu,
  radar: Radar,
  globe: Globe,
  briefcase: Briefcase,
  tag: Tag,
  atom: Atom,
  trending: TrendingUp,
  chat: MessageSquare,
  alert: AlertCircle,
};

const JOB_QUICK_TAGS = [
  { label: '💻 เว็บ & โค้ด', name: 'งานไอที/โปรแกรมเมอร์', skill: 'Next.js' },
  { label: '🎨 กราฟิก & UI', name: 'งานออกแบบกราฟิก', skill: 'Figma' },
  { label: '🎬 ตัดต่อคลิป', name: 'งานตัดต่อวิดีโอ', skill: 'Premiere Pro' },
  { label: '✍️ บทความ & แปล', name: 'งานเขียน/แปลภาษา', skill: 'Content' },
  { label: '📱 การตลาด & ยิงแอด', name: 'การตลาดออนไลน์', skill: 'Digital Marketing' },
  { label: '🎧 แอดมิน & ตอบแชท', name: 'งานแอดมินเพจ', skill: 'Admin' },
];

const MARKET_QUICK_TAGS = [
  '📱 ไอที/มือถือ',
  '💻 คอมพิวเตอร์',
  '🎮 เกม & คอนโซล',
  '👗 แฟชั่น/เสื้อผ้า',
  '📚 หนังสือ/คอร์ส',
  '🛋️ ของใช้ในบ้าน',
  '🚗 ยานพาหนะ',
  '💾 ซอฟต์แวร์/คีย์',
];

export default function NewThreadPage() {
  const router = useRouter();
  const { settings } = useSettings();
  const { user } = useAuth();
  const [postAnonymously, setPostAnonymously] = useState(false);
  const usingAccount = Boolean(user && !postAnonymously);

  // Post Mode: 'general' | 'job' | 'market'
  const [postMode, setPostMode] = useState<'general' | 'job' | 'market'>('general');

  // Common Thread Fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('general');
  const [customCategory, setCustomCategory] = useState('');
  const [flair, setFlair] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [expiresHours, setExpiresHours] = useState<number>(72);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaData, setCaptchaData] = useState<CaptchaChallenge | null>(null);
  const [editPasscode, setEditPasscode] = useState('');
  const [showAdvancedPasscode, setShowAdvancedPasscode] = useState(false);

  // Community Poll state
  const [hasPoll, setHasPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  // Job / Hiring Marketplace state
  const [jobType, setJobType] = useState<'hiring' | 'seeking'>('hiring');
  const [jobBudget, setJobBudget] = useState('');
  const [jobWorkMode, setJobWorkMode] = useState<'remote' | 'onsite' | 'hybrid'>('remote');
  const [jobSkills, setJobSkills] = useState('');
  const [jobContact, setJobContact] = useState('');

  // Marketplace (Selling/Items) state
  const [marketPrice, setMarketPrice] = useState('');
  const [marketCondition, setMarketCondition] = useState<MarketCondition>('used');
  const [marketDelivery, setMarketDelivery] = useState<MarketDelivery>('shipping');
  const [marketLocation, setMarketLocation] = useState('');
  const [marketContact, setMarketContact] = useState('');

  // Author Display Name
  const [identity, setIdentity] = useState<AnonymousIdentity | null>(null);
  const [customAuthorAlias, setCustomAuthorAlias] = useState('');

  // Media Upload & Attachment
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [mediaTab, setMediaTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Communities
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isCreateCommModalOpen, setIsCreateCommModalOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const id = getScopedIdentity('create_thread_session');
    setIdentity(id);
    setCustomAuthorAlias(id.alias);
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setEditPasscode(randomPin);

    // Auto-detect mode from query params
    try {
      const sp = new URLSearchParams(window.location.search);
      const modeParam = sp.get('mode');
      const jobParam = sp.get('job');
      const marketParam = sp.get('market');
      const catParam = sp.get('category');

      if (jobParam === 'hiring' || jobParam === 'seeking' || catParam === 'jobs' || modeParam === 'job') {
        setPostMode('job');
        if (jobParam === 'seeking' || jobParam === 'hiring') setJobType(jobParam);
        setCategory('jobs');
      } else if (marketParam === 'true' || catParam === 'market' || modeParam === 'market') {
        setPostMode('market');
        setCategory('market');
      }
    } catch {}
  }, []);

  const fetchCommunities = async () => {
    try {
      const res = await fetch('/api/communities');
      const data = await res.json();
      if (data.communities) {
        setCommunities(data.communities);
      }
    } catch (err) {
      console.error('Error fetching communities:', err);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCaptcha = async () => {
    try {
      const res = await fetch('/api/captcha');
      const data = await res.json();
      setCaptchaData(data);
      setCaptchaAnswer('');
    } catch (err) {
      console.error('Error fetching captcha:', err);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleRerollIdentity = () => {
    const newId = rerollScopedIdentity('create_thread_session');
    setIdentity(newId);
    setCustomAuthorAlias(newId.alias);
  };

  const handleAliasChange = (val: string) => {
    setCustomAuthorAlias(val);
    setCustomScopedIdentity('create_thread_session', val);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setMediaUrl(data.url);
        setMediaType(data.media_type);
      } else {
        setUploadError(data.error || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
      }
    } catch {
      setUploadError('ไม่สามารถอัปโหลดไฟล์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyUrlMedia = () => {
    if (!urlInput.trim()) return;
    const url = urlInput.trim();
    const isVid = /\.(mp4|webm|mov)$/i.test(url);
    setMediaUrl(url);
    setMediaType(isVid ? 'video' : 'image');
    setUrlInput('');
  };

  const handleRemoveMedia = () => {
    setMediaUrl(null);
    setMediaType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCommunityCreated = (newComm: Community) => {
    setCommunities((prev) => [newComm, ...prev.filter((c) => c.name !== newComm.name)]);
    setCategory(newComm.name);
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 8) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      if (postMode === 'job') {
        setErrorMsg('กรุณาระบุชื่องานหรือสิ่งที่คุณต้องการ (Job Title)');
      } else if (postMode === 'market') {
        setErrorMsg('กรุณาระบุชื่อสินค้าที่ต้องการขาย (Item Name)');
      } else {
        setErrorMsg('กรุณาระบุหัวข้อกระทู้');
      }
      return;
    }

    if (postMode === 'general' && hasPoll) {
      const validOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        setErrorMsg('หากต้องการเปิดโพล ต้องระบุตัวเลือกอย่างน้อย 2 ตัวเลือก');
        return;
      }
    }

    if (!captchaAnswer.trim() || !captchaData?.token) {
      setErrorMsg('กรุณากรอกคำตอบคำถามยืนยันความปลอดภัย');
      return;
    }

    let finalCategory = category || 'general';
    if (postMode === 'job') {
      finalCategory = 'jobs';
    } else if (postMode === 'market') {
      finalCategory = 'market';
    } else if (customCategory.trim()) {
      finalCategory = customCategory
        .trim()
        .toLowerCase()
        .replace(/^[zr]\//i, '')
        .replace(/[^a-z0-9_]/g, '');
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        title: title.trim(),
        content: content.trim(),
        category: finalCategory,
        flair: flair.trim() || null,
        source_url: postMode === 'general' ? (sourceUrl.trim() || null) : null,
        media_url: mediaUrl || null,
        media_type: mediaType || null,
        has_poll: postMode === 'general' ? hasPoll : false,
        poll_question: postMode === 'general' && hasPoll ? (pollQuestion.trim() || null) : null,
        poll_options: postMode === 'general' && hasPoll ? pollOptions.map((o) => o.trim()).filter(Boolean) : [],
        has_job: postMode === 'job',
        job: postMode === 'job'
          ? {
              job_type: jobType,
              budget: jobBudget.trim() || null,
              work_mode: jobWorkMode,
              skills: jobSkills,
              contact_info: jobContact.trim() || null,
            }
          : null,
        has_market: postMode === 'market',
        market: postMode === 'market'
          ? {
              item_name: title.trim(),
              price: marketPrice.trim() || null,
              condition: marketCondition,
              delivery: marketDelivery,
              location: marketLocation.trim() || null,
              contact_info: marketContact.trim() || null,
            }
          : null,
        author_alias: customAuthorAlias.trim() || identity?.alias || 'u/นิรนาม #????',
        author_avatar: identity?.avatarIcon || 'terminal',
        post_anonymously: postAnonymously,
        is_pinned: isPinned && postMode === 'general' ? 1 : 0,
        expires_hours: expiresHours,
        edit_token: editPasscode.trim(),
        captcha_token: captchaData.token,
        captcha_answer: captchaAnswer.trim(),
      };

      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.thread) {
        if (data.edit_token) {
          saveAuthoredThread(data.thread.id, data.edit_token);
        }
        if (settings.strictZeroTrace) {
          rerollScopedIdentity('new_thread');
        }
        router.push(`/thread/${data.thread.id}`);
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการสร้างกระทู้');
        fetchCaptcha();
      }
    } catch {
      setErrorMsg('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      fetchCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl w-full mx-auto space-y-4 overflow-hidden">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-yellow-400 transition-colors"
        >
          <ArrowLeft size={13} />
          <span>กลับหน้าบอร์ด</span>
        </Link>
      </div>

      <div className="bg-white dark:bg-[#0e1015]/90 border border-zinc-200 dark:border-white/[0.08] rounded-xl p-4 sm:p-6 text-zinc-800 dark:text-zinc-200 shadow-sm dark:shadow-xl backdrop-blur-sm w-full max-w-full overflow-hidden space-y-5">
        
        {/* Header with Ephemeral Identity & Custom Name */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 font-medium">
                โพสต์นิรนาม • Zero-Log
              </span>
            </div>
            <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {postMode === 'job'
                ? '💼 ลงประกาศงาน (Fast Job Post)'
                : postMode === 'market'
                ? '🏷️ ลงขายของมือสอง (Marketplace)'
                : 'สร้างกระทู้ใหม่'}
            </h1>
          </div>

          {/* Account Identity Chip vs Anonymous Scoped Identity */}
          {usingAccount && user ? (
            <div className="flex items-center gap-2.5 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.08] px-3 py-1.5 rounded-lg self-start sm:self-auto max-w-full overflow-hidden">
              <IdentityAvatar
                iconKey={user.avatar_icon}
                avatarUrl={user.avatar_url}
                frame={user.avatar_frame}
                theme={user.avatar_frame !== 'none' ? 'amber' : 'zinc'}
                size="xs"
              />
              <div className="min-w-0">
                <span className="text-[10px] text-zinc-500 uppercase block font-mono">โพสต์ด้วยบัญชี:</span>
                <span className={`text-xs font-semibold truncate block max-w-[140px] ${NAME_COLOR_CLASSES[user.name_color]}`}>
                  {user.display_name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPostAnonymously(true)}
                className="px-2 py-1 text-[10.5px] font-medium rounded border border-zinc-200 dark:border-white/[0.1] text-zinc-600 dark:text-zinc-300 hover:border-amber-500/40 transition-colors shrink-0"
                title="สลับไปโพสต์แบบไม่ระบุตัวตน"
              >
                ซ่อนตัวตน
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.08] px-3 py-1.5 rounded-lg self-start sm:self-auto max-w-full overflow-hidden">
              {user && postAnonymously && (
                <button
                  type="button"
                  onClick={() => setPostAnonymously(false)}
                  className="px-2 py-1 text-[10.5px] font-medium rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 shrink-0"
                >
                  ใช้บัญชี
                </button>
              )}
              {identity && <IdentityAvatar iconKey={identity.avatarIcon} theme="red" size="xs" />}
              <div className="min-w-0">
                <span className="text-[10px] text-zinc-500 uppercase block font-mono">ชื่อที่จะแสดง (u/):</span>
                <input
                  type="text"
                  value={customAuthorAlias}
                  onChange={(e) => handleAliasChange(e.target.value)}
                  placeholder="u/ชื่อที่คุณต้องการ"
                  maxLength={40}
                  className="bg-transparent text-xs font-semibold text-zinc-900 dark:text-zinc-200 focus:outline-none focus:text-amber-600 dark:focus:text-yellow-400 font-mono w-28 sm:w-36"
                />
              </div>
              <button
                type="button"
                onClick={handleRerollIdentity}
                className="p-1 text-zinc-500 hover:text-amber-600 dark:hover:text-yellow-400 rounded hover:bg-zinc-200/70 dark:hover:bg-white/[0.06] transition-colors ml-1 active:scale-95 shrink-0"
                title="สุ่มชื่อใหม่ (Random Reroll)"
              >
                <Dices size={14} />
              </button>
            </div>
          )}
        </div>

        {/* 1. Fast Post Type Switcher Tabs */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            เลือกรูปแบบการโพสต์:
          </div>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setPostMode('general');
                if (category === 'jobs' || category === 'market') setCategory('general');
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg transition-all ${
                postMode === 'general'
                  ? 'bg-white dark:bg-[#181a20] text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-200 dark:border-white/[0.1] font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <MessageSquare size={13} className={postMode === 'general' ? 'text-red-500' : ''} />
              <span>โพสต์ทั่วไป</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPostMode('job');
                setCategory('jobs');
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg transition-all ${
                postMode === 'job'
                  ? 'bg-white dark:bg-[#181a20] text-emerald-600 dark:text-emerald-400 shadow-xs border border-emerald-300 dark:border-emerald-500/30 font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Briefcase size={13} className={postMode === 'job' ? 'text-emerald-500' : ''} />
              <span>ประกาศงาน (ด่วน)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPostMode('market');
                setCategory('market');
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg transition-all ${
                postMode === 'market'
                  ? 'bg-white dark:bg-[#181a20] text-amber-600 dark:text-yellow-400 shadow-xs border border-amber-300 dark:border-yellow-500/30 font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Tag size={13} className={postMode === 'market' ? 'text-amber-500' : ''} />
              <span>ลงขายของ (ใหม่)</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle size={14} className="text-red-600 dark:text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* ======================================================== */}
          {/* MODE A: STREAMLINED JOB POSTING (REDUCED STEPS)           */}
          {/* ======================================================== */}
          {postMode === 'job' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Step 1: Hiring vs Seeking */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400 font-bold flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>เลือกประเภทประกาศงาน</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setJobType('hiring')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      jobType === 'hiring'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500/40'
                        : 'border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.02] text-zinc-700 dark:text-zinc-400 hover:border-emerald-400/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm mb-0.5">
                      <Briefcase size={14} className={jobType === 'hiring' ? 'text-emerald-600 dark:text-emerald-400' : ''} />
                      <span>ประกาศจ้างงาน (หาคนทำ)</span>
                    </div>
                    <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400">สำหรับผู้ว่าจ้างที่ต้องการหาคนมาช่วยงาน</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setJobType('seeking')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      jobType === 'seeking'
                        ? 'border-sky-500 bg-sky-500/10 text-sky-800 dark:text-sky-300 shadow-xs ring-1 ring-sky-500/40'
                        : 'border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.02] text-zinc-700 dark:text-zinc-400 hover:border-sky-400/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm mb-0.5">
                      <Wrench size={14} className={jobType === 'seeking' ? 'text-sky-600 dark:text-sky-400' : ''} />
                      <span>เสนอตัวรับงาน (ฟรีแลนซ์)</span>
                    </div>
                    <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400">สำหรับฟรีแลนซ์/คนทำงานที่ต้องการรับงาน</p>
                  </button>
                </div>
              </div>

              {/* Step 2: Title & Quick Category Tags */}
              <div className="space-y-2">
                <label htmlFor="title" className="text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400 font-bold flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>ชื่องาน / ตำแหน่งงานที่ต้องการ {jobType === 'hiring' ? 'จ้าง' : 'รับทำ'}</span>
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={jobType === 'hiring' ? 'เช่น หาคนทำเว็บ Next.js + Tailwind, หาแอดมินตอบแชทเพจ' : 'เช่น รับตัดต่อวิดีโอสั้น Reels/TikTok, รับวาดภาพประกอบและออกแบบโลโก้'}
                  maxLength={200}
                  className="w-full bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                />

                {/* Quick position pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-mono">เลือกแท็กด่วน:</span>
                  {JOB_QUICK_TAGS.map((tag) => (
                    <button
                      key={tag.name}
                      type="button"
                      onClick={() => {
                        if (!title) setTitle(jobType === 'hiring' ? `หาคน${tag.name}` : `รับทำ${tag.name}`);
                        setFlair(tag.name);
                        const curSkills = jobSkills.split(',').map((s) => s.trim()).filter(Boolean);
                        if (!curSkills.includes(tag.skill)) {
                          setJobSkills([...curSkills, tag.skill].join(', '));
                        }
                      }}
                      className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/[0.04] hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-zinc-200 dark:border-white/[0.08] text-[11px] text-zinc-700 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Budget & Work Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-xl bg-zinc-50/70 dark:bg-black/30 border border-zinc-200/80 dark:border-white/[0.06]">
                {/* Budget */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400 font-bold flex items-center gap-1">
                    <Banknote size={13} className="text-amber-500" />
                    <span>3. งบประมาณ / ค่าตอบแทน</span>
                  </label>
                  <input
                    type="text"
                    value={jobBudget}
                    onChange={(e) => setJobBudget(e.target.value)}
                    placeholder="เช่น ฿5,000, ฿15,000 - ฿25,000, หรือตามตกลง"
                    maxLength={80}
                    className="w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/[0.08] focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {['฿500 - ฿1,000', '฿3,000 - ฿5,000', '฿10,000+', 'ตามตกลง'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setJobBudget(p)}
                        className={`px-2 py-0.5 rounded text-[10.5px] border transition-colors ${
                          jobBudget === p
                            ? 'bg-amber-500 text-white border-amber-500 font-bold'
                            : 'bg-white dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/[0.08] hover:border-amber-400'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Work Mode */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400 font-bold flex items-center gap-1">
                    <MapPin size={13} className="text-red-500" />
                    <span>รูปแบบการทำงาน</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                    {(['remote', 'onsite', 'hybrid'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setJobWorkMode(mode)}
                        className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold transition-all ${
                          jobWorkMode === mode
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500/40'
                            : 'border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-black/30 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                        }`}
                      >
                        {mode === 'remote' ? '🌐 Remote' : mode === 'onsite' ? '🏢 Onsite' : '🔄 Hybrid'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono pt-0.5">
                    {jobWorkMode === 'remote'
                      ? 'ทำงานออนไลน์ 100% จากที่ไหนก็ได้'
                      : jobWorkMode === 'onsite'
                      ? 'ทำงานที่สถานที่/ออฟฟิศ'
                      : 'ทำงานผสมผสานออฟฟิศ/บ้าน'}
                  </p>
                </div>

                {/* Skills */}
                <div className="sm:col-span-2 space-y-1.5 pt-1 border-t border-zinc-200 dark:border-white/[0.06]">
                  <label className="text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400 font-semibold flex items-center justify-between">
                    <span>ทักษะที่เกี่ยวข้อง / Skills (พิมพ์หรือกดเลือกแท็ก):</span>
                    <span className="text-[10px] text-zinc-400 font-mono">คั่นด้วยจุลภาค (,)</span>
                  </label>
                  <input
                    type="text"
                    value={jobSkills}
                    onChange={(e) => setJobSkills(e.target.value)}
                    placeholder="เช่น React, Next.js, Figma, Premiere Pro"
                    maxLength={120}
                    className="w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/[0.08] focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none font-mono"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['React', 'Next.js', 'TypeScript', 'Figma', 'Python', 'Premiere Pro', 'Photoshop', 'SEO / Ads'].map((s) => {
                      const hasSkill = jobSkills.split(',').map((x) => x.trim().toLowerCase()).includes(s.toLowerCase());
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            const parts = jobSkills.split(',').map((x) => x.trim()).filter(Boolean);
                            if (hasSkill) {
                              setJobSkills(parts.filter((x) => x.toLowerCase() !== s.toLowerCase()).join(', '));
                            } else {
                              setJobSkills([...parts, s].join(', '));
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-[10.5px] font-mono border transition-colors ${
                            hasSkill
                              ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                              : 'bg-white dark:bg-white/[0.04] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/[0.08] hover:border-emerald-500'
                          }`}
                        >
                          +{s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Step 4: Job Description & Contact */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="content" className="text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400 font-bold flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">4</span>
                    <span>รายละเอียดงาน / ขอบเขตงาน และสิ่งที่ต้องส่งมอบ</span>
                  </label>
                  <textarea
                    id="content"
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={jobType === 'hiring' ? 'ระบุขอบเขตงาน สิ่งที่ต้องการให้ทำ หรือกำหนดส่งงาน...' : 'แนะนำตัว ผลงานที่เคยทำ ความถนัด และระยะเวลาที่สามารถส่งงานได้...'}
                    className="w-full bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] focus:border-emerald-500 rounded-xl p-3 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400 font-semibold flex items-center gap-1.5">
                    <Phone size={13} className="text-amber-500" />
                    <span>ช่องทางติดต่อกลับ (Line ID, Telegram หรือเบอร์โทร):</span>
                  </label>
                  <input
                    type="text"
                    value={jobContact}
                    onChange={(e) => setJobContact(e.target.value)}
                    placeholder="เช่น Line: @myline หรือพิมพ์คุยในแชทกระทู้"
                    maxLength={160}
                    className="w-full bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODE B: STREAMLINED MARKETPLACE POSTING (ขายของ)          */}
          {/* ======================================================== */}
          {postMode === 'market' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Step 1: Item Name / Title & Quick Category Tags */}
              <div className="space-y-2">
                <label htmlFor="title" className="text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400 font-bold flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>ชื่อสินค้าที่ต้องการลงขาย (Item Name)</span>
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น ขาย iPad Air 5 64GB สีเทาสเปซเกรย์ สภาพ 98% กล่องครบ, ขายหูฟังไร้สาย Sony WH-1000XM4"
                  maxLength={200}
                  className="w-full bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                />

                {/* Quick market category tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-mono">หมวดสินค้า:</span>
                  {MARKET_QUICK_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setFlair(tag)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${
                        flair === tag
                          ? 'bg-amber-500 text-white border-amber-500 font-bold'
                          : 'bg-zinc-100 dark:bg-white/[0.04] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/[0.08] hover:border-amber-400'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Price & Condition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-xl bg-zinc-50/70 dark:bg-black/30 border border-zinc-200/80 dark:border-white/[0.06]">
                {/* Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400 font-bold flex items-center gap-1">
                    <Banknote size={13} className="text-emerald-600 dark:text-emerald-400" />
                    <span>2. ราคาขาย (Price)</span>
                  </label>
                  <input
                    type="text"
                    value={marketPrice}
                    onChange={(e) => setMarketPrice(e.target.value)}
                    placeholder="เช่น ฿1,500, ฿12,900, ฟรี, ต่อรองได้"
                    maxLength={60}
                    className="w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/[0.08] focus:border-amber-500 rounded-lg px-3 py-2 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none font-bold text-emerald-600 dark:text-emerald-400"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {['฿500', '฿1,000', '฿2,500', '฿5,000', '฿10,000', 'ต่อรองได้', 'ฟรี'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setMarketPrice(p)}
                        className={`px-2 py-0.5 rounded text-[10.5px] border transition-colors ${
                          marketPrice === p
                            ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                            : 'bg-white dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/[0.08] hover:border-emerald-500'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Condition */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400 font-bold flex items-center gap-1">
                    <Tag size={13} className="text-amber-500" />
                    <span>สภาพสินค้า (Condition)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    {[
                      { id: 'new', label: '✨ มือ 1 (ใหม่แกะกล่อง)' },
                      { id: 'like_new', label: '📦 มือ 2 สภาพดีมาก' },
                      { id: 'used', label: '🛠️ มือ 2 มีรอยใช้งาน' },
                      { id: 'digital', label: '💾 ดิจิทัล / ซอฟต์แวร์' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setMarketCondition(c.id as MarketCondition)}
                        className={`py-1.5 px-2 text-left rounded-lg border text-[11px] font-semibold transition-all ${
                          marketCondition === c.id
                            ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-yellow-300 ring-1 ring-amber-500/40'
                            : 'border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-black/30 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 3: Product Image */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400 font-bold flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">3</span>
                    <ImageIcon size={13} className="text-amber-600 dark:text-yellow-400" />
                    <span>รูปถ่ายสินค้า (สำคัญมากเพื่อความน่าเชื่อถือ)</span>
                  </label>
                  <div className="flex items-center gap-1 text-[11px] font-mono">
                    <button
                      type="button"
                      onClick={() => setMediaTab('upload')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        mediaTab === 'upload' ? 'bg-zinc-200 dark:bg-white/[0.1] text-amber-700 dark:text-yellow-400 font-bold' : 'text-zinc-500'
                      }`}
                    >
                      อัปโหลด
                    </button>
                    <span className="text-zinc-300">|</span>
                    <button
                      type="button"
                      onClick={() => setMediaTab('url')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        mediaTab === 'url' ? 'bg-zinc-200 dark:bg-white/[0.1] text-amber-700 dark:text-yellow-400 font-bold' : 'text-zinc-500'
                      }`}
                    >
                      ใส่ลิงก์
                    </button>
                  </div>
                </div>

                {mediaUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-amber-400/50 bg-zinc-100 dark:bg-black/60 p-2">
                    <img
                      src={mediaUrl}
                      alt="Uploaded product preview"
                      className="w-full max-h-64 rounded object-contain bg-black"
                    />
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-200 dark:border-white/[0.08] text-xs">
                      <span className="truncate max-w-xs text-zinc-500 font-mono text-[11px]">{mediaUrl}</span>
                      <button
                        type="button"
                        onClick={handleRemoveMedia}
                        className="text-red-500 text-[11px] font-mono px-2 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        ลบรูป
                      </button>
                    </div>
                  </div>
                ) : mediaTab === 'upload' ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-300 dark:border-white/[0.12] hover:border-amber-500 bg-zinc-50 dark:bg-white/[0.01] rounded-xl p-5 text-center cursor-pointer transition-colors space-y-1.5"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-yellow-400/10 text-amber-600 dark:text-yellow-400 flex items-center justify-center mx-auto">
                      <UploadCloud size={16} />
                    </div>
                    <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {isUploading ? 'กำลังอัปโหลดรูปภาพ...' : 'คลิกเพื่อเลือกรูปสินค้า'}
                    </div>
                    <div className="text-[10px] text-zinc-500">รองรับ JPG, PNG, WEBP (สูงสุด 15MB)</div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/product.jpg"
                      className="flex-1 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] focus:border-amber-500 rounded-lg px-3 py-2 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrlMedia}
                      className="btn-secondary text-xs !py-2 shrink-0"
                    >
                      แนบรูป
                    </button>
                  </div>
                )}
              </div>

              {/* Step 4: Delivery, Contact & Details */}
              <div className="space-y-3.5">
                {/* Delivery */}
                <div className="p-3 rounded-xl bg-zinc-50/70 dark:bg-black/30 border border-zinc-200/80 dark:border-white/[0.06] space-y-2">
                  <label className="text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400 font-bold flex items-center gap-1.5">
                    <Truck size={13} className="text-sky-500" />
                    <span>4. การจัดส่ง / รับสินค้า</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'shipping', label: '🚚 ส่งพัสดุด่วน', desc: 'Flash / Kerry / EMS' },
                      { id: 'meetup', label: '🤝 นัดรับมือ', desc: 'พบเจอนัดรับของ' },
                      { id: 'online', label: '📧 ส่งออนไลน์', desc: 'ดิจิทัลไฟล์/โค้ด' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setMarketDelivery(d.id as MarketDelivery)}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          marketDelivery === d.id
                            ? 'border-sky-500 bg-sky-500/15 text-sky-800 dark:text-sky-300 ring-1 ring-sky-500/40'
                            : 'border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-black/30 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        <div className="font-bold text-xs">{d.label}</div>
                        <div className="text-[10px] text-zinc-500">{d.desc}</div>
                      </button>
                    ))}
                  </div>

                  {marketDelivery === 'meetup' && (
                    <div className="pt-1.5">
                      <input
                        type="text"
                        value={marketLocation}
                        onChange={(e) => setMarketLocation(e.target.value)}
                        placeholder="ระบุสถานที่นัดรับ เช่น BTS สยาม / ฟิวเจอร์พาร์ครังสิต"
                        maxLength={100}
                        className="w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/[0.08] focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Contact */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400 font-bold flex items-center gap-1.5">
                    <Phone size={13} className="text-amber-500" />
                    <span>ช่องทางติดต่อผู้ขาย (Line ID / เบอร์โทร / Facebook):</span>
                  </label>
                  <input
                    type="text"
                    value={marketContact}
                    onChange={(e) => setMarketContact(e.target.value)}
                    placeholder="เช่น Line: @seller_shop, Tel: 08x-xxx-xxxx"
                    maxLength={160}
                    className="w-full bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none font-mono"
                  />
                </div>

                {/* Content / Product details */}
                <div className="space-y-1.5">
                  <label htmlFor="content" className="text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400 font-bold">
                    รายละเอียดสินค้าเพิ่มเติม (อุปกรณ์ในกล่อง, ประกัน, ตำหนิ):
                  </label>
                  <textarea
                    id="content"
                    rows={3}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="เช่น ประกันศูนย์เหลือถึงสิ้นปี, อุปกรณ์ครบกล่อง, ไม่เคยตกหล่น..."
                    className="w-full bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] focus:border-amber-500 rounded-xl p-3 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed font-sans"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODE C: GENERAL DISCUSSION THREAD                        */}
          {/* ======================================================== */}
          {postMode === 'general' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Subreddit / Community Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400">
                    1. เลือกห้องชุมชน (Subreddit)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreateCommModalOpen(true)}
                    className="text-[11px] font-mono text-amber-600 dark:text-yellow-400 hover:underline flex items-center gap-1"
                  >
                    <Plus size={11} />
                    <span>สร้างห้อง z/ ใหม่</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {communities.map((comm) => {
                    const IconComp = ICON_MAP[comm.icon] || Terminal;
                    const isSelected = category === comm.name && !customCategory;
                    return (
                      <button
                        key={comm.name}
                        type="button"
                        onClick={() => {
                          setCategory(comm.name);
                          setCustomCategory('');
                        }}
                        className={`p-2.5 rounded-lg border text-left transition-colors active:scale-95 ${
                          isSelected
                            ? 'border-red-500/70 bg-red-50 dark:bg-red-500/[0.08] shadow-sm'
                            : 'border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-white/[0.02] hover:border-amber-400/50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <IconComp size={14} className={isSelected ? 'text-red-600 dark:text-red-400' : 'text-zinc-500'} />
                          <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">z/{comm.name}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 line-clamp-1">{comm.description}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Subreddit */}
                <div className="pt-1">
                  <div className="flex items-center bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.08] focus-within:border-red-500 rounded-lg px-3 py-1.5 text-xs">
                    <span className="text-zinc-500 font-mono font-bold mr-1">หรือพิมพ์ชื่อห้องเอง: z/</span>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="เช่น crypto, ai, gaming, memes"
                      maxLength={30}
                      className="bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none w-full font-mono"
                    />
                  </div>
                </div>

                {/* Pinned Breaking Wire Toggle */}
                {(category === 'breaking' || customCategory.toLowerCase() === 'breaking') && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/50 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                      <div>
                        <div className="text-xs font-bold text-red-700 dark:text-red-300">
                          📌 ปักหมุดข่าวด่วนพิเศษ (Pin Breaking Live Wire)
                        </div>
                        <div className="text-[10px] text-zinc-600 dark:text-zinc-400">
                          จะถูกปักหมุดบนสุดของ z/breaking พร้อมเวลาอัปเดตแบบเรียลไทม์
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={isPinned}
                        onChange={(e) => setIsPinned(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-300 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label htmlFor="title" className="text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400">
                  2. หัวข้อโพสต์ (Title)
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ระบุหัวข้อให้ชัดเจนและตรงประเด็น..."
                  maxLength={200}
                  className="w-full bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] focus:border-red-500 rounded-lg px-3 py-2 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-red-500 font-sans"
                />
              </div>

              {/* Post Flair */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                  <span>แท็กโพสต์ / Flair (ไม่บังคับ)</span>
                  <span className="text-[10px] text-zinc-400 font-mono">OPTIONAL</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['ข่าวด่วน', 'เสวนา', 'ข้อสงสัย', 'วิเคราะห์', 'มีม/บันเทิง', 'สาระ'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setFlair(flair === tag ? '' : tag)}
                      className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                        flair === tag
                          ? 'bg-yellow-400 text-zinc-950 border-yellow-400 font-bold'
                          : 'bg-zinc-100 dark:bg-white/[0.02] text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-white/[0.08] hover:border-amber-400'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Media Attachment */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <ImageIcon size={13} className="text-amber-600 dark:text-yellow-400" />
                    <span>3. แนบรูปภาพ หรือ วิดีโอ (Media Attachment)</span>
                  </label>
                  <div className="flex items-center gap-1 text-[11px] font-mono">
                    <button
                      type="button"
                      onClick={() => setMediaTab('upload')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        mediaTab === 'upload' ? 'bg-zinc-200 dark:bg-white/[0.1] text-amber-700 dark:text-yellow-400 font-bold' : 'text-zinc-500'
                      }`}
                    >
                      อัปโหลดไฟล์
                    </button>
                    <span className="text-zinc-300 dark:text-zinc-600">|</span>
                    <button
                      type="button"
                      onClick={() => setMediaTab('url')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        mediaTab === 'url' ? 'bg-zinc-200 dark:bg-white/[0.1] text-amber-700 dark:text-yellow-400 font-bold' : 'text-zinc-500'
                      }`}
                    >
                      ใส่ลิงก์ URL
                    </button>
                  </div>
                </div>

                {mediaUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-amber-400/50 bg-zinc-100 dark:bg-black/60 p-2">
                    {mediaType === 'video' ? (
                      <video src={mediaUrl} controls playsInline className="w-full max-h-72 rounded object-contain bg-black" />
                    ) : (
                      <img src={mediaUrl} alt="Uploaded media preview" className="w-full max-h-72 rounded object-contain bg-black" />
                    )}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-200 dark:border-white/[0.08] text-xs">
                      <span className="truncate max-w-xs text-zinc-600 dark:text-zinc-400 font-mono text-[11px]">{mediaUrl}</span>
                      <button
                        type="button"
                        onClick={handleRemoveMedia}
                        className="text-red-600 dark:text-red-400 flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <X size={12} />
                        <span>ลบสื่อ</span>
                      </button>
                    </div>
                  </div>
                ) : mediaTab === 'upload' ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-300 dark:border-white/[0.12] hover:border-amber-500 bg-zinc-50 dark:bg-white/[0.01] rounded-xl p-5 text-center cursor-pointer transition-colors space-y-1.5"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-yellow-400/10 text-amber-600 dark:text-yellow-400 flex items-center justify-center mx-auto">
                      <UploadCloud size={16} />
                    </div>
                    <div className="text-xs text-zinc-800 dark:text-zinc-200 font-medium">
                      {isUploading ? 'กำลังอัปโหลดไฟล์...' : 'คลิกเพื่อเลือกไฟล์รูปภาพ หรือ วิดีโอ'}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">รองรับ JPG, PNG, WEBP, GIF (สูงสุด 15MB) หรือ MP4 (สูงสุด 80MB)</div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/image.jpg หรือ video.mp4"
                      className="flex-1 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] focus:border-amber-500 rounded-lg px-3 py-2 text-xs font-mono"
                    />
                    <button type="button" onClick={handleApplyUrlMedia} className="btn-secondary text-xs !py-2 shrink-0">
                      <Check size={13} />
                      <span>แนบลิงก์</span>
                    </button>
                  </div>
                )}
                {uploadError && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{uploadError}</p>}
              </div>

              {/* Source URL */}
              <div className="space-y-1.5">
                <label htmlFor="sourceUrl" className="text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                  <span className="flex items-center gap-1"><LinkIcon size={11} /> 4. ลิงก์ข่าวต้นทาง (ไม่บังคับ)</span>
                  <span className="text-[10px] text-zinc-400 font-mono">OPTIONAL</span>
                </label>
                <input
                  id="sourceUrl"
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://example.com/news/..."
                  className="w-full bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] focus:border-amber-500 rounded-lg px-3 py-2 text-xs font-mono"
                />
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <label htmlFor="content" className="text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                  <span>5. รายละเอียดเนื้อหา (Body)</span>
                  <span className="text-[10px] text-zinc-400 font-mono">OPTIONAL</span>
                </label>
                <textarea
                  id="content"
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="เขียนรายละเอียด ข้อคิดเห็น ข้อมูลข่าว หรือคำถาม..."
                  className="w-full bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] focus:border-red-500 rounded-lg p-3 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-red-500 leading-relaxed font-sans"
                />
              </div>

              {/* Community Poll */}
              <div className="p-3.5 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.08] rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-yellow-500/10 text-amber-600 dark:text-yellow-400 flex items-center justify-center shrink-0">
                      <BarChart2 size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                        เปิดโพลสำรวจความคิดเห็น (Community Poll)
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        ให้สมาชิกในชุมชนเข้ามาลงคะแนนโหวตแบบไม่ระบุตัวตน
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={hasPoll}
                      onChange={(e) => setHasPoll(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-300 dark:bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-400"></div>
                  </label>
                </div>

                {hasPoll && (
                  <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-white/[0.06] animate-in fade-in duration-200">
                    <input
                      type="text"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder="คำถามหรือหัวข้อโหวต (เว้นว่างเพื่อใช้หัวข้อกระทู้)"
                      maxLength={150}
                      className="w-full bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                    <div className="space-y-1.5">
                      {pollOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-zinc-500 w-4 text-right">{idx + 1}.</span>
                          <input
                            type="text"
                            required={hasPoll && idx < 2}
                            value={opt}
                            onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                            placeholder={`ตัวเลือกที่ ${idx + 1}...`}
                            maxLength={80}
                            className="flex-1 bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg px-3 py-1 text-xs focus:outline-none"
                          />
                          {pollOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePollOption(idx)}
                              className="p-1 text-zinc-400 hover:text-red-500"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                      {pollOptions.length < 8 && (
                        <button
                          type="button"
                          onClick={handleAddPollOption}
                          className="text-xs text-amber-600 dark:text-yellow-400 hover:underline inline-flex items-center gap-1 pt-1"
                        >
                          <Plus size={11} />
                          <span>เพิ่มตัวเลือก</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* COMMON BOTTOM BAR: TTL, PASSCODE, CAPTCHA & SUBMIT       */}
          {/* ======================================================== */}
          <div className="pt-2 border-t border-zinc-200 dark:border-white/[0.08] space-y-3">
            {/* Auto-Destruction TTL */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/[0.06] text-xs">
              <div className="flex items-center gap-1.5 font-mono text-zinc-600 dark:text-zinc-400">
                <Clock size={12} className="text-orange-500" />
                <span>ระยะเวลาคงอยู่ (TTL):</span>
              </div>
              <div className="flex items-center gap-1">
                {EXPIRY_OPTIONS.map((opt) => (
                  <button
                    key={opt.hours}
                    type="button"
                    onClick={() => setExpiresHours(opt.hours)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      expiresHours === opt.hours
                        ? 'bg-orange-500 text-white font-bold'
                        : 'bg-white dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/[0.08]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Edit/Delete Passcode (Auto-generated, expandable) */}
            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/[0.06] text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono text-zinc-700 dark:text-zinc-300">
                  <Key size={12} className="text-amber-500" />
                  <span>รหัสลับจัดการโพสต์: <strong className="font-mono text-amber-600 dark:text-yellow-400">{editPasscode}</strong></span>
                  <span className="text-[10px] text-zinc-400 hidden sm:inline">(บันทึกในเครื่องอัตโนมัติ)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdvancedPasscode((p) => !p)}
                  className="text-[11px] text-zinc-500 hover:text-amber-500 inline-flex items-center gap-1"
                >
                  <span>{showAdvancedPasscode ? 'ซ่อน' : 'ปรับแต่ง'}</span>
                  <ChevronDown size={11} className={showAdvancedPasscode ? 'rotate-180 transition-transform' : 'transition-transform'} />
                </button>
              </div>

              {showAdvancedPasscode && (
                <div className="pt-2 mt-2 border-t border-zinc-200 dark:border-white/[0.06] flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={30}
                    value={editPasscode}
                    onChange={(e) => setEditPasscode(e.target.value)}
                    placeholder="พิมพ์รหัสที่คุณต้องการ..."
                    className="flex-1 bg-white dark:bg-black/40 border border-zinc-300 dark:border-white/[0.08] rounded-md px-2.5 py-1 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setEditPasscode(Math.floor(100000 + Math.random() * 900000).toString())}
                    className="px-2 py-1 rounded border border-zinc-200 dark:border-white/[0.08] text-[11px] hover:border-amber-500"
                  >
                    สุ่มใหม่
                  </button>
                </div>
              )}
            </div>

            {/* Anti-Spam Captcha */}
            <div className="p-3 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.06] rounded-xl flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-amber-500 shrink-0" />
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  ยืนยันความปลอดภัย:
                </span>
                <div className="px-2.5 py-1 bg-amber-50 dark:bg-yellow-500/10 border border-amber-300 dark:border-yellow-500/25 rounded-md text-xs font-mono font-bold text-amber-700 dark:text-yellow-400">
                  {captchaData ? captchaData.question : '...'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  required
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="ตอบคำถาม..."
                  className="w-24 bg-white dark:bg-black/40 border border-zinc-300 dark:border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  className="p-1.5 text-zinc-400 hover:text-amber-500 rounded"
                  title="เปลี่ยนโจทย์"
                >
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-between">
              <Link
                href="/"
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              >
                ยกเลิก
              </Link>

              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 ${
                  postMode === 'job'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                    : postMode === 'market'
                    ? 'bg-amber-600 hover:bg-amber-500 dark:bg-yellow-500 dark:hover:bg-yellow-400 dark:text-zinc-950 shadow-amber-500/20'
                    : 'bg-red-600 hover:bg-red-500 shadow-red-600/20'
                }`}
              >
                <Send size={13} />
                <span>
                  {isSubmitting
                    ? 'กำลังโพสต์...'
                    : postMode === 'job'
                    ? '🚀 ลงประกาศงานทันที (Fast Post)'
                    : postMode === 'market'
                    ? '🏷️ ลงขายสินค้าทันที (Fast Post)'
                    : 'โพสต์กระทู้ทันที'}
                </span>
              </button>
            </div>
          </div>

        </form>
      </div>

      <CreateCommunityModal
        isOpen={isCreateCommModalOpen}
        onClose={() => setIsCreateCommModalOpen(false)}
        onCommunityCreated={handleCommunityCreated}
      />
    </div>
  );
}
