// ── FILE: src/app/api/datasources/redis/test/route.ts ──

import { NextRequest, NextResponse } from 'next/server';
// npm install ioredis
 
export async function POST(req: NextRequest) {
  try {
    const { host, port, password, database, useTLS } = await req.json();
    if (!host) return NextResponse.json({ ok: false, message: 'Host is required' });
 
    const { default: Redis } = await import('ioredis');
    const redis = new Redis({
      host, port: parseInt(port || '6379'),
      password: password || undefined,
      db: parseInt(database || '0'),
      tls: useTLS ? {} : undefined,
      connectTimeout: 8000,
      lazyConnect: true,
    });
 
    await redis.connect();
    const pong = await redis.ping();
    const info = await redis.info('server');
    const versionMatch = info.match(/redis_version:([^\r\n]+)/);
    await redis.quit();
    return NextResponse.json({ ok: pong === 'PONG', message: `Redis ${versionMatch?.[1] ?? ''} · PONG received` });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message });
  }
}