import crypto from 'crypto';
import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';
import { getUserById } from './db';
import type { UserProfile } from '@/types';

export const AUTH_COOKIE_NAME = 'zrma_auth_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

// Server-side secret with safe fallback matching captcha pattern
const SESSION_SECRET =
  process.env.ZRMA_AUTH_SECRET ||
  process.env.ZRMA_CAPTCHA_SECRET ||
  'zrma_default_ephemeral_session_secret_change_in_prod';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  if (!salt || !keyHex) return false;

  try {
    const keyBuffer = Buffer.from(keyHex, 'hex');
    const derivedBuffer = crypto.scryptSync(password, salt, 64);
    if (keyBuffer.length !== derivedBuffer.length) return false;
    return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
  } catch {
    return false;
  }
}

interface SessionPayload {
  uid: string;
  exp: number;
}

export function signSessionToken(userId: string): string {
  const payload: SessionPayload = {
    uid: userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string): string | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return null;

  try {
    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(encoded)
      .digest('base64url');

    const sigBuf = Buffer.from(sig, 'utf-8');
    const expectedBuf = Buffer.from(expectedSig, 'utf-8');
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as SessionPayload;
    if (!payload.uid || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload.uid;
  } catch {
    return null;
  }
}

function isSecureRequest(req?: NextRequest): boolean {
  if (!req) return false;
  return (
    req.headers.get('x-forwarded-proto') === 'https' ||
    req.nextUrl?.protocol === 'https:'
  );
}

export function attachSessionCookie(res: NextResponse, userId: string, req?: NextRequest): void {
  const token = signSessionToken(userId);
  res.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
    secure: isSecureRequest(req),
  });
}

export function clearSessionCookie(res: NextResponse, req?: NextRequest): void {
  res.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    secure: isSecureRequest(req),
  });
}

export async function getSessionUser(req?: NextRequest): Promise<UserProfile | null> {
  try {
    let token: string | undefined;
    if (req) {
      token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    } else {
      const cookieStore = await cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    }
    if (!token) return null;
    const userId = verifySessionToken(token);
    if (!userId) return null;
    return getUserById(userId);
  } catch {
    return null;
  }
}
