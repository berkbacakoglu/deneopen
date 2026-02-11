import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://127.0.0.1:3001';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });

    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ ok: false, error: 'api_unreachable' }, { status: 503 });
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const response = await fetch(`${API_BASE_URL}/api/todos/${id}`, {
      method: 'DELETE'
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ ok: false, error: 'api_unreachable' }, { status: 503 });
  }
}
