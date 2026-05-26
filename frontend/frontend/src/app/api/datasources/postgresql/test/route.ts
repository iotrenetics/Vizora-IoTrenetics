// ── FILE: src/app/api/datasources/postgresql/test/route.ts ──

import { NextRequest, NextResponse } from 'next/server';
// npm install pg @types/pg
 
export async function POST(req: NextRequest) {
  try {
    const { host, port, database, username, password, sslMode } = await req.json();
    if (!host || !database) return NextResponse.json({ ok: false, message: 'Host and database are required' });
 
    const { Client } = await import('pg');
    const client = new Client({
      host, port: parseInt(port || '5432'),
      database, user: username, password,
      ssl: sslMode === 'disable' ? false : { rejectUnauthorized: sslMode === 'verify-full' || sslMode === 'verify-ca' },
      connectionTimeoutMillis: 10000,
      query_timeout: 5000,
    });
 
    await client.connect();
    const result = await client.query('SELECT version()');
    await client.end();
    const version = result.rows[0]?.version?.split(' ').slice(0, 2).join(' ') ?? 'PostgreSQL';
    return NextResponse.json({ ok: true, message: `Connected · ${version}` });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message });
  }
}
