import { useState, useEffect, useCallback, type FormEvent } from 'react';

interface Entry {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  terms_accepted: boolean;
  created_at: string;
  hub_entry_id: string | null;
  source_data: Record<string, unknown> | null;
}

type AuthState = 'checking' | 'unauthenticated' | 'authenticated';

export default function AdminDashboard(): JSX.Element {
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [dialogPassword, setDialogPassword] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [dialogSubmitting, setDialogSubmitting] = useState(false);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    const res = await fetch('/api/admin/me', { credentials: 'include' });
    const data = (await res.json()) as { authenticated?: boolean };
    return data.authenticated === true;
  }, []);

  const loadEntries = useCallback(async (): Promise<void> => {
    setEntriesLoading(true);
    try {
      const res = await fetch('/api/admin/entries', { credentials: 'include' });
      if (!res.ok) {
        setAuthState('unauthenticated');
        return;
      }
      const data = (await res.json()) as { entries?: Entry[] };
      setEntries(data.entries ?? []);
      setAuthState('authenticated');
    } catch {
      setAuthState('unauthenticated');
    } finally {
      setEntriesLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await checkAuth();
      if (cancelled) return;
      if (ok) {
        await loadEntries();
      } else {
        setAuthState('unauthenticated');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [checkAuth, loadEntries]);

  async function handleLoginSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setDialogError('');
    setDialogSubmitting(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: dialogPassword }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setDialogError(data.error ?? 'Login failed');
        setDialogSubmitting(false);
        return;
      }
      setDialogPassword('');
      setDialogError('');
      setDialogSubmitting(false);
      setAuthState('authenticated');
      await loadEntries();
    } catch {
      setDialogError('Network error');
      setDialogSubmitting(false);
    }
  }

  if (authState === 'checking' || (authState === 'authenticated' && entriesLoading && entries.length === 0)) {
    return <p className="admin-loading">Loading…</p>;
  }

  return (
    <>
      {authState === 'unauthenticated' && (
        <div className="dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title">
          <div className="dialog-box">
            <h2 id="admin-dialog-title">Admin login</h2>
            <p>Enter the admin password to continue.</p>
            <form onSubmit={handleLoginSubmit}>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Password"
                value={dialogPassword}
                onChange={(e) => setDialogPassword(e.target.value)}
                disabled={dialogSubmitting}
                autoFocus
              />
              {dialogError && <p className="dialog-error">{dialogError}</p>}
              <div className="dialog-actions">
                <button type="button" className="secondary" onClick={() => (window.location.href = '/')}>
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={dialogSubmitting}>
                  {dialogSubmitting ? 'Signing in…' : 'Sign in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {authState === 'authenticated' && (
        <>
          <a href="/" className="admin-back">
            ← Back to site
          </a>
          <h1>Entries</h1>
          <p style={{ marginBottom: '1rem' }}>
            <a href="/api/admin/export-csv" className="admin-back" download="entries.csv">
              Export CSV
            </a>
          </p>
          <div className="entries-table-wrap">
            <table className="entries-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Date</th>
                  <th>Hub</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No entries yet.</td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        {entry.first_name} {entry.last_name}
                      </td>
                      <td>{entry.email}</td>
                      <td>{new Date(entry.created_at).toLocaleString()}</td>
                      <td>{entry.hub_entry_id ? '✓' : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
