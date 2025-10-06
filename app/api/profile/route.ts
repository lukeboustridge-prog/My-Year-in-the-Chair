// app/api/profile/route.ts
import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const uid = await getUserId(req);
    // Minimal profile used around the app; safe defaults for prerender
    const profile = {
      userId: uid || null,
      name: '',
      lodgeName: '',
      lodgeNumber: '',
      ranks: [],
    };
    return NextResponse.json(profile, { status: 200 });
  } catch (e: any) {
    // Never throw during prerender — return a benign object
    return NextResponse.json({ userId: null, name: '', ranks: [] }, { status: 200 });
  }
}
