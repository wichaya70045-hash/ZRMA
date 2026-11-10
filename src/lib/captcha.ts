import crypto from 'crypto';
import { isCaptchaUsed, markCaptchaUsed } from './db';

const SECRET_SALT = process.env.CAPTCHA_SECRET || 'zrma-ultra-privacy-secret-salt-3982';

export interface CaptchaData {
  question: string;
  token: string;
}

/**
 * Creates a stateless math challenge.
 * Answer and expiration are cryptographically sealed in the token.
 * Zero database, zero cookies, zero IP tracking needed.
 */
export function generateCaptcha(): CaptchaData {
  const operations = ['+', '-', '*'];
  const op = operations[Math.floor(Math.random() * operations.length)];
  let num1 = 0;
  let num2 = 0;
  let answer = 0;

  if (op === '+') {
    num1 = Math.floor(Math.random() * 20) + 1;
    num2 = Math.floor(Math.random() * 20) + 1;
    answer = num1 + num2;
  } else if (op === '-') {
    num1 = Math.floor(Math.random() * 25) + 10;
    num2 = Math.floor(Math.random() * 9) + 1;
    answer = num1 - num2;
  } else {
    // multiply
    num1 = Math.floor(Math.random() * 9) + 2;
    num2 = Math.floor(Math.random() * 9) + 2;
    answer = num1 * num2;
  }

  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes valid
  const rawPayload = `${answer}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', SECRET_SALT).update(rawPayload).digest('hex');
  const token = Buffer.from(`${rawPayload}:${hmac}`).toString('base64url');

  return {
    question: `ยืนยันความปลอดภัย: ${num1} ${op} ${num2} = ?`,
    token,
  };
}

/**
 * Verifies the user's answer against the signed token.
 */
export function verifyCaptcha(token: string, userAnswer: string | number): boolean {
  if (!token || userAnswer === undefined || userAnswer === null || userAnswer === '') {
    return false;
  }

  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const [expectedAnswerStr, expiresAtStr, receivedHmac] = decoded.split(':');

    if (!expectedAnswerStr || !expiresAtStr || !receivedHmac) {
      return false;
    }

    const expiresAt = parseInt(expiresAtStr, 10);
    if (Date.now() > expiresAt) {
      return false; // Expired
    }

    const rawPayload = `${expectedAnswerStr}:${expiresAtStr}`;
    const expectedHmac = crypto.createHmac('sha256', SECRET_SALT).update(rawPayload).digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(receivedHmac), Buffer.from(expectedHmac))) {
      const isCorrect = parseInt(userAnswer.toString().trim(), 10) === parseInt(expectedAnswerStr, 10);
      if (!isCorrect) {
        return false;
      }

      // Check anti-replay: ensure single-use token
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      if (isCaptchaUsed(tokenHash)) {
        return false;
      }

      // Mark token as consumed
      markCaptchaUsed(tokenHash, expiresAt);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
