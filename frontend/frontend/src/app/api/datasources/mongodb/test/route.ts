// ── FILE: src/app/api/datasources/mongodb/test/route.ts ──

import { NextRequest, NextResponse } from 'next/server';
// npm install mongodb
 
export async function POST(req: NextRequest) {
  try {
    const { connectionString, database, username, password, authSource, tlsEnabled } = await req.json();
    if (!connectionString) return NextResponse.json({ ok: false, message: 'Connection string is required' });
 
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(connectionString, {
      serverSelectionTimeoutMS: 8000,
      tls: tlsEnabled,
      auth: username ? { username, password } : undefined,
      authSource: authSource || 'admin',
    });
 
    await client.connect();
    const admin = client.db('admin');
    const result = await admin.command({ serverStatus: 1 });
    await client.close();
    return NextResponse.json({ ok: true, message: `MongoDB ${result.version} · ${result.host}` });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message });
  }
}
