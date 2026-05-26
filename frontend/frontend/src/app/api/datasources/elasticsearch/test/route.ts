// ── FILE: src/app/api/datasources/elasticsearch/test/route.ts ──

import { NextRequest, NextResponse } from 'next/server';
 
export async function POST(req: NextRequest) {
  try {
    const { url, username, password, apiKey } = await req.json();
    if (!url) return NextResponse.json({ ok: false, message: 'URL is required' });
 
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `ApiKey ${apiKey}`;
    else if (username) headers['Authorization'] = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
 
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${url}/_cluster/health`, { headers, signal: controller.signal });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      return NextResponse.json({ ok: true, message: `Cluster: ${json.cluster_name} · status: ${json.status}` });
    }
    return NextResponse.json({ ok: false, message: json.error?.reason || `Status ${res.status}` });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message });
  }
}
