'use client';

import { FormEvent, useEffect, useState } from 'react';

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

export default function HomePage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadTodos() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/todos', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error('Todos could not be loaded');
      setTodos(payload.data ?? []);
    } catch (err) {
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
    if (!title.trim()) return;

    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: title.trim() })
    });

    if (response.ok) {
      setTitle('');
      await loadTodos();
    }
  }

  async function onToggle(todo: Todo) {
    await fetch(`/api/todos/${todo.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ completed: !todo.completed })
    });

    await loadTodos();
  }

  async function onDelete(id: string) {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    await loadTodos();
  }

  return (
    <main style={{ maxWidth: 720, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>RN + Web Platform</h1>
      <p>Production-grade starter ready.</p>
      <a href="/status">Go to status</a>

      <hr style={{ margin: '1.5rem 0' }} />

      <h2>Todos</h2>

      <form onSubmit={onCreate} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Write a todo"
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit">Add</button>
      </form>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
        {todos.map((todo) => (
          <li key={todo.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => onToggle(todo)}
              />
              <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>{todo.title}</span>
            </label>
            <button onClick={() => onDelete(todo.id)} style={{ marginTop: 8 }}>Delete</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
