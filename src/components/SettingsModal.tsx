'use client';

import React, { useState } from 'react';
import { useSettings, AppSettings } from '@/lib/settings';
import {
  Settings,
  Shield,
  EyeOff,
  Eye,
  Volume2,
  VolumeX,
  Zap,
  RotateCcw,
  Sliders,
  X,
  Check,
  AlertTriangle,
  LayoutList,
  LayoutGrid,
  Type,
  Flame,
  Clock,
  Sparkles,
  TrendingUp,
  Radio,
  CornerDownLeft,
  LifeBuoy,
  RefreshCw,
  ExternalLink,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'privacy' | 'feed' | 'chat' | 'theme';

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    settings,
    updateSetting,
    resetSettings,
    executePanicWipe,
    playChatChime,
  } = useSettings();

  const [activeTab, setActiveTab] = useState<TabType>('privacy');
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showConfirmPanic, setShowConfirmPanic] = useState(false);
  const [audioTested, setAudioTested] = useState(false);

  if (!isOpen) return null;

  const handleTestAudio = () => {
    playChatChime();
    setAudioTested(true);
    setTimeout(() => setAudioTested(false), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white dark:bg-[#101217] border border-zinc-200 dark:border-white/[0.1] rounded-2xl max-w-2xl w-full max-w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-zinc-800 dark:text-zinc-200 my-auto">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-white/[0.08] flex items-center justify-between bg-zinc-50 dark:bg-black/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 dark:bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400">
              <Sliders size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span>ตั้งค่าระบบ ZRMA</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-white/[0.08]">
                  Preferences
                </span>
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                ปรับแต่งความเป็นส่วนตัว มุมมองฟีด และระบบแชทสดตามความต้องการของคุณ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-200/60 dark:hover:bg-white/[0.06] transition-colors"
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 dark:border-white/[0.06] bg-zinc-100/60 dark:bg-black/20 px-3 sm:px-5 gap-1 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3 px-3 border-b-2 font-medium flex items-center gap-2 shrink-0 transition-colors ${
              activeTab === 'privacy'
                ? 'border-red-500 text-red-600 dark:text-red-400 font-semibold'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Shield size={14} />
            <span>ความเป็นส่วนตัว & อัตลักษณ์</span>
          </button>

          <button
            onClick={() => setActiveTab('feed')}
            className={`py-3 px-3 border-b-2 font-medium flex items-center gap-2 shrink-0 transition-colors ${
              activeTab === 'feed'
                ? 'border-amber-500 dark:border-yellow-400 text-amber-600 dark:text-yellow-400 font-semibold'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <LayoutList size={14} />
            <span>ฟีด & การอ่านเนื้อหา</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`py-3 px-3 border-b-2 font-medium flex items-center gap-2 shrink-0 transition-colors ${
              activeTab === 'chat'
                ? 'border-orange-500 dark:border-orange-400 text-orange-600 dark:text-orange-400 font-semibold'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Radio size={14} />
            <span>แชทสด & เสียง</span>
          </button>

          <button
            onClick={() => setActiveTab('theme')}
            className={`py-3 px-3 border-b-2 font-medium flex items-center gap-2 shrink-0 transition-colors ${
              activeTab === 'theme'
                ? 'border-zinc-900 dark:border-zinc-200 text-zinc-900 dark:text-zinc-100 font-semibold'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Sparkles size={14} />
            <span>ธีม & ระบบ</span>
          </button>
        </div>

        {/* Tab Body Content (Scrollable) */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* TAB 1: PRIVACY & IDENTITY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              
              {/* Strict Zero-Trace Mode */}
              <div className="p-3.5 bg-zinc-50 dark:bg-black/40 rounded-xl border border-zinc-200 dark:border-white/[0.06] hover:border-red-500/25 transition-colors flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-xs sm:text-sm">
                    <Shield size={15} className="text-red-600 dark:text-red-400" />
                    <span>โหมดพรางตัวเข้มงวด (Strict Zero-Trace)</span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                    สุ่มชื่อและรหัสผู้ใช้ใหม่เอี่ยม (`u/alias`) อัตโนมัติทุกครั้งที่กดโพสต์หรือคอมเมนต์ เพื่อป้องกันการเชื่อมโยงความเห็นในเซสชันเดียวกันโดยเด็ดขาด
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={settings.strictZeroTrace}
                    onChange={(e) => updateSetting('strictZeroTrace', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-300 dark:bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {/* Blur Media */}
              <div className="p-3.5 bg-zinc-50 dark:bg-black/40 rounded-xl border border-zinc-200 dark:border-white/[0.06] hover:border-amber-500/25 dark:hover:border-yellow-500/25 transition-colors flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-xs sm:text-sm">
                    <EyeOff size={15} className="text-amber-600 dark:text-yellow-400" />
                    <span>เบลอสื่อมีเดียเริ่มต้น (Auto-Blur Media)</span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                    เบลอรูปภาพและวิดีโอทั้งหมดบนฟีดและในกระทู้เป็นค่าเริ่มต้น ต้องคลิกที่รูปเพื่อเปิดดู ช่วยป้องกันการแอบมองหน้าจอในที่สาธารณะหรือที่ทำงาน
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={settings.blurMedia}
                    onChange={(e) => updateSetting('blurMedia', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-300 dark:bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
                </label>
              </div>

              {/* Panic Shortcut */}
              <div className="p-3.5 bg-zinc-50 dark:bg-black/40 rounded-xl border border-zinc-200 dark:border-white/[0.06] hover:border-orange-500/25 transition-colors flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-xs sm:text-sm">
                    <Zap size={15} className="text-orange-600 dark:text-orange-400" />
                    <span>ปุ่มลัดฉุกเฉินหนีทันที (Panic Key: กด ESC 2 ครั้ง)</span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                    เมื่อกดแป้นพิมพ์ <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-white/[0.1] text-zinc-800 dark:text-zinc-200 font-mono text-[10px]">Esc</kbd> สองครั้งติดกันอย่างรวดเร็ว ระบบจะล้างรหัสเซสชันในเครื่องและสลับหน้าต่างไปยัง Wikipedia ทันที
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={settings.panicShortcut}
                    onChange={(e) => updateSetting('panicShortcut', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-300 dark:bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              {/* Auto Clear On Exit */}
              <div className="p-3.5 bg-zinc-50 dark:bg-black/40 rounded-xl border border-zinc-200 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/[0.15] transition-colors flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-xs sm:text-sm">
                    <Clock size={15} className="text-zinc-500 dark:text-zinc-400" />
                    <span>ล้างข้อมูลเซสชันอัตโนมัติเมื่อปิดแท็บเบราว์เซอร์</span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                    ลบประวัติ sessionStorage ทั้งหมดเมื่อผู้ใช้ปิดแท็บหรือปิดหน้าต่างเบราว์เซอร์ ไม่ทิ้งรอยค้างไว้ในเครื่อง
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={settings.autoClearOnExit}
                    onChange={(e) => updateSetting('autoClearOnExit', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-300 dark:bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {/* Panic Button Callout */}
              <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/30 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-semibold text-red-700 dark:text-red-300 flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    <span>สั่งการฉุกเฉิน: ล้างข้อมูลและหนีทันที</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    ล้างแคชในเครื่องทันที และเปิดหน้าเว็บสารานุกรมเพื่อพรางตัว
                  </p>
                </div>
                {showConfirmPanic ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={executePanicWipe}
                      className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-[11px] transition-colors"
                    >
                      ยืนยันหนีทันที
                    </button>
                    <button
                      onClick={() => setShowConfirmPanic(false)}
                      className="px-2 py-1.5 bg-zinc-200 dark:bg-white/[0.08] hover:bg-zinc-300 dark:hover:bg-white/[0.12] rounded text-[11px] text-zinc-700 dark:text-zinc-300"
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmPanic(true)}
                    className="px-3 py-1.5 bg-red-600 dark:bg-red-950/60 hover:bg-red-500 dark:hover:bg-red-900/60 border border-red-500/40 text-white dark:text-red-300 hover:text-white rounded-lg text-xs font-semibold transition-colors shrink-0"
                  >
                    กดล้างรอยทันที
                  </button>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: FEED & READING */}
          {activeTab === 'feed' && (
            <div className="space-y-4">
              
              {/* Feed View Layout Mode */}
              <div className="space-y-2">
                <label className="text-zinc-900 dark:text-zinc-200 font-semibold text-xs flex items-center gap-1.5">
                  <LayoutList size={14} className="text-amber-600 dark:text-yellow-400" />
                  <span>รูปแบบมุมมองฟีดโพสต์ (Feed Layout)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateSetting('feedLayout', 'card')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-colors ${
                      settings.feedLayout === 'card'
                        ? 'border-amber-500 dark:border-yellow-400 bg-amber-50 dark:bg-yellow-400/10 text-zinc-900 dark:text-white'
                        : 'border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-black/40 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-zinc-200/70 dark:bg-white/[0.05] shrink-0">
                      <LayoutGrid size={18} className={settings.feedLayout === 'card' ? 'text-amber-600 dark:text-yellow-400' : 'text-zinc-500'} />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                        <span>Card View (มุมมองการ์ดเต็ม)</span>
                        {settings.feedLayout === 'card' && <Check size={12} className="text-amber-600 dark:text-yellow-400" />}
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        แสดงรูปภาพพรีวิว ข้อความสรุป แถบโหวต และข้อมูลครบถ้วน
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSetting('feedLayout', 'compact')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-colors ${
                      settings.feedLayout === 'compact'
                        ? 'border-amber-500 dark:border-yellow-400 bg-amber-50 dark:bg-yellow-400/10 text-zinc-900 dark:text-white'
                        : 'border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-black/40 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-zinc-200/70 dark:bg-white/[0.05] shrink-0">
                      <LayoutList size={18} className={settings.feedLayout === 'compact' ? 'text-amber-600 dark:text-yellow-400' : 'text-zinc-500'} />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                        <span>Compact View (มุมมองกะทัดรัด)</span>
                        {settings.feedLayout === 'compact' && <Check size={12} className="text-amber-600 dark:text-yellow-400" />}
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        แถวเดี่ยวประหยัดพื้นที่ อ่านหัวข้อข่าวได้รวดเร็วสไตล์ Reddit Classic
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Default Sort */}
              <div className="space-y-2">
                <label className="text-zinc-900 dark:text-zinc-200 font-semibold text-xs flex items-center gap-1.5">
                  <Flame size={14} className="text-red-600 dark:text-red-400" />
                  <span>การจัดเรียงโพสต์เริ่มต้น (Default Feed Sort)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'hot', label: 'มาแรง (Hot)', desc: 'โพสต์ที่มีปฏิสัมพันธ์สูง' },
                    { key: 'breaking', label: 'ข่าวด่วน (Breaking)', desc: 'ปักหมุดข่าวเร่งด่วน' },
                    { key: 'new', label: 'ใหม่ล่าสุด (New)', desc: 'เรียงตามเวลาสร้าง' },
                    { key: 'top', label: 'ยอดนิยม (Top)', desc: 'คะแนนโหวตสูงสุด' },
                  ].map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => updateSetting('defaultSort', s.key as AppSettings['defaultSort'])}
                      className={`p-2.5 rounded-lg border text-left transition-colors ${
                        settings.defaultSort === s.key
                          ? 'border-red-500/70 bg-red-50 dark:bg-red-950/30 text-zinc-900 dark:text-white font-medium'
                          : 'border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/40 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-white/[0.12]'
                      }`}
                    >
                      <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">{s.label}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 truncate">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reading Font Size */}
              <div className="p-3.5 bg-zinc-50 dark:bg-black/40 rounded-xl border border-zinc-200 dark:border-white/[0.06] flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-xs">
                    <Type size={14} className="text-amber-600 dark:text-yellow-400" />
                    <span>ขนาดตัวอักษรสำหรับการอ่านเนื้อหา</span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">
                    เพิ่มขนาดตัวอักษรเนื้อหากระทู้เพื่อให้อ่านบทความข่าวยาวๆ สบายตาขึ้น
                  </p>
                </div>
                <div className="flex bg-zinc-200/70 dark:bg-white/[0.06] p-1 rounded-lg border border-zinc-300 dark:border-white/[0.08] shrink-0 text-xs">
                  <button
                    onClick={() => updateSetting('fontSize', 'normal')}
                    className={`px-3 py-1 rounded transition-colors ${
                      settings.fontSize === 'normal'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    ปกติ (14px)
                  </button>
                  <button
                    onClick={() => updateSetting('fontSize', 'comfortable')}
                    className={`px-3 py-1 rounded transition-colors ${
                      settings.fontSize === 'comfortable'
                        ? 'bg-yellow-400 text-zinc-950 font-bold shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    สบายตา (16px)
                  </button>
                </div>
              </div>

              {/* Reduce Motion */}
              <div className="p-3.5 bg-zinc-50 dark:bg-black/40 rounded-xl border border-zinc-200 dark:border-white/[0.06] flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-zinc-900 dark:text-zinc-100 font-semibold text-xs">
                    ลดอนิเมชั่นและการกระพริบ (Reduce Motion / Low CPU)
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">
                    ปิดเอฟเฟกต์ไฟกระพริบของ Breaking News และอนิเมชั่นของห้องแชท ช่วยประหยัดแบตเตอรี่
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.reduceMotion}
                    onChange={(e) => updateSetting('reduceMotion', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-300 dark:bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-400"></div>
                </label>
              </div>

              {/* Show News Ticker */}
              <div className="p-3.5 bg-zinc-50 dark:bg-black/40 rounded-xl border border-zinc-200 dark:border-white/[0.06] flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-zinc-900 dark:text-zinc-100 font-semibold text-xs flex items-center gap-1.5">
                    <Radio size={14} className="text-red-600 dark:text-red-400" />
                    <span>แถบวิ่งข่าวด่วนเรียลไทม์ (Breaking News Ticker)</span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">
                    แสดงแถบพาดหัวข่าวด่วนและกระทู้มาแรงแบบมินิมอลใต้แถบนำทาง (Navbar)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.showNewsTicker}
                    onChange={(e) => updateSetting('showNewsTicker', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-300 dark:bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

            </div>
          )}

          {/* TAB 3: CHAT & LIVE AUDIO */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              
              {/* Chat Sound Notification */}
              <div className="p-3.5 bg-zinc-50 dark:bg-black/40 rounded-xl border border-zinc-200 dark:border-white/[0.06] space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-xs sm:text-sm">
                      <Volume2 size={15} className="text-orange-600 dark:text-orange-400" />
                      <span>เสียงแจ้งเตือนข้อความแชทใหม่ (Audio Chime)</span>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                      เล่นเสียงกังวานสังเคราะห์เบาๆ เมื่อมีข้อความใหม่เข้ามาในห้องแชทสดหรือห้องผีสิง
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={settings.chatSound}
                      onChange={(e) => updateSetting('chatSound', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-zinc-300 dark:bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>

                <div className="pt-2 border-t border-zinc-200 dark:border-white/[0.06] flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500">สังเคราะห์เสียงผ่าน Web Audio API โดยไม่ต้องดาวน์โหลดไฟล์</span>
                  <button
                    onClick={handleTestAudio}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-white/[0.06] hover:bg-zinc-100 dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white border border-zinc-300 dark:border-white/[0.08] transition-colors text-xs font-medium"
                  >
                    <Volume2 size={13} className={audioTested ? 'text-amber-600 dark:text-yellow-400 scale-110' : 'text-zinc-500 dark:text-zinc-400'} />
                    <span>{audioTested ? 'กำลังเล่นเสียง...' : 'ทดสอบเสียงแจ้งเตือน'}</span>
                  </button>
                </div>
              </div>

              {/* Enter to Send */}
              <div className="p-3.5 bg-zinc-50 dark:bg-black/40 rounded-xl border border-zinc-200 dark:border-white/[0.06] flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-xs sm:text-sm">
                    <CornerDownLeft size={15} className="text-amber-600 dark:text-yellow-400" />
                    <span>กดปุ่ม Enter เพื่อส่งข้อความทันที</span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                    เมื่อเปิด: กด <kbd className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-white/[0.1] font-mono text-[10px]">Enter</kbd> เพื่อส่ง และกด <kbd className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-white/[0.1] font-mono text-[10px]">Shift + Enter</kbd> เพื่อขึ้นบรรทัดใหม่
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={settings.enterToSend}
                    onChange={(e) => updateSetting('enterToSend', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-300 dark:bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-400"></div>
                </label>
              </div>

              {/* Auto Scroll */}
              <div className="p-3.5 bg-zinc-50 dark:bg-black/40 rounded-xl border border-zinc-200 dark:border-white/[0.06] flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-zinc-900 dark:text-zinc-100 font-semibold text-xs sm:text-sm">
                    เลื่อนหน้าจอลงล่างสุดอัตโนมัติ (Auto-Scroll)
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                    เลื่อนหน้าต่างแชทลงสู่ข้อความล่าสุดเสมอเมื่อมีข้อความใหม่ถูกส่งเข้ามา
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={settings.autoScrollChat}
                    onChange={(e) => updateSetting('autoScrollChat', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-300 dark:bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

            </div>
          )}

          {/* TAB 4: THEME & SYSTEM */}
          {activeTab === 'theme' && (
            <div className="space-y-4">

              {/* Dark / Light Mode Selector */}
              <div className="space-y-2">
                <label className="text-zinc-900 dark:text-zinc-200 font-semibold text-xs flex items-center gap-1.5">
                  <Sun size={14} className="text-amber-500 dark:text-yellow-400" />
                  <span>โหมดการแสดงผล (Theme Mode)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'dark',
                      name: 'โหมดมืด (Dark)',
                      desc: 'พื้นหลัง Obsidian สบายตา เหมาะกับที่แสงน้อย',
                      icon: Moon,
                      iconColor: 'text-indigo-400',
                    },
                    {
                      id: 'light',
                      name: 'โหมดสว่าง (Light)',
                      desc: 'พื้นหลังสว่างสะอาดตา อ่านง่ายกลางแจ้ง',
                      icon: Sun,
                      iconColor: 'text-amber-500',
                    },
                    {
                      id: 'system',
                      name: 'ตามระบบ (Auto)',
                      desc: 'เปลี่ยนโหมดมืด-สว่างอัตโนมัติตามอุปกรณ์',
                      icon: Monitor,
                      iconColor: 'text-zinc-500 dark:text-zinc-400',
                    },
                  ].map((mode) => {
                    const ModeIcon = mode.icon;
                    const isActive = settings.themeMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => updateSetting('themeMode', mode.id as AppSettings['themeMode'])}
                        className={`p-3 rounded-xl border text-left transition-all relative ${
                          isActive
                            ? 'border-amber-500 dark:border-yellow-400 bg-amber-50 dark:bg-yellow-500/10 text-zinc-950 dark:text-white shadow-sm ring-1 ring-amber-500/30 dark:ring-yellow-400/30'
                            : 'border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-black/40 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-white/[0.15]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <ModeIcon size={15} className={mode.iconColor} />
                            <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">{mode.name}</span>
                          </div>
                          {isActive && (
                            <Check size={14} className="text-amber-600 dark:text-yellow-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                          {mode.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Theme Selector */}
              <div className="space-y-2">
                <label className="text-zinc-900 dark:text-zinc-200 font-semibold text-xs flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500 dark:text-yellow-400" />
                  <span>โทนสีสำเนียง (Accent Theme)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'crimson',
                      name: 'ZRMA Crimson',
                      badge: 'ค่าเริ่มต้น',
                      desc: 'เน้นความเข้มข้นด้วยสีแดงฉาน และไฮไลท์สีเหลือง/ส้ม',
                      colorRing: 'bg-red-500 border-red-400',
                    },
                    {
                      id: 'amber',
                      name: 'Amber Gold',
                      badge: 'Cyber Amber',
                      desc: 'ตัดด้วยสีทองและสีอำพันสว่างตา',
                      colorRing: 'bg-yellow-400 border-amber-300',
                    },
                    {
                      id: 'stealth',
                      name: 'Stealth Noir',
                      badge: 'พรางตา',
                      desc: 'โทนเรียบสุขุม ไร้แสงสะท้อน สำหรับสายซุ่ม',
                      colorRing: 'bg-zinc-400 border-zinc-300',
                    },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => updateSetting('accentTheme', t.id as AppSettings['accentTheme'])}
                      className={`p-3 rounded-xl border text-left transition-colors relative ${
                        settings.accentTheme === t.id
                          ? 'border-red-500/80 bg-red-50 dark:bg-red-950/20 text-zinc-950 dark:text-white shadow-sm ring-1 ring-red-500/30'
                          : 'border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-black/40 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-white/[0.15]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-3.5 h-3.5 rounded-full border ${t.colorRing}`}></span>
                          <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">{t.name}</span>
                        </div>
                        {settings.accentTheme === t.id && (
                          <Check size={14} className="text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        {t.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Data & Privacy Metrics Audit */}
              <div className="p-3.5 bg-zinc-50 dark:bg-black/40 rounded-xl border border-zinc-200 dark:border-white/[0.06] space-y-2">
                <div className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Shield size={14} className="text-zinc-500 dark:text-zinc-400" />
                  <span>สถานะการบันทึกข้อมูลในเครื่อง (Local Storage Audit)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.04]">
                    <div className="text-zinc-500 text-[10px]">Cookies</div>
                    <div className="text-zinc-900 dark:text-zinc-200 font-semibold">0 Trackers</div>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.04]">
                    <div className="text-zinc-500 text-[10px]">IP Logging</div>
                    <div className="text-zinc-900 dark:text-zinc-200 font-semibold">None (0B)</div>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.04]">
                    <div className="text-zinc-500 text-[10px]">Identity TTL</div>
                    <div className="text-zinc-900 dark:text-zinc-200 font-semibold">Session Only</div>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.04]">
                    <div className="text-zinc-500 text-[10px]">Self Destruct</div>
                    <div className="text-zinc-900 dark:text-zinc-200 font-semibold">Enabled</div>
                  </div>
                </div>
              </div>

              {/* Reset to Factory Defaults */}
              <div className="p-3.5 bg-zinc-50 dark:bg-black/40 rounded-xl border border-zinc-200 dark:border-white/[0.06] flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-200 text-xs">
                    รีเซ็ตการตั้งค่าทั้งหมดกลับเป็นค่าเริ่มต้น
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    คืนค่าตัวเลือกความเป็นส่วนตัว ฟีด และเสียงทั้งหมด
                  </p>
                </div>
                {showConfirmReset ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        resetSettings();
                        setShowConfirmReset(false);
                      }}
                      className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-[11px] font-bold transition-colors"
                    >
                      ยืนยันคืนค่า
                    </button>
                    <button
                      onClick={() => setShowConfirmReset(false)}
                      className="px-2 py-1.5 bg-zinc-200 dark:bg-white/[0.08] hover:bg-zinc-300 dark:hover:bg-white/[0.12] rounded text-[11px] text-zinc-700 dark:text-zinc-300"
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmReset(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/[0.06] hover:bg-zinc-100 dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded-lg border border-zinc-300 dark:border-white/[0.08] text-xs transition-colors shrink-0"
                  >
                    <RotateCcw size={13} />
                    <span>คืนค่าเริ่มต้น</span>
                  </button>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-black/40 flex items-center justify-between text-xs">
          <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-green-500"></span>
            <span>บันทึกการตั้งค่าลงเบราว์เซอร์ของคุณอัตโนมัติ</span>
          </div>
          <button
            onClick={onClose}
            className="btn-primary !py-1.5 !px-4 text-xs font-semibold"
          >
            เสร็จสิ้น
          </button>
        </div>

      </div>
    </div>
  );
}
