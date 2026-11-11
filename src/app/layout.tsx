import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppShell from '@/components/AppShell';
import { SettingsProvider } from '@/lib/settings';
import { AuthProvider } from '@/lib/authContext';

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
    <html lang="th" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var raw = localStorage.getItem('zrma_user_settings_v1');
                  var mode = 'dark';
                  if (raw) {
                    var parsed = JSON.parse(raw);
                    if (parsed.themeMode === 'light') mode = 'light';
                    else if (parsed.themeMode === 'system') {
                      mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    }
                  }
                  var root = document.documentElement;
                  root.classList.remove('dark', 'light');
                  root.classList.add(mode);
                  root.setAttribute('data-theme-mode', mode);
                  root.style.colorScheme = mode;
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-[#f4f5f7] dark:bg-[#090a0d] text-zinc-900 dark:text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-red-600 selection:text-white font-sans overflow-x-hidden w-full max-w-full">
        <SettingsProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
