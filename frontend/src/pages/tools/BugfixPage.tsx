import React, { useState } from 'react';
import { api } from '../../api/client';
import { BugFixResponse, Language } from '../../types';
import AppLayout from '../../components/AppLayout';
import CopyButton from '../../components/CopyButton';

const languages: Language[] = ['python', 'javascript', 'typescript', 'cpp', 'java', 'go', 'rust', 'auto'];

export default function BugfixPage() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<Language>('python');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BugFixResponse | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.post<BugFixResponse>('/api/v1/bugfix', { code, language });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-content">
        <div className="page-header">
          <h1>🐛 Bugfix</h1>
          <p>Paste your code and let the AI detect and fix bugs for you.</p>
        </div>

        <form onSubmit={submit} className="tool-form">
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label className="field">
              Code
              <textarea id="bugfix-code" rows={12} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste the code you want to debug…" required />
            </label>
            <label className="field" style={{ maxWidth: 220 }}>
              Language
              <select id="bugfix-lang" value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
                {languages.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </label>
          </div>

          {error && <div className="alert alert-danger"><span>⚠️</span><span>{error}</span></div>}

          <button id="bugfix-submit" className="btn btn-primary" disabled={loading} type="submit" style={{ alignSelf: 'flex-start', padding: '12px 28px' }}>
            {loading ? <><span className="spinner" /> Scanning…</> : '🐛 Find & Fix'}
          </button>
        </form>

        {result && (
          <div className="result-section">
            <div>
              <h2 style={{ marginBottom: 12 }}>
                Bugs found
                {result.bugs.length > 0 && (
                  <span style={{ marginLeft: 10, padding: '2px 10px', borderRadius: 99, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.875rem', color: '#f87171', fontWeight: 600 }}>
                    {result.bugs.length}
                  </span>
                )}
              </h2>
              {result.bugs.length === 0 ? (
                <div className="alert alert-success"><span>✅</span><span>No bugs found!</span></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {result.bugs.map((b, idx) => (
                    <div key={idx} className="bug-item">
                      <div className="bug-type">{b.type}{b.line ? ` · Line ${b.line}` : ''}</div>
                      <div className="bug-desc">{b.description}</div>
                      {b.fix && <div className="bug-fix">Fix: {b.fix}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="code-block-header">
                Fixed code
                <CopyButton text={result.fixed_code} />
              </div>
              <pre className="code-block">{result.fixed_code}</pre>
            </div>

            <div><span className="latency-badge"><span className="dot" />{Math.round(result.latency_ms)} ms</span></div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
