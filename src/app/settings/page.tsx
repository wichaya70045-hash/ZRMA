'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSettings, AppSettings } from '@/lib/settings';
import {
  Settings,
  Shield,
  EyeOff,
  Eye,
  Volume2,
  Zap,
  RotateCcw,
  Sliders,
  Check,
  AlertTriangle,
  LayoutList,
  LayoutGrid,
  Type,
  Flame,
  Radio,
  CornerDownLeft,
  Sparkles,
  ArrowLeft,
  Lock,
} from 'lucide-react';

export default function SettingsPage() {
  const {
    settings,
    updateSetting,
    resetSettings,
    executePanicWipe,
    playChatChime,
  } = useSettings();

  const [activeTab, setActiveTab] = useState<'privacy' | 'feed' | 'chat' | 'theme'>('privacy');
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showConfirmPanic, setShowConfirmPanic] = useState(false);
  const [audioTested, setAudioTested] = useState(false);

  const handleTestAudio = () => {
    playChatChime();
    setAudioTested(true);
    setTimeout(() => setAudioTested(false), 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-yellow-400 mb-2 transition-colors"
          >
            <ArrowLeft size={13} />
            <span>กลับหน้าหลัก (z/all)</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <Sliders className="text-red-500" size={22} />
            <span>ตั้งค่าระบบและการใช้งาน (ZRMA Settings)</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            ปรับแต่งความเป็นส่วนตัว โหมดพรางตัว รูปแบบการอ่าน และระบบเสียงตามที่คุณต้องการ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfirmPanic(true)}
            className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <AlertTriangle size={13} />
            <span>ล้างรอยหนีทันที</span>
          </button>
        </div>
      </div>

      {showConfirmPanic && (
        <div className="p-4 bg-red-950/40 border border-red-500/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="space-y-0.5">
            <div className="text-sm font-bold text-red-300 flex items-center gap-1.5">
              <AlertTriangle size={16} />
              <span>ยืนยันการใช้ Panic Button หรือไม่?</span>
            </div>
            <p className="text-xs text-zinc-300">
              ระบบจะล้างข้อมูลแคชและเซสชันทั้งหมดในเครื่องทันที และเปิดหน้าเว็บ Wikipedia เพื่อพรางตัว
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={executePanicWipe}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-xs"
            >
              ยืนยัน ล้างและหนีทันที
            </button>
            <button
              onClick={() => setShowConfirmPanic(false)}
              className="px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.12] rounded text-xs text-zinc-300"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/[0.08] gap-2 overflow-x-auto text-xs pb-1">
        <button
          onClick={() => setActiveTab('privacy')}
          className={`py-2 px-3.5 rounded-lg font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'privacy'
              ? 'bg-red-950/60 text-red-400 border border-red-500/40 font-bold'
              : 'text-zinc-400 hover:text-zinc-200 bg-white/[0.02]'
          }`}
        >
          <Shield size={14} />
          <span>ความเป็นส่วนตัว & อัตลักษณ์</span>
        </button>

        <button
          onClick={() => setActiveTab('feed')}
          className={`py-2 px-3.5 rounded-lg font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'feed'
              ? 'bg-yellow-950/40 text-yellow-400 border border-yellow-500/40 font-bold'
              : 'text-zinc-400 hover:text-zinc-200 bg-white/[0.02]'
          }`}
        >
          <LayoutList size={14} />
          <span>ฟีด & การอ่านเนื้อหา</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`py-2 px-3.5 rounded-lg font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'chat'
              ? 'bg-orange-950/40 text-orange-400 border border-orange-500/40 font-bold'
              : 'text-zinc-400 hover:text-zinc-200 bg-white/[0.02]'
          }`}
        >
          <Radio size={14} />
          <span>แชทสด & เสียง</span>
        </button>

        <button
          onClick={() => setActiveTab('theme')}
          className={`py-2 px-3.5 rounded-lg font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'theme'
              ? 'bg-zinc-800 text-zinc-100 border border-white/[0.2] font-bold'
              : 'text-zinc-400 hover:text-zinc-200 bg-white/[0.02]'
          }`}
        >
          <Sparkles size={14} />
          <span>ธีมสี & ระบบ</span>
        </button>
      </div>

      {/* Main Settings Panel */}
      <div className="bg-[#101217] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
        
        {/* PRIVACY TAB */}
        {activeTab === 'privacy' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield size={16} className="text-red-400" />
                <span>มาตรการคุ้มครองความเป็นส่วนตัวและอัตลักษณ์ไร้รอยต่อ</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                ZRMA ทำงานบนฐานข้อมูลแบบไร้ประวัติส่วนบุคคล (Zero-Log) คุณสามารถยกระดับการพรางตัวได้ตามต้องการ
              </p>
            </div>

            {/* Strict Zero-Trace Mode */}
            <div className="p-4 bg-black/40 rounded-xl border border-white/[0.06] hover:border-red-500/30 transition-colors flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-semibold text-zinc-100 text-sm flex items-center gap-2">
                  <span>โหมดพรางตัวเข้มงวด (Strict Zero-Trace)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-500/30">
                    Auto-Reroll
                  </span>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  สุ่มชื่อและไอคอนประจำตัวใหม่ทุกครั้งเมื่อโพสต์กระทู้ใหม่ หรือส่งข้อความตอบกลับ เพื่อป้องกันการเชื่อมโยงความเห็นในเซสชันเดียวกันโดยสิ้นเชิง
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={settings.strictZeroTrace}
                  onChange={(e) => updateSetting('strictZeroTrace', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            {/* Blur Media */}
            <div className="p-4 bg-black/40 rounded-xl border border-white/[0.06] hover:border-yellow-500/30 transition-colors flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-semibold text-zinc-100 text-sm flex items-center gap-2">
                  <EyeOff size={16} className="text-yellow-400" />
                  <span>เบลอสื่อมีเดียเริ่มต้น (Auto-Blur Images & Videos)</span>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  เบลอรูปภาพและวิดีโอทั้งหมดบนฟีดและในกระทู้เป็นค่าเริ่มต้น ต้องคลิกที่รูปเพื่อเปิดดู เหมาะกับการใช้งานในที่สาธารณะหรือที่ทำงาน
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={settings.blurMedia}
                  onChange={(e) => updateSetting('blurMedia', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
              </label>
            </div>

            {/* Panic Shortcut */}
            <div className="p-4 bg-black/40 rounded-xl border border-white/[0.06] hover:border-orange-500/30 transition-colors flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-semibold text-zinc-100 text-sm flex items-center gap-2">
                  <Zap size={16} className="text-orange-400" />
                  <span>ปุ่มลัดฉุกเฉินหนีทันที (Panic Key: กด ESC 2 ครั้ง)</span>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  เมื่อกดแป้นพิมพ์ <kbd className="px-1.5 py-0.5 rounded bg-white/[0.1] text-zinc-200 font-mono text-xs">Esc</kbd> 2 ครั้งติดกันอย่างรวดเร็ว ระบบจะล้างรหัสเซสชันในเครื่องและสลับหน้าต่างไปยัง Wikipedia ทันที
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={settings.panicShortcut}
                  onChange={(e) => updateSetting('panicShortcut', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            {/* Auto Clear On Exit */}
            <div className="p-4 bg-black/40 rounded-xl border border-white/[0.06] flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-semibold text-zinc-100 text-sm flex items-center gap-2">
                  <Lock size={16} className="text-zinc-400" />
                  <span>ล้างรหัสเซสชันอัตโนมัติเมื่อปิดแท็บเบราว์เซอร์</span>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  ลบประวัติ sessionStorage ทั้งหมดเมื่อผู้ใช้ปิดแท็บหรือปิดหน้าต่างเบราว์เซอร์ ไม่ทิ้งรอยค้างไว้ในเครื่อง
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={settings.autoClearOnExit}
                  onChange={(e) => updateSetting('autoClearOnExit', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          </div>
        )}

        {/* FEED TAB */}
        {activeTab === 'feed' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <LayoutList size={16} className="text-yellow-400" />
                <span>มุมมองฟีดและการจัดเรียงเนื้อหา</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                เลือกรูปแบบการแสดงผลที่ตอบโจทย์รูปแบบการอ่านข่าวสารของคุณ
              </p>
            </div>

            {/* Feed View Layout */}
            <div className="space-y-2">
              <label className="text-zinc-200 font-semibold text-xs">
                รูปแบบมุมมองฟีด (Feed Layout)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateSetting('feedLayout', 'card')}
                  className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition-colors ${
                    settings.feedLayout === 'card'
                      ? 'border-yellow-400 bg-yellow-400/10 text-white shadow-sm ring-1 ring-yellow-400/30'
                      : 'border-white/[0.08] bg-black/40 text-zinc-400 hover:border-white/[0.15]'
                  }`}
                >
                  <div className="p-2.5 rounded-lg bg-white/[0.05] shrink-0">
                    <LayoutGrid size={20} className={settings.feedLayout === 'card' ? 'text-yellow-400' : 'text-zinc-500'} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                      <span>Card View (มุมมองการ์ดเต็ม)</span>
                      {settings.feedLayout === 'card' && <Check size={14} className="text-yellow-400" />}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      แสดงรูปภาพพรีวิว ข้อความสรุป แถบโหวต และข้อมูลครบถ้วน เหมาะสำหรับการท่องอ่านทั่วไป
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateSetting('feedLayout', 'compact')}
                  className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition-colors ${
                    settings.feedLayout === 'compact'
                      ? 'border-yellow-400 bg-yellow-400/10 text-white shadow-sm ring-1 ring-yellow-400/30'
                      : 'border-white/[0.08] bg-black/40 text-zinc-400 hover:border-white/[0.15]'
                  }`}
                >
                  <div className="p-2.5 rounded-lg bg-white/[0.05] shrink-0">
                    <LayoutList size={20} className={settings.feedLayout === 'compact' ? 'text-yellow-400' : 'text-zinc-500'} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                      <span>Compact View (มุมมองกะทัดรัด)</span>
                      {settings.feedLayout === 'compact' && <Check size={14} className="text-yellow-400" />}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      แถวเดี่ยวประหยัดพื้นที่ อ่านหัวข้อข่าวได้รวดเร็วสไตล์ Reddit Classic และ Hacker News
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Default Sort */}
            <div className="space-y-2">
              <label className="text-zinc-200 font-semibold text-xs flex items-center gap-1.5">
                <Flame size={14} className="text-red-400" />
                <span>การจัดเรียงโพสต์เริ่มต้น (Default Feed Sort)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { key: 'hot', label: '🔥 มาแรง (Hot)', desc: 'โพสต์ที่มีการพูดคุยสูง' },
                  { key: 'breaking', label: '⚡ ข่าวด่วน (Breaking)', desc: 'ปักหมุดข่าวเร่งด่วน' },
                  { key: 'new', label: '✨ ใหม่ล่าสุด (New)', desc: 'เรียงตามเวลาสร้าง' },
                  { key: 'top', label: '🔝 ยอดนิยม (Top)', desc: 'คะแนนโหวตสูงสุด' },
                ].map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => updateSetting('defaultSort', s.key as AppSettings['defaultSort'])}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      settings.defaultSort === s.key
                        ? 'border-red-500 bg-red-950/30 text-white font-medium shadow-sm'
                        : 'border-white/[0.06] bg-black/40 text-zinc-400 hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="text-xs font-bold text-zinc-200">{s.label}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Reading Font Size */}
            <div className="p-4 bg-black/40 rounded-xl border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-zinc-100 text-sm flex items-center gap-1.5">
                  <Type size={15} className="text-yellow-400" />
                  <span>ขนาดตัวอักษรสำหรับการอ่านเนื้อหา</span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  เพิ่มขนาดตัวอักษรเนื้อหากระทู้เพื่อให้อ่านบทความข่าวยาวๆ สบายตาขึ้น
                </p>
              </div>
              <div className="flex bg-white/[0.06] p-1 rounded-lg border border-white/[0.08] shrink-0 text-xs">
                <button
                  onClick={() => updateSetting('fontSize', 'normal')}
                  className={`px-3.5 py-1.5 rounded transition-colors ${
                    settings.fontSize === 'normal'
                      ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  ปกติ (14px)
                </button>
                <button
                  onClick={() => updateSetting('fontSize', 'comfortable')}
                  className={`px-3.5 py-1.5 rounded transition-colors ${
                    settings.fontSize === 'comfortable'
                      ? 'bg-yellow-400 text-zinc-950 font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  สบายตา (16px)
                </button>
              </div>
            </div>

            {/* Reduce Motion */}
            <div className="p-4 bg-black/40 rounded-xl border border-white/[0.06] flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-zinc-100">
                  ลดอนิเมชั่นและการกระพริบ (Reduce Motion / Low CPU)
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
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
                <div className="w-11 h-6 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
              </label>
            </div>
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio size={16} className="text-orange-400" />
                <span>ห้องแชทสดและระบบเสียงแจ้งเตือน</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                ปรับแต่งการแจ้งเตือนเสียงและการส่งข้อความในห้องแชท z/lounge และห้องชั่วคราว
              </p>
            </div>

            {/* Audio Chime */}
            <div className="p-4 bg-black/40 rounded-xl border border-white/[0.06] space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-semibold text-zinc-100 text-sm flex items-center gap-2">
                    <Volume2 size={16} className="text-orange-400" />
                    <span>เสียงแจ้งเตือนข้อความแชทใหม่ (Audio Chime)</span>
                  </div>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    เล่นเสียงกังวานสังเคราะห์เบาๆ เมื่อมีข้อความใหม่เข้ามาในห้องแชทสดหรือห้องผีสิง
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={settings.chatSound}
                    onChange={(e) => updateSetting('chatSound', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-xs text-zinc-500">สังเคราะห์เสียงผ่าน Web Audio API ไม่ต้องดาวน์โหลดไฟล์ภายนอก</span>
                <button
                  onClick={handleTestAudio}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/[0.08] transition-colors text-xs font-semibold"
                >
                  <Volume2 size={13} className={audioTested ? 'text-yellow-400 scale-110' : 'text-zinc-400'} />
                  <span>{audioTested ? 'กำลังเล่นเสียง...' : 'ทดสอบเสียงแจ้งเตือน'}</span>
                </button>
              </div>
            </div>

            {/* Enter to Send */}
            <div className="p-4 bg-black/40 rounded-xl border border-white/[0.06] flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-semibold text-zinc-100 text-sm flex items-center gap-2">
                  <CornerDownLeft size={16} className="text-yellow-400" />
                  <span>กดปุ่ม Enter เพื่อส่งข้อความทันที</span>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  เมื่อเปิด: กด <kbd className="px-1.5 py-0.5 rounded bg-white/[0.1] font-mono text-xs">Enter</kbd> เพื่อส่ง และกด <kbd className="px-1.5 py-0.5 rounded bg-white/[0.1] font-mono text-xs">Shift + Enter</kbd> เพื่อขึ้นบรรทัดใหม่
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={settings.enterToSend}
                  onChange={(e) => updateSetting('enterToSend', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
              </label>
            </div>

            {/* Auto Scroll */}
            <div className="p-4 bg-black/40 rounded-xl border border-white/[0.06] flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-semibold text-zinc-100 text-sm">
                  เลื่อนหน้าจอลงล่างสุดอัตโนมัติ (Auto-Scroll)
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  เลื่อนหน้าต่างแชทลงสู่ข้อความล่าสุดเสมอเมื่อมีข้อความใหม่ถูกส่งเข้ามา
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={settings.autoScrollChat}
                  onChange={(e) => updateSetting('autoScrollChat', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
          </div>
        )}

        {/* THEME TAB */}
        {activeTab === 'theme' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-yellow-400" />
                <span>โทนสีและระบบ</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                เลือกสไตล์สีที่เข้ากับบรรยากาศการใช้งานของคุณ
              </p>
            </div>

            {/* Accent Theme */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {[
                {
                  id: 'crimson',
                  name: 'ZRMA Crimson',
                  badge: 'ค่าเริ่มต้น',
                  desc: 'ดำ ดำสนิท แดงฉาน และไฮไลท์สีเหลือง/ส้ม',
                  colorRing: 'bg-red-500 border-red-400',
                },
                {
                  id: 'amber',
                  name: 'Amber Gold',
                  badge: 'Cyber Amber',
                  desc: 'ดำสนิท ตัดด้วยสีทองและสีอำพันสว่างตา',
                  colorRing: 'bg-yellow-400 border-amber-300',
                },
                {
                  id: 'stealth',
                  name: 'Stealth Noir',
                  badge: 'พรางตา',
                  desc: 'โทนดำด้าน ควันบุหรี่ ไร้แสงสะท้อน สำหรับสายซุ่ม',
                  colorRing: 'bg-zinc-400 border-zinc-300',
                },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => updateSetting('accentTheme', t.id as AppSettings['accentTheme'])}
                  className={`p-4 rounded-xl border text-left transition-colors relative ${
                    settings.accentTheme === t.id
                      ? 'border-red-500/80 bg-red-950/20 text-white shadow-sm ring-1 ring-red-500/30'
                      : 'border-white/[0.08] bg-black/40 text-zinc-400 hover:border-white/[0.15]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-3.5 h-3.5 rounded-full border ${t.colorRing}`}></span>
                      <span className="font-bold text-sm text-zinc-100">{t.name}</span>
                    </div>
                    {settings.accentTheme === t.id && (
                      <Check size={16} className="text-red-400" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {t.desc}
                  </p>
                </button>
              ))}
            </div>

            {/* Reset Settings to Defaults */}
            <div className="p-4 bg-black/40 rounded-xl border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-zinc-200 text-sm">
                  รีเซ็ตการตั้งค่าทั้งหมดกลับเป็นค่าเริ่มต้น
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  คืนค่าตัวเลือกความเป็นส่วนตัว ฟีด และเสียงทั้งหมดกลับสู่สถานะมาตรฐาน
                </p>
              </div>
              {showConfirmReset ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      resetSettings();
                      setShowConfirmReset(false);
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-xs transition-colors"
                  >
                    ยืนยันคืนค่า
                  </button>
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.12] rounded text-xs text-zinc-300"
                  >
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirmReset(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 hover:text-white rounded-lg border border-white/[0.08] text-xs font-semibold transition-colors shrink-0"
                >
                  <RotateCcw size={13} />
                  <span>คืนค่าเริ่มต้น</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
