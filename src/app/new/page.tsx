'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Category, CaptchaChallenge } from '@/types';
import { getScopedIdentity, rerollScopedIdentity, AnonymousIdentity } from '@/lib/privacy';
import IdentityAvatar from '@/components/IdentityAvatar';
import {
  ArrowLeft,
  Send,
  Link as LinkIcon,
  AlertCircle,
  RefreshCw,
  Dices,
  Clock,
  Layers,
  Terminal,
  Landmark,
  TrendingUp,
  MessageSquare,
  Atom,
  ShieldCheck,
} from 'lucide-react';

const CATEGORIES = [
  { key: 'breaking' as Category, label: 'ข่าวด่วน', icon: AlertCircle, desc: 'เหตุการณ์สำคัญหรือข่าวด่วน' },
  { key: 'tech' as Category, label: 'เทคโนโลยี', icon: Terminal, desc: 'ไอที, AI, ซอฟต์แวร์, ความเป็นส่วนตัว' },
  { key: 'society' as Category, label: 'สังคม & การเมือง', icon: Landmark, desc: 'ประเด็นสังคมและนโยบายสาธารณะ' },
  { key: 'finance' as Category, label: 'เศรษฐกิจ', icon: TrendingUp, desc: 'การเงิน ธุรกิจ และการลงทุน' },
  { key: 'general' as Category, label: 'ทั่วไป', icon: MessageSquare, desc: 'แลกเปลี่ยนความคิดเห็นทั่วไป' },
  { key: 'science' as Category, label: 'วิทยาศาสตร์', icon: Atom, desc: 'การค้นพบ อวกาศ และวิทยาศาสตร์' },
];

const EXPIRY_OPTIONS = [
  { hours: 24, label: '24 ชั่วโมง', desc: 'ข่าวด่วน เหตุการณ์เฉพาะหน้า' },
  { hours: 72, label: '3 วัน', desc: 'ประเด็นที่อยู่ในกระแส' },
  { hours: 168, label: '7 วัน', desc: 'สาระและการแลกเปลี่ยนเชิงลึก' },
];

export default function NewThreadPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Category>('general');
  const [sourceUrl, setSourceUrl] = useState('');
  const [expiresHours, setExpiresHours] = useState<number>(72);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaData, setCaptchaData] = useState<CaptchaChallenge | null>(null);

  const [identity, setIdentity] = useState<AnonymousIdentity | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const id = getScopedIdentity('create_thread_session');
    setIdentity(id);
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim() || title.length < 5) {
      setErrorMsg('หัวข้อกระทู้ต้องมีความยาวอย่างน้อย 5 ตัวอักษร');
      return;
    }

    if (!content.trim() || content.length < 10) {
      setErrorMsg('เนื้อหากระทู้ต้องมีความยาวอย่างน้อย 10 ตัวอักษร');
      return;
    }

    if (!captchaAnswer.trim() || !captchaData?.token) {
      setErrorMsg('กรุณากรอกคำตอบคำถามยืนยันความปลอดภัย');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category,
          source_url: sourceUrl.trim() || null,
          author_alias: identity?.alias || 'ผู้ไม่ประสงค์ออกนาม #????',
          author_avatar: identity?.avatarIcon || 'shield',
          expires_hours: expiresHours,
          captcha_token: captchaData.token,
          captcha_answer: captchaAnswer.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.thread) {
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
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft size={13} />
          <span>กลับหน้าบอร์ด</span>
        </Link>
      </div>

      <div className="bg-[#101216] border border-white/[0.08] rounded-xl p-5 sm:p-6 text-zinc-200">
        
        {/* Header with Ephemeral Identity Preview */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/[0.06]">
          <div>
            <h1 className="text-lg font-bold text-zinc-100">ตั้งกระทู้ใหม่</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              ไม่เก็บประวัติ IP • สุ่มรหัสผู้เขียนเฉพาะครั้งนี้
            </p>
          </div>

          {identity && (
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] px-2.5 py-1.5 rounded-lg self-start sm:self-auto">
              <IdentityAvatar iconKey={identity.avatarIcon} size="xs" />
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block font-mono">ชื่อที่จะแสดง:</span>
                <span className="text-xs font-semibold text-zinc-200">{identity.alias}</span>
              </div>
              <button
                type="button"
                onClick={handleRerollIdentity}
                className="p-1 text-zinc-500 hover:text-zinc-200 rounded hover:bg-white/[0.06] transition-colors ml-1 active:scale-95"
                title="สุ่มชื่อใหม่"
              >
                <Dices size={13} />
              </button>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-950/20 border border-rose-900/40 rounded-lg text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle size={14} className="text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          
          {/* Category */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase text-zinc-400">
              1. เลือกหมวดหมู่
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? 'border-emerald-500/60 bg-emerald-500/[0.06]'
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={14} className={isSelected ? 'text-emerald-400' : 'text-zinc-400'} />
                      <span className="text-xs font-semibold text-zinc-100">{cat.label}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 line-clamp-1">{cat.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-xs font-mono uppercase text-zinc-400">
              2. หัวข้อกระทู้
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ระบุหัวข้อให้ชัดเจนและตรงประเด็น..."
              maxLength={200}
              className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-zinc-500 rounded-lg px-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-colors font-sans"
            />
          </div>

          {/* Source URL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="sourceUrl" className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1">
                <LinkIcon size={11} />
                <span>3. ลิงก์ข่าวต้นทาง (ไม่บังคับ)</span>
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">OPTIONAL</span>
            </div>
            <input
              id="sourceUrl"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://example.com/news/..."
              className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-zinc-500 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-colors font-mono"
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label htmlFor="content" className="text-xs font-mono uppercase text-zinc-400">
              4. รายละเอียดเนื้อหา
            </label>
            <textarea
              id="content"
              rows={6}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="เขียนรายละเอียด ข้อคิดเห็น หรือข้อมูลข่าวที่ต้องการแลกเปลี่ยน..."
              className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-zinc-500 rounded-lg p-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 leading-relaxed transition-colors font-sans"
            />
          </div>

          {/* Auto-Destruction TTL */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1">
              <Clock size={12} className="text-zinc-400" />
              <span>5. ระยะเวลาทำลายข้อมูลอัตโนมัติ (TTL)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EXPIRY_OPTIONS.map((opt) => {
                const isSelected = expiresHours === opt.hours;
                return (
                  <button
                    key={opt.hours}
                    type="button"
                    onClick={() => setExpiresHours(opt.hours)}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? 'border-emerald-500/60 bg-emerald-500/[0.06]'
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="text-xs font-semibold text-zinc-100">{opt.label}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Anti-Spam Captcha */}
          <div className="p-3 bg-zinc-950/60 border border-white/[0.06] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span className="text-xs font-medium text-zinc-200">ยืนยันความปลอดภัย (Stateless Math)</span>
              </div>
              <button
                type="button"
                onClick={fetchCaptcha}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                title="เปลี่ยนโจทย์"
              >
                <RefreshCw size={11} />
                <span>เปลี่ยนโจทย์</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <div className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-md text-xs font-mono font-bold text-emerald-400">
                {captchaData ? captchaData.question : 'กำลังโหลด...'}
              </div>

              <input
                type="number"
                required
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                placeholder="คำตอบ..."
                className="w-32 bg-white/[0.02] border border-white/[0.08] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
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
              disabled={isSubmitting}
              className="btn-primary"
            >
              <Send size={13} />
              <span>{isSubmitting ? 'กำลังโพสต์...' : 'โพสต์กระทู้ทันที'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
