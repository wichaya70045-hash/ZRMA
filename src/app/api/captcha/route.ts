import { NextResponse } from 'next/server';
import { generateCaptcha } from '@/lib/captcha';

export const dynamic = 'force-dynamic';

export async function GET() {
  const challenge = generateCaptcha();
  return NextResponse.json(challenge, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
