// src/app/api/datasources/influxdb/query/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, token, org, bucket, query, version, queryLanguage, username, password, database } = body;

    if (!url || !query) {
      return NextResponse.json({ ok: false, message: 'url and query are required' }, { status: 400 });
    }

    const cleanUrl = url.replace(/\/$/, '');

    // ── InfluxDB 2.x / Cloud — Flux query ──────────────────────────────────
    if ((version === '2.x' || version === 'cloud') && queryLanguage === 'flux') {
      const res = await fetch(`${cleanUrl}/api/v2/query?org=${encodeURIComponent(org)}`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/vnd.flux',
          Accept: 'application/csv',
        },
        body: query,
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ ok: false, message: `InfluxDB error: ${err}` }, { status: res.status });
      }

      const csv = await res.text();
      return NextResponse.json({ ok: true, format: 'csv', data: csv });
    }

    // ── InfluxDB 2.x — InfluxQL via compatibility API ──────────────────────
    if ((version === '2.x' || version === 'cloud') && queryLanguage === 'influxql') {
      const params = new URLSearchParams({ q: query, db: bucket });
      const res = await fetch(`${cleanUrl}/query?${params}`, {
        headers: {
          Authorization: `Token ${token}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ ok: false, message: `InfluxDB error: ${err}` }, { status: res.status });
      }

      const json = await res.json();
      return NextResponse.json({ ok: true, format: 'influxql', data: json });
    }

    // ── InfluxDB 1.x — InfluxQL ────────────────────────────────────────────
    if (version === '1.x') {
      const params = new URLSearchParams({ q: query, db: database ?? '' });
      const headers: Record<string, string> = { Accept: 'application/json' };

      if (username && password) {
        headers['Authorization'] = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
      }

      const res = await fetch(`${cleanUrl}/query?${params}`, {
        headers,
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ ok: false, message: `InfluxDB 1.x error: ${err}` }, { status: res.status });
      }

      const json = await res.json();
      return NextResponse.json({ ok: true, format: 'influxql', data: json });
    }

    return NextResponse.json({ ok: false, message: 'Unsupported version/queryLanguage combination.' }, { status: 400 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, message: `Proxy error: ${message}` }, { status: 500 });
  }
}