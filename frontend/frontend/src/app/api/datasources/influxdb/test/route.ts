// src/app/api/datasources/influxdb/test/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, token, org, version, queryLanguage } = body;

    if (!url) return NextResponse.json({ ok: false, message: 'URL is required' }, { status: 400 });

    const cleanUrl = url.replace(/\/$/, '');

    // InfluxDB 2.x / Cloud — hit /health and /api/v2/orgs to verify token
    if (version === '2.x' || version === 'cloud') {
      // 1. Health check (no auth needed)
      const health = await fetch(`${cleanUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      }).catch(() => null);

      if (!health || !health.ok) {
        return NextResponse.json({ ok: false, message: `Cannot reach InfluxDB at ${cleanUrl}. Check URL and ensure the instance is running.` });
      }

      // 2. Verify token by listing orgs
      if (token && org) {
        const verify = await fetch(`${cleanUrl}/api/v2/orgs?org=${encodeURIComponent(org)}`, {
          headers: { Authorization: `Token ${token}` },
          signal: AbortSignal.timeout(5000),
        }).catch(() => null);

        if (!verify) return NextResponse.json({ ok: false, message: 'Token verification request failed.' });
        if (verify.status === 401) return NextResponse.json({ ok: false, message: 'Invalid token — authentication failed.' });
        if (verify.status === 403) return NextResponse.json({ ok: false, message: 'Token does not have permission to access this org.' });
        if (!verify.ok) return NextResponse.json({ ok: false, message: `InfluxDB returned ${verify.status} during auth check.` });
      }

      return NextResponse.json({ ok: true, message: 'Data source connected and labels found.' });
    }

    // InfluxDB 1.x — hit /ping
    if (version === '1.x') {
      const ping = await fetch(`${cleanUrl}/ping`, {
        signal: AbortSignal.timeout(5000),
      }).catch(() => null);

      if (!ping) return NextResponse.json({ ok: false, message: `Cannot reach InfluxDB 1.x at ${cleanUrl}.` });

      // /ping always returns 204 if alive
      if (ping.status !== 204 && !ping.ok) {
        return NextResponse.json({ ok: false, message: `InfluxDB returned unexpected status ${ping.status}.` });
      }

      return NextResponse.json({ ok: true, message: 'InfluxDB 1.x connected successfully.' });
    }

    return NextResponse.json({ ok: false, message: 'Unknown version. Select 1.x, 2.x, or Cloud.' }, { status: 400 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, message: `Server error: ${message}` }, { status: 500 });
  }
}