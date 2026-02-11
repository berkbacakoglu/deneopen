import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://127.0.0.1:3001';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/todos`, { cache: 'no-store' });
    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ ok: true, data: [] }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${API_BASE_URL}/api/todos`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });

    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ ok: false, error: 'api_unreachable' }, { status: 503 });
  }
}
