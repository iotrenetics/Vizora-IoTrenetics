// ── FILE: src/app/api/datasources/mysql/test/route.ts ──
import { NextRequest, NextResponse } from 'next/server';
// npm install mysql2
 
export async function POST(req: NextRequest) {
  try {
    const { host, port, database, username, password, useTLS } = await req.json();
    if (!host || !database) return NextResponse.json({ ok: false, message: 'Host and database are required' });
 
    const mysql = await import('mysql2/promise');
    const connection = await mysql.createConnection({
      host, port: parseInt(port || '3306'),
      database, user: username, password,
      ssl: useTLS ? {} : undefined,
      connectTimeout: 10000,
    });
    const [rows]: any = await connection.execute('SELECT VERSION() as v');
    await connection.end();
    return NextResponse.json({ ok: true, message: `Connected · MySQL ${rows[0]?.v ?? ''}` });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message });
  }
}