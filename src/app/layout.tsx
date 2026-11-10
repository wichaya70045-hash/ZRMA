import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import BreakingNewsTicker from '@/components/BreakingNewsTicker';
import { SettingsProvider } from '@/lib/settings';

export const metadata: Metadata = {
  title: 'ZRMA Community - ชุมชนข่าวสาร เสวนา & แชทสด ไร้ตัวตน 100%',
  description: 'ชุมชนออนไลน์สไตล์ Reddit ที่เน้นความเป็นส่วนตัวสูงสุด ไม่เก็บ IP ไม่ต้องสมัครสมาชิก สุ่มชื่อใหม่ทุกกระทู้ และมีระบบทำลายข้อมูลอัตโนมัติ',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="dark">
      <body className="bg-[#090a0d] text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-red-600 selection:text-white font-sans overflow-x-hidden w-full max-w-full">
        <SettingsProvider>
          <Navbar />
          <BreakingNewsTicker />
          <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-3 sm:py-6 overflow-x-hidden">
            {children}
          </main>
          
          {/* Footer */}
          <footer className="border-t border-white/[0.08] bg-[#08090c]/90 py-8 text-center text-xs text-zinc-500 w-full overflow-hidden backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 space-y-2">
              <div className="flex items-center justify-center gap-2 font-mono text-[11px] text-zinc-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-zinc-200 font-bold tracking-wider">ZRMA COMMUNITY</span>
                <span className="text-zinc-600">•</span>
                <span className="text-yellow-400/90 font-medium">ZERO-LOG PRIVACY STANDARD</span>
              </div>
              <p className="text-[11px] text-zinc-500 max-w-xl mx-auto leading-relaxed">
                ระบบชุมชนนิรนามที่ไม่เก็บ IP Address • ข้อมูลถูกทำลายอัตโนมัติตามระยะเวลา (TTL) • ห้องแชทสดจำกัด 100 ข้อความล่าสุด
              </p>
            </div>
          </footer>
        </SettingsProvider>
      </body>
    </html>
  );
}
