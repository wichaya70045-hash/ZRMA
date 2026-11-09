'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Category, CaptchaChallenge } from '@/types';
import { getScopedIdentity, rerollScopedIdentity, AnonymousIdentity } from '@/lib/privacy';
import {
  ShieldCheck,
  Dices,
  Clock,
  ArrowLeft,
  Send,
  Link as LinkIcon,
  AlertCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

const CATEGORIES: { key: Category; label: string; icon: string; desc: string }[] = [
  { key: 'breaking', label: 'ข่าวด่วน (Breaking News)', icon: '🚨', desc: 'เหตุการณ์สำคัญ ข้อมูลสดใหม่ทันเหตุการณ์' },
  { key: 'tech', label: 'เทคโนโลยี (Technology)', icon: '💻', desc: 'ไอที, AI, ความเป็นส่วนตัว, ซอฟต์แวร์' },
  { key: 'society', label: 'สังคม & การเมือง (Society)', icon: '🏛️', desc: 'ประเด็นสังคม กฎหมาย นโยบายสาธารณะ' },
  { key: 'finance', label: 'เศรษฐกิจ & การเงิน (Finance)', icon: '📈', desc: 'การลงทุน ตลาด คริปโทเคอร์เรนซี ธุรกิจ' },
  { key: 'general', label: 'ทั่วไป & พูดคุย (General)', icon: '💬', desc: 'เรื่องราวทั่วไป แลกเปลี่ยนความเห็น ข้อคิด' },
  { key: 'science', label: 'วิทยาศาสตร์ (Science)', icon: '🔬', desc: 'การค้นพบ อวกาศ สุขภาพ สิ่งแวดล้อม' },
];

const EXPIRY_OPTIONS = [
  { hours: 24, label: '24 ชั่วโมง (1 วัน)', desc: 'เหมาะสำหรับข่าวด่วน เหตุการณ์เฉพาะหน้า' },
  { hours: 72, label: '3 วัน (72 ชั่วโมง)', desc: 'เหมาะสำหรับประเด็นที่กำลังอยู่ในกระแส' },
  { hours: 168, label: '7 วัน (1 สัปดาห์)', desc: 'เหมาะสำหรับบทความสาระหรือการแลกเปลี่ยนเชิงลึก' },
];

export default function NewThreadPage() {
  const router = useRouter();

  // Form states
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

  // Fetch or generate scoped ephemeral identity for creating new threads
  useEffect(() => {
    const id = getScopedIdentity('create_thread_session');
    setIdentity(id);
  }, []);

  // Fetch fresh CAPTCHA challenge
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
          author_avatar: identity?.avatar || '🥷',
          expires_hours: expiresHours,
          captcha_token: captchaData.token,
          captcha_answer: captchaAnswer.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.thread) {
        // Navigate to the newly created thread
        router.push(`/thread/${data.thread.id}`);
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการสร้างกระทู้');
        fetchCaptcha(); // reload captcha on error
      }
    } catch {
      setErrorMsg('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      fetchCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้าบอร์ดหลัก</span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow corner accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                Zero-Log Publishing
              </span>
              <span className="text-xs text-slate-400">🛡️ ไม่ระบุตัวตน</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">ตั้งกระทู้ข่าว / เปิดประเด็นใหม่</h1>
          </div>

          {/* Ephemeral Identity Preview & Reroll Button */}
          {identity && (
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-2 rounded-2xl">
              <span className="text-xl">{identity.avatar}</span>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">ชื่อที่ใช้โพสต์:</span>
                <span className="text-xs font-bold text-slate-200">{identity.alias}</span>
              </div>
              <button
                type="button"
                onClick={handleRerollIdentity}
                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-colors ml-1"
                title="ทอยสุ่มชื่อใหม่"
              >
                <Dices className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6 text-slate-200">
          
          {/* Category Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              1. เลือกหมวดหมู่เนื้อหา *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-emerald-500/80 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                        : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-lg mb-1">{cat.icon}</div>
                    <div className="text-xs font-bold text-white">{cat.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{cat.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-slate-400">
              2. หัวข้อกระทู้ / พาดหัวข่าว *
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ระบุหัวข้อที่น่าสนใจ ชัดเจน และตรงประเด็น..."
              maxLength={200}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          {/* Source URL (Optional) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="sourceUrl" className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" />
                <span>3. แหล่งข่าวต้นทาง (URL ลิงก์อ้างอิง) - ถ้ามี</span>
              </label>
              <span className="text-[10px] text-slate-500">ใส่หรือไม่ใส่ก็ได้</span>
            </div>
            <input
              id="sourceUrl"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://example.com/news/1234"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Content Body */}
          <div className="space-y-2">
            <label htmlFor="content" className="text-xs font-bold uppercase tracking-wider text-slate-400">
              4. เนื้อหากระทู้ / รายละเอียดข่าว *
            </label>
            <textarea
              id="content"
              rows={6}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="เขียนรายละเอียด ข้อคิดเห็น ข้อมูลเชิงลึก หรือเนื้อหาข่าวที่ต้องการแบ่งปัน..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 leading-relaxed transition-colors"
            />
          </div>

          {/* Auto-destruction / Expiry duration */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>5. ระยะเวลาทำลายข้อมูลอัตโนมัติ (Self-Destruct TTL) *</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {EXPIRY_OPTIONS.map((opt) => {
                const isSelected = expiresHours === opt.hours;
                return (
                  <button
                    key={opt.hours}
                    type="button"
                    onClick={() => setExpiresHours(opt.hours)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-amber-500/80 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                        : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{opt.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Anti-Spam Captcha (Stateless, Zero-IP) */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">ระบบป้องกันสแปมไร้การติดตาม (Zero-Knowledge)</span>
              </div>
              <button
                type="button"
                onClick={fetchCaptcha}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                title="เปลี่ยนโจทย์คำถาม"
              >
                <RefreshCw className="w-3 h-3" />
                <span>เปลี่ยนโจทย์</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              เราใช้การคำนวณทางคณิตศาสตร์แบบไร้สถานะแทนคุกกี้และการแบน IP เพื่อรักษาความเป็นส่วนตัวสูงสุดของคุณ
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
              <div className="px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs sm:text-sm font-mono font-bold text-emerald-300">
                {captchaData ? captchaData.question : 'กำลังโหลดโจทย์...'}
              </div>

              <input
                type="number"
                required
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                placeholder="พิมพ์คำตอบตัวเลข..."
                className="w-full sm:w-48 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              ยกเลิก
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02]"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังโพสต์...' : 'โพสต์กระทู้ทันที (ไร้ตัวตน)'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
