import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'ไม่พบไฟล์ที่ต้องการอัปโหลด' }, { status: 400 });
    }

    const mime = file.type;
    let mediaType: 'image' | 'video' | null = null;
    let extension = '';

    if (mime.startsWith('image/')) {
      mediaType = 'image';
      if (mime === 'image/jpeg') extension = '.jpg';
      else if (mime === 'image/png') extension = '.png';
      else if (mime === 'image/webp') extension = '.webp';
      else if (mime === 'image/gif') extension = '.gif';
      else extension = path.extname(file.name) || '.jpg';
    } else if (mime.startsWith('video/')) {
      mediaType = 'video';
      if (mime === 'video/mp4') extension = '.mp4';
      else if (mime === 'video/webm') extension = '.webm';
      else if (mime === 'video/quicktime') extension = '.mov';
      else extension = path.extname(file.name) || '.mp4';
    } else {
      return NextResponse.json(
        { error: 'รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP, GIF) หรือวิดีโอ (MP4, WEBM) เท่านั้น' },
        { status: 400 }
      );
    }

    // Size limit: 15MB for images, 80MB for videos
    const maxBytes = mediaType === 'video' ? 80 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `ขนาดไฟล์ใหญ่เกินกำหนด (สูงสุด ${mediaType === 'video' ? '80MB' : '15MB'})` },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch {
      // directory already exists
    }

    const filename = `${crypto.randomUUID()}${extension}`;
    const destinationPath = path.join(uploadsDir, filename);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(destinationPath, buffer);

    const url = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url,
      media_type: mediaType,
      filename,
    });
  } catch (err: any) {
    console.error('Error uploading file:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์' }, { status: 500 });
  }
}
