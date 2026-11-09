'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, PlusCircle, MessageSquare, ShieldCheck, Flame, Info, X } from 'lucide-react';

export default function Navbar() {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo & Privacy Badge */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg text-white tracking-wide">นิรนามบอร์ด</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Zero-Log
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  บอร์ดข่าว & แชทสด ไร้ตัวตน ปลอดภัยสูงสุด
                </p>
              </div>
            </Link>
          </div>

          {/* Center Privacy Indicators (Hidden on mobile) */}
          <div className="hidden md:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>ไม่บันทึก IP / ข้อมูลส่วนบุคคล</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1 rounded-full">
              <span>🎭 ชื่อสุ่มแยกตามกระทู้</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
              title="ข้อมูลมาตรการความเป็นส่วนตัว"
            >
              <Info className="w-5 h-5" />
            </button>

            <Link
              href="/chat"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>ห้องแชทสด</span>
              <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </Link>

            <Link
              href="/new"
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-md shadow-emerald-500/20 font-semibold transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>ตั้งกระทู้</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Privacy Guarantee Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-200">
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">นโยบายความเป็นส่วนตัวสูงสุด (Zero-Trace)</h3>
                <p className="text-xs text-slate-400">ระบบถูกออกแบบตามหลัก Privacy by Design</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm leading-relaxed text-slate-300">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-start gap-2.5">
                <span className="text-emerald-400 text-base">🚫</span>
                <div>
                  <strong className="text-white">ไร้การยืนยันตัวตน & ไร้การลงทะเบียน:</strong>
                  <p className="text-slate-400 text-xs mt-0.5">ไม่ต้องใช้ชื่อ, อีเมล หรือเบอร์โทรศัพท์ สามารถอ่านและโพสต์ได้ทันที</p>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-start gap-2.5">
                <span className="text-emerald-400 text-base">🛡️</span>
                <div>
                  <strong className="text-white">ไม่เก็บ IP & ไม่ฝังคุกกี้สอดแนม:</strong>
                  <p className="text-slate-400 text-xs mt-0.5">ฐานข้อมูลไม่มีฟิลด์ IP Address หรือ User-Agent แม้แต่คอลัมน์เดียว ข้อมูลไม่ถูกจัดเก็บในเซิร์ฟเวอร์</p>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-start gap-2.5">
                <span className="text-cyan-400 text-base">🎭</span>
                <div>
                  <strong className="text-white">ระบบสุ่มชื่อแยกตามกระทู้ (Per-Thread Alias):</strong>
                  <p className="text-slate-400 text-xs mt-0.5">ชื่อของคุณจะถูกสร้างแบบสุ่มและเก็บไว้ใน sessionStorage เท่านั้น เมื่อไปตอบในกระทู้อื่น คุณจะได้ชื่อใหม่ ทำให้ไม่มีใครสามารถตามรอยการใช้งานข้ามกระทู้ได้</p>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-start gap-2.5">
                <span className="text-amber-400 text-base">⏳</span>
                <div>
                  <strong className="text-white">ลบข้อมูลอัตโนมัติ (Auto-Destruct & FIFO):</strong>
                  <p className="text-slate-400 text-xs mt-0.5">กระทู้มีอายุขัยที่แน่นอน (24 ชม. - 7 วัน) และจะถูกลบถาวรจากฐานข้อมูลอัตโนมัติ สำหรับห้องแชทสดจะเก็บเพียง 100 ข้อความล่าสุดเท่านั้น</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
              >
                เข้าใจแล้ว เข้าใช้งานได้ทันที
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
