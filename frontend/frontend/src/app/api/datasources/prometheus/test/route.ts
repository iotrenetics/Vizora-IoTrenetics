// ── FILE: src/app/api/datasources/prometheus/test/route.ts ──

import { NextRequest, NextResponse } from 'next/server';
 
export async function POST(req: NextRequest) {
  try {
    const { url, bearerToken, basicAuthUser, basicAuthPassword, tlsSkipVerify } = await req.json();
    if (!url) return NextResponse.json({ ok: false, message: 'URL is required' });
 
    const headers: Record<string, string> = {};
    if (bearerToken) headers['Authorization'] = `Bearer ${bearerToken}`;
    else if (basicAuthUser) headers['Authorization'] = 'Basic ' + Buffer.from(`${basicAuthUser}:${basicAuthPassword}`).toString('base64');
 
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 10000);
 
    const res = await fetch(`${url}/api/v1/query?query=1`, { headers, signal: controller.signal });
    const json = await res.json().catch(() => ({}));
    if (json.status === 'success') {
      return NextResponse.json({ ok: true, message: `Connected to Prometheus at ${url}` });
    }
    return NextResponse.json({ ok: false, message: json.error || `Status ${res.status}` });
  } catch (err: any) {
    if (err.name === 'AbortError') return NextResponse.json({ ok: false, message: 'Timed out' });
    return NextResponse.json({ ok: false, message: err.message });
  }
}
