import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { createTodo, deleteTodo, getApiBaseUrl, listTodos, Todo, toggleTodo } from './src/todoApi';

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({});

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setTodos(await listTodos());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function onCreate() {
    const trimmed = title.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setError(null);

    try {
      const created = await createTodo(trimmed);
      setTodos((prev) => [created, ...prev]);
      setTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  async function onToggle(todo: Todo) {
    if (pendingIds[todo.id]) return;
    setPendingIds((prev) => ({ ...prev, [todo.id]: true }));
    const previous = [...todos];
    setTodos((prev) => prev.map((item) => (item.id === todo.id ? { ...item, completed: !item.completed } : item)));

    try {
      const updated = await toggleTodo(todo);
      setTodos((prev) => prev.map((item) => (item.id === todo.id ? updated : item)));
    } catch (err) {
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
    setPendingIds((prev) => ({ ...prev, [id]: true }));
    const previous = [...todos];
    setTodos((prev) => prev.filter((todo) => todo.id !== id));

    try {
      await deleteTodo(id);
    } catch (err) {
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Mobile Todos</Text>
      <Text style={styles.meta}>API: {getApiBaseUrl()}</Text>

      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Write a todo"
          returnKeyType="done"
          onSubmitEditing={onCreate}
        />
        <Pressable style={styles.button} onPress={onCreate} disabled={saving || !title.trim()}>
          <Text style={styles.buttonText}>{saving ? 'Adding…' : 'Add'}</Text>
        </Pressable>
      </View>

      {loading && <Text>Loading…</Text>}
      {error && <Text style={styles.error}>{error}</Text>}

      {!loading && !error && todos.length === 0 && <Text style={styles.meta}>No todos yet.</Text>}

      {todos.map((todo) => {
        const pending = !!pendingIds[todo.id];
        return (
          <View style={styles.todoItem} key={todo.id}>
            <View style={styles.todoMain}>
              <Switch
                accessibilityLabel={`toggle ${todo.title}`}
                disabled={pending}
                value={todo.completed}
                onValueChange={() => onToggle(todo)}
              />
              <Text style={todo.completed ? styles.todoDone : styles.todoText}>{todo.title}</Text>
            </View>

            <Pressable
              accessibilityLabel={`delete ${todo.title}`}
              style={[styles.button, pending && styles.buttonDisabled]}
              onPress={() => onDelete(todo.id)}
              disabled={pending}
            >
              <Text style={styles.buttonText}>{pending ? '...' : 'Delete'}</Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#f4f4f5' },
  container: { padding: 18, gap: 10 },
  title: { fontSize: 28, fontWeight: '700', marginTop: 24 },
  meta: { color: '#52525b' },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    borderColor: '#d4d4d8',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white'
  },
  button: {
    backgroundColor: '#18181b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fafafa', fontWeight: '600' },
  error: { color: '#b91c1c', fontWeight: '600' },
  todoItem: {
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 10,
    backgroundColor: '#fff',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  todoMain: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: 8 },
  todoText: { fontSize: 16, color: '#18181b' },
  todoDone: { fontSize: 16, color: '#71717a', textDecorationLine: 'line-through' }
});
