import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import AppLayout from '../components/AppLayout';

type HealthResponse = { status: string; version: string };

export default function HealthPage() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<HealthResponse>('/health');
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load health');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchHealth(); }, []);

  return (
    <AppLayout>
      <div className="page-content">
        <div className="page-header">
          <h1>API Health</h1>
          <p>Live status of your local DevAssist backend.</p>
        </div>

        <div className="card" style={{ padding: 24, maxWidth: 480 }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)' }}>
              <span className="spinner" style={{ borderTopColor: 'var(--primary)' }} />
              Checking backend…
            </div>
          )}
          {error && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="alert alert-danger">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Make sure the FastAPI backend is running on <code style={{ color: 'var(--primary-light)', fontFamily: 'var(--font-mono)', background: 'rgba(99,102,241,0.1)', padding: '1px 6px', borderRadius: 4 }}>http://localhost:8000</code>
              </div>
            </div>
          )}
          {data && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  className={`health-indicator ${data.status === 'ok' ? 'health-ok' : 'health-err'}`}
                >
                  <span className="health-pulse" />
                  {data.status === 'ok' ? 'Operational' : data.status}
                </span>
              </div>
              <div className="code-block-header">Response</div>
              <pre className="code-block" style={{ marginTop: -1 }}>
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
          <button
            id="health-refresh"
            className="btn btn-ghost"
            onClick={() => void fetchHealth()}
            style={{ marginTop: 16, fontSize: '0.875rem' }}
            disabled={loading}
          >
            {loading ? <><span className="spinner" /> Refreshing…</> : '↻ Refresh'}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
