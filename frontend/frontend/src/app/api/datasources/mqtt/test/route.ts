// ── FILE: src/app/api/datasources/mqtt/test/route.ts ──

import { NextRequest, NextResponse } from 'next/server';

// MQTT test via HTTP — in production use a server-side MQTT client
// For Next.js: install mqtt package: npm install mqtt
// This route tries to connect and immediately disconnect

export async function POST(req: NextRequest) {
  try {
    const { host, port, username, password, useTLS, clientId, keepAlive } = await req.json();
    if (!host) return NextResponse.json({ ok: false, message: 'Host is required' });

    // Dynamically import mqtt (server-side only)
    const mqtt = await import('mqtt');
    const protocol = useTLS ? 'mqtts' : 'mqtt';
    const cleanHost = host.replace(/^mqtt[s]?:\/\//, '');
    const brokerUrl = `${protocol}://${cleanHost}:${port || (useTLS ? '8883' : '1883')}`;

    return new Promise<NextResponse>((resolve) => {
      const timer = setTimeout(() => {
        client?.end(true);
        resolve(NextResponse.json({ ok: false, message: 'Connection timed out (10s)' }));
      }, 10000);

      const client = mqtt.connect(brokerUrl, {
        clientId: clientId || `vizora-test-${Date.now()}`,
        username: username || undefined,
        password: password || undefined,
        keepalive: parseInt(keepAlive || '60'),
        connectTimeout: 8000,
        rejectUnauthorized: !useTLS, // allow self-signed for TLS test
      });

      client.on('connect', () => {
        clearTimeout(timer);
        client.end(true);
        resolve(NextResponse.json({ ok: true, message: `Connected to MQTT broker at ${brokerUrl}` }));
      });

      client.on('error', (err) => {
        clearTimeout(timer);
        client.end(true);
        resolve(NextResponse.json({ ok: false, message: err.message }));
      });
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message });
  }
}
