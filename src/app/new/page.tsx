'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Community, CaptchaChallenge, MediaType } from '@/types';
import { getScopedIdentity, rerollScopedIdentity, setCustomScopedIdentity, saveAuthoredThread, AnonymousIdentity } from '@/lib/privacy';
import { useSettings } from '@/lib/settings';
import IdentityAvatar from '@/components/IdentityAvatar';
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
  atom: Atom,
  trending: TrendingUp,
  chat: MessageSquare,
  alert: AlertCircle,
};

export default function NewThreadPage() {
  const router = useRouter();
  const { settings } = useSettings();

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

  // Community Poll state
  const [hasPoll, setHasPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('กรุณาระบุหัวข้อกระทู้');
      return;
    }

    if (hasPoll) {
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

    const finalCategory = (customCategory.trim() || category || 'general')
      .toLowerCase()
      .replace(/^[zr]\//i, '')
      .replace(/[^a-z0-9_]/g, '');

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category: finalCategory,
          flair: flair.trim() || null,
          source_url: sourceUrl.trim() || null,
          media_url: mediaUrl || null,
          media_type: mediaType || null,
          has_poll: hasPoll,
          poll_question: pollQuestion.trim() || null,
          poll_options: pollOptions.map((o) => o.trim()).filter(Boolean),
          author_alias: customAuthorAlias.trim() || identity?.alias || 'u/นิรนาม #????',
          author_avatar: identity?.avatarIcon || 'terminal',
          is_pinned: isPinned ? 1 : 0,
          expires_hours: expiresHours,
          edit_token: editPasscode.trim(),
          captcha_token: captchaData.token,
          captcha_answer: captchaAnswer.trim(),
        }),
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
    <div className="max-w-2xl w-full mx-auto space-y-5 overflow-hidden">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-yellow-400 transition-colors"
        >
          <ArrowLeft size={13} />
          <span>กลับหน้าบอร์ด</span>
        </Link>
      </div>

      <div className="bg-[#0e1015]/90 border border-white/[0.08] rounded-xl p-4 sm:p-6 text-zinc-200 shadow-xl backdrop-blur-sm w-full max-w-full overflow-hidden">
        
        {/* Header with Ephemeral Identity & Custom Name */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              <span className="text-[11px] font-mono text-zinc-400 font-medium">
                โพสต์นิรนาม • Zero-Log
              </span>
            </div>
            <h1 className="text-lg font-bold text-zinc-100">สร้างกระทู้ใหม่</h1>
          </div>

          {/* Editable Display Name Box */}
          <div className="flex items-center gap-2 bg-black/40 border border-white/[0.08] px-3 py-1.5 rounded-lg self-start sm:self-auto max-w-full overflow-hidden">
            {identity && <IdentityAvatar iconKey={identity.avatarIcon} theme="red" size="xs" />}
            <div className="min-w-0">
              <span className="text-[10px] text-zinc-500 uppercase block font-mono">ชื่อที่จะแสดง (u/):</span>
              <input
                type="text"
                value={customAuthorAlias}
                onChange={(e) => handleAliasChange(e.target.value)}
                placeholder="u/ชื่อที่คุณต้องการ"
                maxLength={40}
                className="bg-transparent text-xs font-semibold text-zinc-200 focus:outline-none focus:text-yellow-400 font-mono w-28 sm:w-36"
              />
            </div>
            <button
              type="button"
              onClick={handleRerollIdentity}
              className="p-1 text-zinc-500 hover:text-yellow-400 rounded hover:bg-white/[0.06] transition-colors ml-1 active:scale-95 shrink-0"
              title="สุ่มชื่อใหม่ (Random Reroll)"
            >
              <Dices size={14} />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-950/20 border border-red-900/40 rounded-lg text-xs text-red-300 flex items-center gap-2">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          
          {/* Subreddit / Community Selector (z/...) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase text-zinc-400">
                1. เลือกห้องชุมชน (Subreddit)
              </label>
              <button
                type="button"
                onClick={() => setIsCreateCommModalOpen(true)}
                className="text-[11px] font-mono text-yellow-400 hover:underline flex items-center gap-1"
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
                        ? 'border-red-500/70 bg-red-500/[0.08] shadow-sm'
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-yellow-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <IconComp size={14} className={isSelected ? 'text-red-400' : 'text-zinc-400'} />
                      <span className="text-xs font-mono font-bold text-zinc-100">z/{comm.name}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 line-clamp-1">{comm.description}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Subreddit Input option */}
            <div className="pt-1">
              <div className="flex items-center bg-black/40 border border-white/[0.08] focus-within:border-red-500 rounded-lg px-3 py-1.5 text-xs">
                <span className="text-zinc-500 font-mono font-bold mr-1">หรือพิมพ์ชื่อห้องเอง: z/</span>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="เช่น crypto, ai, gaming, memes"
                  maxLength={30}
                  className="bg-transparent text-zinc-100 focus:outline-none w-full font-mono"
                />
              </div>
            </div>

            {/* Pinned Breaking Wire Toggle */}
            {(category === 'breaking' || customCategory.toLowerCase() === 'breaking') && (
              <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  <div>
                    <div className="text-xs font-bold text-red-300 flex items-center gap-1">
                      <span>📌 ปักหมุดข่าวด่วนพิเศษ (Pin Breaking Live Wire)</span>
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      จะถูกปักหมุดบนสุดของ z/breaking พร้อมระบุแหล่งที่มาและเวลาอัปเดตแบบเรียลไทม์
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
                  <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-xs font-mono uppercase text-zinc-400">
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
              className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-red-500 rounded-lg px-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors font-sans"
            />
          </div>

          {/* Post Flair (Optional) */}
          <div className="space-y-1.5">
            <label htmlFor="flair" className="text-xs font-mono uppercase text-zinc-400 flex items-center justify-between">
              <span>แท็กโพสต์ / Flair (ไม่บังคับ)</span>
              <span className="text-[10px] text-zinc-500">OPTIONAL</span>
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
                      : 'bg-white/[0.02] text-zinc-400 border-white/[0.08] hover:border-yellow-500/30'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Media Attachment: Image or Video */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
                <ImageIcon size={13} className="text-yellow-400" />
                <span>3. แนบรูปภาพ หรือ วิดีโอ (Media Attachment)</span>
              </label>
              <div className="flex items-center gap-1 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setMediaTab('upload')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    mediaTab === 'upload' ? 'bg-white/[0.1] text-yellow-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  อัปโหลดไฟล์
                </button>
                <span className="text-zinc-600">|</span>
                <button
                  type="button"
                  onClick={() => setMediaTab('url')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    mediaTab === 'url' ? 'bg-white/[0.1] text-yellow-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  ใส่ลิงก์ URL
                </button>
              </div>
            </div>

            {/* Media Preview if attached */}
            {mediaUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-yellow-500/30 bg-black/60 p-2">
                {mediaType === 'video' ? (
                  <video
                    src={mediaUrl}
                    controls
                    playsInline
                    className="w-full max-h-72 rounded object-contain bg-black"
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Uploaded media preview"
                    className="w-full max-h-72 rounded object-contain bg-black"
                  />
                )}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.08] text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]">
                    {mediaType === 'video' ? <Film size={12} className="text-yellow-400" /> : <ImageIcon size={12} className="text-yellow-400" />}
                    <span className="truncate max-w-xs">{mediaUrl}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveMedia}
                    className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded hover:bg-red-950/30 transition-colors"
                  >
                    <X size={12} />
                    <span>ลบสื่อ</span>
                  </button>
                </div>
              </div>
            ) : mediaTab === 'upload' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/[0.12] hover:border-yellow-400/50 bg-white/[0.01] hover:bg-white/[0.03] rounded-xl p-6 text-center cursor-pointer transition-colors space-y-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-yellow-400/10 text-yellow-400 flex items-center justify-center mx-auto border border-yellow-400/20">
                  <UploadCloud size={20} />
                </div>
                <div className="text-xs text-zinc-200 font-medium">
                  {isUploading ? 'กำลังอัปโหลดไฟล์...' : 'คลิกเพื่อเลือกไฟล์รูปภาพ หรือ วิดีโอ'}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  รองรับ JPG, PNG, WEBP, GIF (สูงสุด 15MB) หรือ MP4, WEBM (สูงสุด 80MB)
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg หรือ video.mp4"
                  className="flex-1 bg-white/[0.02] border border-white/[0.08] focus:border-yellow-400 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyUrlMedia}
                  className="btn-secondary text-xs !py-2 shrink-0"
                >
                  <Check size={13} />
                  <span>แนบลิงก์</span>
                </button>
              </div>
            )}

            {uploadError && (
              <p className="text-xs text-red-400 mt-1">{uploadError}</p>
            )}
          </div>

          {/* Source URL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="sourceUrl" className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1">
                <LinkIcon size={11} />
                <span>4. ลิงก์ข่าวต้นทาง (ไม่บังคับ)</span>
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">OPTIONAL</span>
            </div>
            <input
              id="sourceUrl"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://example.com/news/..."
              className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-yellow-400 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-yellow-400 transition-colors font-mono"
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="content" className="text-xs font-mono uppercase text-zinc-400">
                5. รายละเอียดเนื้อหา (Body)
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">OPTIONAL</span>
            </div>
            <textarea
              id="content"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="เขียนรายละเอียด ข้อคิดเห็น ข้อมูลข่าว หรือคำถาม (ไม่บังคับ)..."
              className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-red-500 rounded-lg p-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500 leading-relaxed transition-colors font-sans"
            />
          </div>

          {/* 6. Community Poll Options (เปิดโหวตในโพสต์) */}
          <div className="p-3.5 bg-black/40 border border-white/[0.08] hover:border-white/[0.14] rounded-xl space-y-3 transition-colors">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 flex items-center justify-center shrink-0">
                  <BarChart2 size={16} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-zinc-100 block">
                    6. เปิดโพลสำรวจความคิดเห็น (Community Poll)
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    ให้สมาชิกในชุมชนเข้ามาลงคะแนนโหวตแบบไม่ระบุตัวตน (Zero-Log Anonymity)
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
                <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-400"></div>
              </label>
            </div>

            {hasPoll && (
              <div className="space-y-3 pt-3 border-t border-white/[0.06] animate-in fade-in duration-200">
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                    คำถามหรือหัวข้อโหวต (ไม่บังคับ - หากเว้นว่างจะใช้หัวข้อกระทู้):
                  </label>
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="เช่น คุณเห็นด้วยกับเรื่องนี้หรือไม่?"
                    maxLength={150}
                    className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-yellow-400 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none font-sans"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-zinc-400 block">
                    ตัวเลือกสำหรับการโหวต (อย่างน้อย 2 ตัวเลือก, สูงสุด 8 ตัวเลือก):
                  </label>

                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-zinc-500 w-5 text-right shrink-0">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        required={hasPoll && idx < 2}
                        value={opt}
                        onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                        placeholder={`ระบุตัวเลือกที่ ${idx + 1}...`}
                        maxLength={80}
                        className="flex-1 bg-white/[0.02] border border-white/[0.08] focus:border-yellow-400 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none font-sans"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePollOption(idx)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 rounded hover:bg-white/[0.04] transition-colors shrink-0"
                          title="ลบตัวเลือกนี้"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}

                  {pollOptions.length < 8 && (
                    <button
                      type="button"
                      onClick={handleAddPollOption}
                      className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-white/20 hover:border-yellow-400 text-xs text-zinc-400 hover:text-yellow-400 hover:bg-yellow-400/[0.05] transition-colors"
                    >
                      <Plus size={12} />
                      <span>+ เพิ่มตัวเลือก</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Auto-Destruction TTL (Touch of Orange) */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 flex items-center gap-1">
              <Clock size={12} className="text-orange-400" />
              <span>7. ระยะเวลาทำลายข้อมูลอัตโนมัติ (TTL)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EXPIRY_OPTIONS.map((opt) => {
                const isSelected = expiresHours === opt.hours;
                return (
                  <button
                    key={opt.hours}
                    type="button"
                    onClick={() => setExpiresHours(opt.hours)}
                    className={`p-2.5 rounded-lg border text-left transition-colors active:scale-95 ${
                      isSelected
                        ? 'border-orange-500/70 bg-orange-500/[0.08] shadow-sm'
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-orange-500/30'
                    }`}
                  >
                    <div className="text-xs font-semibold text-zinc-100">{opt.label}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Edit/Delete Secret Passcode (Zero-Log Authentication) */}
          <div className="p-3 bg-black/40 border border-white/[0.06] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Key size={14} className="text-yellow-400" />
                <span className="text-xs font-medium text-zinc-200">8. รหัสลับสำหรับแก้ไขหรือลบโพสต์ (Edit Passcode)</span>
              </div>
              <button
                type="button"
                onClick={() => setEditPasscode(Math.floor(100000 + Math.random() * 900000).toString())}
                className="text-[11px] text-zinc-500 hover:text-yellow-400 flex items-center gap-1"
                title="สุ่มรหัส PIN ใหม่"
              >
                <Dices size={11} />
                <span>สุ่มรหัสใหม่</span>
              </button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-0.5 w-full">
              <input
                type="text"
                required
                maxLength={30}
                value={editPasscode}
                onChange={(e) => setEditPasscode(e.target.value)}
                placeholder="ตั้งรหัสลับ 4-6 หลัก หรือตัวอักษร..."
                className="w-full sm:w-56 bg-white/[0.02] border border-white/[0.08] focus:border-yellow-400 rounded-md px-3 py-1.5 text-xs text-yellow-400 font-mono font-bold focus:outline-none shrink-0"
              />
              <span className="text-[11px] text-zinc-500">
                (ระบบจะจำในเครื่องนี้อัตโนมัติ ไม่ต้องกรอกซ้ำเวลาแก้ไขหรือลบ)
              </span>
            </div>
          </div>

          {/* Anti-Spam Captcha (Yellow Highlight) */}
          <div className="p-3 bg-black/40 border border-white/[0.06] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-yellow-400" />
                <span className="text-xs font-medium text-zinc-200">ยืนยันความปลอดภัย (Stateless Math)</span>
              </div>
              <button
                type="button"
                onClick={fetchCaptcha}
                className="text-[11px] text-zinc-500 hover:text-yellow-400 flex items-center gap-1"
                title="เปลี่ยนโจทย์"
              >
                <RefreshCw size={11} />
                <span>เปลี่ยนโจทย์</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <div className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/25 rounded-md text-xs font-mono font-bold text-yellow-400">
                {captchaData ? captchaData.question : 'กำลังโหลด...'}
              </div>

              <input
                type="number"
                required
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                placeholder="คำตอบ..."
                className="w-32 bg-white/[0.02] border border-white/[0.08] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400 font-mono"
              />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-between">
            <Link
              href="/"
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              ยกเลิก
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="btn-primary"
            >
              <Send size={13} />
              <span>{isSubmitting ? 'กำลังโพสต์...' : 'โพสต์กระทู้ทันที'}</span>
            </button>
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
