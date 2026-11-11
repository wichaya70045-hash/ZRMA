import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { applyToJobThread, toggleJobStatus } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { broadcastToRoom } from '@/lib/sse';
import type { JobApplication, JobStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await params;
    const body = await req.json();
    const sessionUser = await getSessionUser(req);

    // Author toggles job status (open / closed)
    if (body.action === 'toggle_status') {
      const nextStatus: JobStatus = body.status === 'closed' ? 'closed' : 'open';
      const result = toggleJobStatus(
        threadId,
        nextStatus,
        body.edit_token ? String(body.edit_token).trim() : null,
        sessionUser?.id || null
      );
      if (!result.success || !result.job) {
        return NextResponse.json(
          { error: result.error || 'ไม่สามารถเปลี่ยนสถานะประกาศงานได้' },
          { status: 403 }
        );
      }
      broadcastToRoom(`thread_${threadId}`, 'job_updated', result.job);
      return NextResponse.json({ success: true, job: result.job });
    }

    // Apply / Accept / Pitch on a job listing
    const pitch = String(body.pitch || '').trim();
    if (!pitch || pitch.length < 2) {
      return NextResponse.json(
        { error: 'กรุณากรอกรายละเอียดข้อเสนอ หรือข้อความรับงานอย่างน้อย 2 ตัวอักษร' },
        { status: 400 }
      );
    }

    const useAccountIdentity = Boolean(sessionUser && body.post_anonymously !== true);
    const application: JobApplication = {
      id: `jobapp-${crypto.randomUUID().slice(0, 10)}`,
      applicant_alias: useAccountIdentity
        ? sessionUser!.display_name
        : String(body.author_alias || 'ผู้รับงานนิรนาม #????').trim().slice(0, 40),
      applicant_avatar: useAccountIdentity
        ? sessionUser!.avatar_icon
        : String(body.author_avatar || 'shield'),
      applicant_user_id: useAccountIdentity ? sessionUser!.id : null,
      applicant_username: useAccountIdentity ? sessionUser!.username : null,
      pitch: pitch.slice(0, 600),
      contact: body.contact ? String(body.contact).trim().slice(0, 160) : null,
      proposed_budget: body.proposed_budget ? String(body.proposed_budget).trim().slice(0, 80) : null,
      created_at: new Date().toISOString(),
    };

    const result = applyToJobThread(threadId, application);
    if (!result.success || !result.job) {
      return NextResponse.json(
        { error: result.error || 'ไม่สามารถส่งคำขอรับงานได้' },
        { status: 400 }
      );
    }

    broadcastToRoom(`thread_${threadId}`, 'job_updated', result.job);
    return NextResponse.json({ success: true, job: result.job, application }, { status: 201 });
  } catch (err) {
    console.error('POST /api/threads/[id]/job error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบประกาศงาน' }, { status: 500 });
  }
}
