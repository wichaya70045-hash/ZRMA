import { NextRequest, NextResponse } from 'next/server';
import { getThreadById, updateThread, deleteThread } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const thread = getThreadById(id);

    if (!thread) {
      return NextResponse.json(
        { error: 'ไม่พบกระทู้นี้ หรือกระทู้อาจหมดอายุและถูกลบไปแล้วตามนโยบายความเป็นส่วนตัว' },
        { status: 404 }
      );
    }

    return NextResponse.json({ thread });
  } catch (err: any) {
    console.error('Error fetching thread:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, content, category, flair, source_url, edit_token } = body;

    if (!title || !title.trim() || title.length > 200) {
      return NextResponse.json(
        { error: 'กรุณาระบุหัวข้อกระทู้ (ความยาวไม่เกิน 200 ตัวอักษร)' },
        { status: 400 }
      );
    }

    const cleanContent = typeof content === 'string' ? content.trim() : '';

    const result = updateThread(id, {
      title: title.trim(),
      content: cleanContent,
      category: category ? category.trim() : undefined,
      flair: flair !== undefined ? (flair?.trim() || null) : undefined,
      source_url: source_url !== undefined ? (source_url?.trim() || null) : undefined,
      edit_token: edit_token ? String(edit_token).trim() : null,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'ไม่สามารถแก้ไขกระทู้ได้' }, { status: 403 });
    }

    return NextResponse.json({ success: true, thread: result.thread });
  } catch (err: any) {
    console.error('Error updating thread:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let edit_token: string | null = null;

    try {
      const body = await req.json();
      edit_token = body.edit_token || null;
    } catch {
      const { searchParams } = new URL(req.url);
      edit_token = searchParams.get('token');
    }

    const result = deleteThread(id, edit_token ? String(edit_token).trim() : null);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'ไม่สามารถลบกระทู้ได้' }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: 'ลบกระทู้เรียบร้อยแล้ว' });
  } catch (err: any) {
    console.error('Error deleting thread:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
