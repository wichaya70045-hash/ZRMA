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
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-emerald-500 selection:text-slate-950">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
          <div className="max-w-6xl mx-auto px-4 space-y-2">
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Zero-Logs & Zero-Cookies Guarantee • ระบบไม่บันทึก IP หรือข้อมูลส่วนบุคคลใดๆ ทั้งสิ้น</span>
            </div>
            <p className="text-[11px] text-slate-600">
              เนื้อหาทั้งหมดจะถูกลบตามระยะเวลาที่กำหนด (TTL) และข้อความแชทสดจะถูกจำกัดที่ 100 ข้อความล่าสุดอัตโนมัติ
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
