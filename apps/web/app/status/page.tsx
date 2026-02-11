'use client';

import { useEffect, useState } from 'react';

type ReadyPayload = { ok?: boolean; db?: string; requestId?: string };

export default function StatusPage() {
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<ReadyPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const response = await fetch('/api/todos', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('API unreachable from web app');
        }
        setPayload({ ok: true, db: 'unknown' });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return (
    <main className="status-page">
      <section className="card">
        <h1>Status</h1>
        {loading && <p className="status checking">Checking…</p>}
        {!loading && error && <p className="status unreachable">{error}</p>}
        {!loading && !error && <p className="status reachable">Web app can reach API routes.</p>}
        {!loading && payload && <pre className="status-pre">{JSON.stringify(payload, null, 2)}</pre>}
        <p><a href="/">← Back to todos</a></p>
      </section>
    </main>
  );
}
