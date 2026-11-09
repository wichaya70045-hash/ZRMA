import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getCommentsByThread, createComment, getThreadById } from '@/lib/db';
import { verifyCaptcha } from '@/lib/captcha';
import { broadcastToRoom } from '@/lib/sse';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const comments = getCommentsByThread(id);
    return NextResponse.json({ comments });
  } catch (err: any) {
    console.error('Error fetching comments:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await params;
    const thread = getThreadById(threadId);
    if (!thread) {
      return NextResponse.json(
        { error: 'ไม่พบกระทู้เป้าหมาย หรือกระทู้หมดอายุแล้ว' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      content,
      parent_id,
      quote_text,
      quote_author,
      author_alias,
      author_avatar,
      captcha_token,
      captcha_answer,
    } = body;

    // Verify Captcha
    if (!verifyCaptcha(captcha_token, captcha_answer)) {
      return NextResponse.json(
        { error: 'คำตอบความปลอดภัยไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' },
        { status: 400 }
      );
    }

    if (!content || !content.trim() || content.trim().length < 2) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อความตอบกลับอย่างน้อย 2 ตัวอักษร' },
        { status: 400 }
      );
    }

    const commentId = crypto.randomUUID();
    const comment = createComment({
      id: commentId,
      thread_id: threadId,
      parent_id: parent_id || null,
      quote_text: quote_text || null,
      quote_author: quote_author || null,
      content: content.trim(),
      author_alias: author_alias || 'ผู้ไม่ประสงค์ออกนาม #????',
      author_avatar: author_avatar || '🥷',
    });

    // Broadcast new comment to anyone viewing this thread
    broadcastToRoom(`thread_${threadId}`, 'new_comment', comment);

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err: any) {
    console.error('Error adding comment:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
