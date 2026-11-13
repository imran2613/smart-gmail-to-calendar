import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google';

export async function GET(request: Request) {
  const url = getAuthUrl(request);
  return NextResponse.redirect(url);
}
