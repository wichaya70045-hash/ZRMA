import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'นิรนามบอร์ด - บอร์ดข่าว กระทู้พูดคุย & แชทสด ไร้ตัวตน ปลอดภัยสูงสุด',
  description: 'เว็บบอร์ดนิรนามที่ไม่เก็บ IP Address, ไม่ต้องสมัครสมาชิก, สุ่มชื่อใหม่ทุกกระทู้ และมีระบบทำลายข้อมูลอัตโนมัติ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="dark">
      <body className="bg-[#090a0c] text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-emerald-500 selection:text-zinc-950 font-sans">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="border-t border-white/[0.06] bg-[#090a0c] py-6 text-center text-xs text-zinc-500">
          <div className="max-w-6xl mx-auto px-4 space-y-1.5">
            <div className="flex items-center justify-center gap-2 font-mono text-[11px] text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>ZERO-LOG ARCHITECTURE • NO IP ADDRESS LOGGED</span>
            </div>
            <p className="text-[11px] text-zinc-600">
              เนื้อหาจะถูกทำลายตามระยะเวลาที่กำหนด (TTL) และห้องแชทสดจำกัดเพียง 100 ข้อความล่าสุด
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
