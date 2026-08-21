import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    db_start: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) : 'undefined',
    len: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
    keys: Object.keys(process.env).filter(k => k.includes('DB') || k.includes('BASE') || k.includes('POSTGRES')),
  });
}
