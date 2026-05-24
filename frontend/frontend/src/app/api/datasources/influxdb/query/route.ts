// src/app/api/datasources/influxdb/query/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      url, token, org, bucket,
      query, version, queryLanguage,
      username, password, database,
    } = body;

    if (!url || !query) {
      return NextResponse.json({ ok: false, message: 'url and query are required' }, { status: 400 });
    }

    const cleanUrl = url.replace(/\/$/, '');

    // ── Detect query language from content if not set ──────────────────────
    // Flux queries always start with "from(" or a variable/import
    const looksLikeFlux = /^\s*(from\s*\(|import\s+|option\s+|v\s*=)/.test(query);
    const resolvedLang = queryLanguage ?? (looksLikeFlux ? 'flux' : 'influxql');

    // ── InfluxDB 2.x / Cloud — Flux ───────────────────────────────────────
    if ((version === '2.x' || version === 'cloud') && resolvedLang === 'flux') {
      if (!token) return NextResponse.json({ ok: false, message: 'Token is required for InfluxDB 2.x Flux queries' }, { status: 400 });

      const res = await fetch(`${cleanUrl}/api/v2/query?org=${encodeURIComponent(org ?? '')}`, {
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
        // Parse InfluxDB error JSON if possible
        try {
          const parsed = JSON.parse(err);
          return NextResponse.json({ ok: false, message: parsed.message ?? err }, { status: res.status });
        } catch {
          return NextResponse.json({ ok: false, message: err }, { status: res.status });
        }
      }

      const csv = await res.text();
      return NextResponse.json({ ok: true, format: 'csv', data: csv });
    }

    // ── InfluxDB 2.x / Cloud — InfluxQL via compatibility API ────────────
    if ((version === '2.x' || version === 'cloud') && resolvedLang === 'influxql') {
      if (!token) return NextResponse.json({ ok: false, message: 'Token is required' }, { status: 400 });

      // InfluxDB 2.x InfluxQL compatibility endpoint
      const params = new URLSearchParams({ q: query, db: bucket ?? database ?? '' });
      const res = await fetch(`${cleanUrl}/query?${params}`, {
        headers: {
          Authorization: `Token ${token}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const err = await res.text();
        try {
          const parsed = JSON.parse(err);
          return NextResponse.json({ ok: false, message: parsed.error ?? parsed.message ?? err }, { status: res.status });
        } catch {
          return NextResponse.json({ ok: false, message: err }, { status: res.status });
        }
      }

      const json = await res.json();
      // Surface InfluxQL-level errors (they come back as 200 with error field)
      const innerErr = json?.results?.[0]?.error;
      if (innerErr) return NextResponse.json({ ok: false, message: innerErr });

      return NextResponse.json({ ok: true, format: 'influxql', data: json });
    }

    // ── InfluxDB 1.x — InfluxQL ───────────────────────────────────────────
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
        return NextResponse.json({ ok: false, message: err }, { status: res.status });
      }

      const json = await res.json();
      const innerErr = json?.results?.[0]?.error;
      if (innerErr) return NextResponse.json({ ok: false, message: innerErr });

      return NextResponse.json({ ok: true, format: 'influxql', data: json });
    }

    return NextResponse.json({ ok: false, message: `Unsupported version "${version}" with language "${resolvedLang}"` }, { status: 400 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, message: `Proxy error: ${message}` }, { status: 500 });
  }
}