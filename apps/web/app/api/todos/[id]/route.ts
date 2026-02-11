import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://127.0.0.1:3001';
const API_WRITE_TOKEN = process.env.API_WRITE_TOKEN;

function buildHeaders() {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (API_WRITE_TOKEN) headers['x-api-key'] = API_WRITE_TOKEN;
  return headers;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/todos/${id}`, {
      method: 'PATCH',
      headers: buildHeaders(),
      body: JSON.stringify(body)
    });

    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'api_unreachable', message: 'Todo API is not reachable.' },
      { status: 503 }
    );
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const response = await fetch(`${API_BASE_URL}/api/todos/${id}`, {
      method: 'DELETE',
      headers: API_WRITE_TOKEN ? { 'x-api-key': API_WRITE_TOKEN } : undefined
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'api_unreachable', message: 'Todo API is not reachable.' },
      { status: 503 }
    );
  }
}
