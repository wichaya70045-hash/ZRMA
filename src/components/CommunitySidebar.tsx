'use client';

import React from 'react';
import Link from 'next/link';
import {
  Shield,
  Plus,
  Users,
  Radio,
  Clock,
  Layers,
  FileText,
  AlertCircle,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { Category } from '@/types';

interface CommunitySidebarProps {
  currentCategory?: string;
  onSelectCategory?: (cat: string) => void;
}

const SUB_COMMUNITIES: { id: Category; name: string; tag: string; members: string; desc: string }[] = [
  { id: 'breaking', name: 'ข่าวด่วน', tag: 'r/breaking', members: '840', desc: 'เกาะติดสถานการณ์และข่าวด่วน' },
  { id: 'tech', name: 'เทคโนโลยี', tag: 'r/tech', members: '1.2k', desc: 'IT, AI, CyberSec และความเป็นส่วนตัว' },
  { id: 'finance', name: 'เศรษฐกิจ', tag: 'r/finance', members: '650', desc: 'การเงิน คริปโต และธุรกิจ' },
  { id: 'society', name: 'สังคม & การเมือง', tag: 'r/society', members: '920', desc: 'ประเด็นสังคมและนโยบายสาธารณะ' },
  { id: 'general', name: 'ทั่วไป', tag: 'r/general', members: '1.4k', desc: 'แลกเปลี่ยนความคิดเห็นทั่วไป' },
  { id: 'science', name: 'วิทยาศาสตร์', tag: 'r/science', members: '430', desc: 'นวัตกรรม การค้นพบ และอวกาศ' },
];

export default function CommunitySidebar({
  currentCategory = 'all',
  onSelectCategory,
}: CommunitySidebarProps) {
  return (
    <div className="space-y-4">
      {/* About Community Card (Reddit Style) */}
      <div className="bg-[#101217] border border-white/[0.08] rounded-xl overflow-hidden shadow-lg">
        {/* Banner Top */}
        <div className="h-12 bg-gradient-to-r from-red-950 via-zinc-900 to-black p-3 flex items-center justify-between border-b border-white/[0.06]">
          <span className="text-[11px] font-mono font-bold text-yellow-400 tracking-wider">
            ABOUT COMMUNITY
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
        </div>

        <div className="p-4 space-y-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-red-950/60 border border-red-500/30 text-red-500 flex items-center justify-center font-bold text-sm shrink-0">
              <Shield size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                <span>ZRMA Community</span>
              </h2>
              <span className="text-[11px] font-mono text-zinc-500">r/ZRMA • Zero-Trace</span>
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            ชุมชนข่าวสารและเสวนาแบบไร้ตัวตน 100% สุ่มรหัสใหม่ทุกกระทู้ ไม่เก็บ IP Address และทำลายตัวเองอัตโนมัติตามกำหนด (TTL)
          </p>

          {/* Reddit-style Community Stats */}
          <div className="grid grid-cols-2 gap-2 py-2 border-y border-white/[0.06]">
            <div>
              <div className="text-xs font-mono font-bold text-zinc-100 tabular-nums">1.4k</div>
              <div className="text-[10px] text-zinc-500">สมาชิกนิรนาม</div>
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-yellow-400 flex items-center gap-1 tabular-nums">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
                <span>52</span>
              </div>
              <div className="text-[10px] text-zinc-500">กำลังคุยสด</div>
            </div>
          </div>

          <Link
            href="/new"
            className="w-full btn-primary text-xs justify-center"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>สร้างโพสต์ใหม่</span>
          </Link>
        </div>
      </div>

      {/* Sub-communities list */}
      <div className="bg-[#101217] border border-white/[0.08] rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <h3 className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-wider">
            หมวดหมู่ (Subreddits)
          </h3>
          <span className="text-[10px] font-mono text-zinc-600">6 ห้อง</span>
        </div>

        <div className="space-y-1">
          {SUB_COMMUNITIES.map((sub) => {
            const isSelected = currentCategory === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => onSelectCategory && onSelectCategory(sub.id)}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                  isSelected
                    ? 'bg-yellow-500/10 text-yellow-400 font-semibold border border-yellow-500/25'
                    : 'text-zinc-300 hover:bg-white/[0.03] hover:text-white border border-transparent'
                }`}
              >
                <div>
                  <div className="font-mono text-xs">{sub.tag}</div>
                  <div className="text-[10px] text-zinc-500">{sub.name}</div>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
                  {sub.members}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Community Rules Widget */}
      <div className="bg-[#101217] border border-white/[0.08] rounded-xl p-3.5 space-y-2.5 text-xs">
        <h3 className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-wider pb-1.5 border-b border-white/[0.06]">
          กฎระเบียบ ZRMA Community
        </h3>
        
        <ol className="space-y-2 text-[11px] text-zinc-400 leading-relaxed list-decimal list-inside">
          <li>
            <strong className="text-zinc-200">เคารพความเป็นส่วนตัว:</strong> ห้ามสืบหาหรือเปิดเผยตัวตนจริงของผู้อื่น
          </li>
          <li>
            <strong className="text-zinc-200">ห้ามสแปม:</strong> ห้ามโพสต์โปรโมตซ้ำซากหรือข้อความหลอกลวง
          </li>
          <li>
            <strong className="text-zinc-200">ระบบตัดสินโดยชุมชน:</strong> หากถูกรายงานครบ 5 ครั้ง ข้อความจะถูกซ่อนอัตโนมัติ
          </li>
          <li>
            <strong className="text-zinc-200">ทำลายตัวเอง:</strong> ข้อมูลทั้งหมดจะถูกลบถาวรเมื่อครบอายุ (TTL)
          </li>
        </ol>
      </div>
    </div>
  );
}
