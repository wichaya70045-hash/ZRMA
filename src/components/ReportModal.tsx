'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, Flag, CheckCircle } from 'lucide-react';
import { ReportReason } from '@/types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'thread' | 'comment' | 'chat';
  targetId: string;
  targetTitle?: string;
  onReportSuccess?: (newCount: number, isHidden: boolean) => void;
}

const REASONS: { key: ReportReason; label: string; desc: string }[] = [
  { key: 'spam', label: 'สแปมหรือโฆษณาหลอกลวง', desc: 'ข้อความซ้ำซาก ลิงก์ขายของ หรือโปรโมตที่ไม่เกี่ยวข้อง' },
  { key: 'fake_news', label: 'ข้อมูลเท็จ / ข่าวปลอม', desc: 'จงใจบิดเบือนข้อมูลหรือสร้างความตื่นตระหนก' },
  { key: 'illegal', label: 'เนื้อหาผิดกฎหมายหรืออันตราย', desc: 'สิ่งผิดกฎหมาย การละเมิดสิทธิ หรือความรุนแรง' },
  { key: 'harassment', label: 'คุกคาม / Hate Speech', desc: 'กลั่นแกล้ง ละเมิดสิทธิผู้อื่น หรือใช้ถ้อยคำสร้างความเกลียดชัง' },
  { key: 'other', label: 'อื่นๆ ที่ขัดต่อความสงบเรียบร้อย', desc: 'พฤติกรรมไม่เหมาะสมต่อชุมชน' },
];

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
  onReportSuccess,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason>('spam');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reason: selectedReason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        setMessage(data.message || 'ส่งรายงานเรียบร้อยแล้ว');
        if (onReportSuccess) {
          onReportSuccess(data.newReportCount, data.isHidden);
        }
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการส่งรายงาน');
      }
    } catch {
      alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">รายงานได้รับการบันทึกแล้ว</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              ระบบตรวจสอบแบบกระจายศูนย์: หากข้อความนี้ได้รับการรายงานจากชุมชนครบ 5 ครั้ง จะถูกซ่อนออกจากสายตาสาธารณะโดยอัตโนมัติ
            </p>
            <div className="pt-3">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">รายงานข้อความไม่เหมาะสม</h3>
                <p className="text-xs text-slate-400">
                  {targetType === 'thread' ? 'กระทู้' : targetType === 'comment' ? 'ความคิดเห็น' : 'ข้อความแชท'}
                  {targetTitle ? `: "${targetTitle.substring(0, 30)}..."` : ''}
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl text-xs text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                เมื่อมีผู้รายงานครบ <strong>5 ครั้ง</strong> ระบบจะซ่อนข้อความนี้โดยอัตโนมัติทันที เพื่อความปลอดภัยของทุกคนในชุมชน
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">เลือกสาเหตุที่ต้องการรายงาน:</label>
              <div className="space-y-1.5">
                {REASONS.map((r) => (
                  <label
                    key={r.key}
                    onClick={() => setSelectedReason(r.key)}
                    className={`block p-2.5 rounded-xl border cursor-pointer transition-all ${
                      selectedReason === r.key
                        ? 'border-emerald-500/60 bg-emerald-500/10'
                        : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="reportReason"
                        checked={selectedReason === r.key}
                        onChange={() => setSelectedReason(r.key)}
                        className="text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5"
                      />
                      <span className="text-xs font-medium text-slate-200">{r.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 ml-5.5 mt-0.5">{r.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-xl shadow-md transition-colors"
              >
                {isSubmitting ? 'กำลังส่งรายงาน...' : 'ยืนยันรายงาน'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
