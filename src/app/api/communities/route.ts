import { NextRequest, NextResponse } from 'next/server';
import { getCommunities, createOrUpdateCommunity } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const communities = getCommunities();
    return NextResponse.json({ communities });
  } catch (err: any) {
    console.error('Error fetching communities:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { name, title, description, icon } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อห้อง r/' }, { status: 400 });
    }

    // Clean name: remove leading r/ if entered, convert to lowercase alphanumeric/hyphen
    name = name.trim().toLowerCase().replace(/^r\//, '');
    if (!/^[a-z0-9_]{2,30}$/.test(name)) {
      return NextResponse.json(
        { error: 'ชื่อห้องต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข หรือขีดล่าง ความยาว 2-30 ตัวอักษร (เช่น tech, breaking, crypto)' },
        { status: 400 }
      );
    }

    if (!title || !title.trim()) {
      title = `r/${name}`;
    }

    const community = createOrUpdateCommunity({
      name,
      title: title.trim(),
      description: description ? description.trim() : `ชุมชนแลกเปลี่ยนข่าวสาร r/${name}`,
      icon: icon || 'terminal',
    });

    return NextResponse.json({ community }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating community:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
