'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

type ApiStatus = 'checking' | 'reachable' | 'unreachable';

export default function HomePage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');

  const hasTodos = useMemo(() => todos.length > 0, [todos]);
  const completedCount = useMemo(() => todos.filter((todo) => todo.completed).length, [todos]);

  async function loadTodos() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/todos', { cache: 'no-store' });
      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        setApiStatus('unreachable');
        throw new Error(payload?.message ?? 'Todos could not be loaded');
      }

      setApiStatus('reachable');
      setTodos(payload.data ?? []);
    } catch (err) {
      setApiStatus('unreachable');
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTodos();
  }, []);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || creating) return;

    setCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: trimmed })
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message ?? 'Todo could not be created');
      }

      setApiStatus('reachable');
      setTitle('');
      setTodos((prev) => [payload.data, ...prev]);
    } catch (err) {
      setApiStatus('unreachable');
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCreating(false);
    }
  }

  async function onToggle(todo: Todo) {
    if (pendingIds[todo.id]) return;

    const optimistic = { ...todo, completed: !todo.completed };
    const previous = [...todos];

    setPendingIds((prev) => ({ ...prev, [todo.id]: true }));
    setTodos((prev) => prev.map((item) => (item.id === todo.id ? optimistic : item)));

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ completed: optimistic.completed })
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message ?? 'Todo could not be updated');
      }

      setApiStatus('reachable');
      setTodos((prev) => prev.map((item) => (item.id === todo.id ? payload.data : item)));
    } catch (err) {
      setApiStatus('unreachable');
      setTodos(previous);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setPendingIds((prev) => {
        const next = { ...prev };
        delete next[todo.id];
        return next;
      });
    }
  }

  async function onDelete(id: string) {
    if (pendingIds[id]) return;

    const previous = [...todos];
    setPendingIds((prev) => ({ ...prev, [id]: true }));
    setTodos((prev) => prev.filter((item) => item.id !== id));

    try {
      const response = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      if (response.status !== 204) {
        const payload = await response.json();
        throw new Error(payload?.message ?? 'Todo could not be deleted');
      }
      setApiStatus('reachable');
    } catch (err) {
      setApiStatus('unreachable');
      setTodos(previous);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setPendingIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  return (
    <main className="page-shell">
      <section className="card header-card" aria-label="platform header">
        <div className="header-title-row">
          <div>
            <h1>RN + Web Platform</h1>
            <p>Modern, fast and synced todos across API, web and mobile.</p>
          </div>
          <div className="status-pill">{completedCount}/{todos.length} completed</div>
        </div>
        <a href="/status">Go to status</a>
      </section>

      <section className="card" aria-live="polite" aria-label="api status panel">
        <h2>API status</h2>
        {apiStatus === 'checking' && <p className="status checking">Checking backend reachability…</p>}
        {apiStatus === 'reachable' && <p className="status reachable">API reachable</p>}
        {apiStatus === 'unreachable' && <p className="status unreachable">API unreachable</p>}
      </section>

      <section className="card" aria-label="todo section">
        <h2>Todos</h2>

        <form onSubmit={onCreate} className="todo-form">
          <label htmlFor="todo-title" className="sr-only">Todo title</label>
          <input
            id="todo-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Write a todo"
            disabled={creating}
            autoComplete="off"
          />
          <button type="submit" disabled={creating || !title.trim()}>
            {creating ? 'Adding…' : 'Add'}
          </button>
        </form>

        {loading && <p>Loading todos…</p>}
        {error && <p className="status unreachable">{error}</p>}
        {!loading && !error && !hasTodos && <p className="empty">No todos yet. Add one above.</p>}

        <ul className="todo-list" aria-live="polite">
          {todos.map((todo) => {
            const pending = !!pendingIds[todo.id];
            return (
              <li key={todo.id} className="todo-item">
                <label>
                  <input
                    aria-label={`toggle ${todo.title}`}
                    type="checkbox"
                    checked={todo.completed}
                    disabled={pending}
                    onChange={() => onToggle(todo)}
                  />
                  <span className={todo.completed ? 'done' : ''}>{todo.title}</span>
                </label>
                <button
                  aria-label={`delete ${todo.title}`}
                  disabled={pending}
                  onClick={() => onDelete(todo.id)}
                >
                  {pending ? 'Working…' : 'Delete'}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
