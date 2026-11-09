// Privacy & Anonymity Engine
// Zero logs, zero tracking, ephemeral sessionStorage-scoped identities
// Palette: Black, Red, Yellow, with Orange accents

export interface AnonymousIdentity {
  alias: string;
  avatarIcon: string;
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
  { name: 'red', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  { name: 'yellow', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  { name: 'orange', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  { name: 'amber', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  { name: 'zinc', bg: 'bg-white/[0.04]', text: 'text-zinc-300', border: 'border-white/[0.08]' },
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

  const storageKey = `zrma_v3_anon_${scopeKey}`;
  const existing = sessionStorage.getItem(storageKey);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (parsed.alias && (parsed.avatarIcon || parsed.avatar)) {
        return {
          alias: parsed.alias,
          avatarIcon: parsed.avatarIcon || 'shield',
          color: parsed.color || 'red',
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
    // ignore
  }
  return newIdentity;
}

export function rerollScopedIdentity(scopeKey: string): AnonymousIdentity {
  if (typeof window === 'undefined') {
    return generateRandomIdentity();
  }
  const storageKey = `zrma_v3_anon_${scopeKey}`;
  const newIdentity = generateRandomIdentity();
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(newIdentity));
  } catch {
    // ignore
  }
  return newIdentity;
}
