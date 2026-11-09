// Privacy & Anonymity Engine
// Zero logs, zero tracking, ephemeral sessionStorage-scoped identities

export interface AnonymousIdentity {
  alias: string;
  avatarIcon: string; // Vector icon key: 'shield' | 'terminal' | 'cpu' | 'radar' | 'key' | 'lock' | 'fingerprint' | 'eye-off' | 'binary' | 'globe'
  color: string;
}

const ALIAS_PREFIXES = [
  'ผู้ไม่ประสงค์ออกนาม',
  'เงาไร้ตัวตน',
  'เหยี่ยวราตรี',
  'สายนทีลึกลับ',
  'นักท่องราตรี',
  'นักรหัสลับ',
  'แมวส้มหลงทาง',
  'อินทรีซุ่มเงียบ',
  'สายลมแปรปรวน',
  'ดาวตกไร้ทิศ',
  'สหายไร้ชื่อ',
  'นักปราชญ์พรางตัว',
  'หิ่งห้อยส่องทาง',
  'กิ้งก่าพรางกาย',
  'สิงโตเงาจันทร์',
  'หมอกยามเช้า',
  'นักดำน้ำนิรนาม',
  'ก้อนเมฆลอยละล่อง',
  'จิ้งจอกสายฟ้า',
  'ใบไม้ต้องสายลม',
];

export const AVATAR_ICON_KEYS = [
  'shield',
  'terminal',
  'cpu',
  'radar',
  'key',
  'lock',
  'fingerprint',
  'eye-off',
  'binary',
  'globe',
];

export const IDENTITY_THEMES = [
  { name: 'emerald', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  { name: 'zinc', bg: 'bg-zinc-500/10', text: 'text-zinc-300', border: 'border-zinc-500/20' },
  { name: 'cyan', bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  { name: 'amber', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  { name: 'sky', bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
];

export function generateRandomIdentity(): AnonymousIdentity {
  const prefix = ALIAS_PREFIXES[Math.floor(Math.random() * ALIAS_PREFIXES.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  const icon = AVATAR_ICON_KEYS[Math.floor(Math.random() * AVATAR_ICON_KEYS.length)];
  const theme = IDENTITY_THEMES[Math.floor(Math.random() * IDENTITY_THEMES.length)];

  return {
    alias: `${prefix} #${num}`,
    avatarIcon: icon,
    color: theme.name,
  };
}

export function getScopedIdentity(scopeKey: string): AnonymousIdentity {
  if (typeof window === 'undefined') {
    return generateRandomIdentity();
  }

  const storageKey = `zrma_v2_anon_${scopeKey}`;
  const existing = sessionStorage.getItem(storageKey);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (parsed.alias && (parsed.avatarIcon || parsed.avatar)) {
        return {
          alias: parsed.alias,
          avatarIcon: parsed.avatarIcon || 'shield',
          color: parsed.color || 'emerald',
        };
      }
    } catch {
      // ignore
    }
  }

  const newIdentity = generateRandomIdentity();
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(newIdentity));
  } catch {
    // sessionStorage quota or private mode
  }
  return newIdentity;
}

export function rerollScopedIdentity(scopeKey: string): AnonymousIdentity {
  if (typeof window === 'undefined') {
    return generateRandomIdentity();
  }
  const storageKey = `zrma_v2_anon_${scopeKey}`;
  const newIdentity = generateRandomIdentity();
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(newIdentity));
  } catch {
    // ignore
  }
  return newIdentity;
}
