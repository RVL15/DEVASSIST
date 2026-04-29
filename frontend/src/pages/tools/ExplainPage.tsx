import React, { useState } from 'react';
import { api } from '../../api/client';
import { ExplainResponse, Language } from '../../types';
import AppLayout from '../../components/AppLayout';
import CopyButton from '../../components/CopyButton';

const languages: Language[] = ['python', 'javascript', 'typescript', 'cpp', 'java', 'go', 'rust', 'auto'];

export default function ExplainPage() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<Language>('python');
  const [detailLevel, setDetailLevel] = useState<'brief' | 'detailed'>('detailed');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExplainResponse | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post<ExplainResponse>('/api/v1/explain', { code, language, detail_level: detailLevel });
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
          <h1>🔍 Explain</h1>
          <p>Paste any code and get a clear, thorough explanation.</p>
        </div>

        <form onSubmit={submit} className="tool-form">
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label className="field">
              Code
              <textarea id="explain-code" rows={12} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste your code here…" required />
            </label>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <label className="field" style={{ flex: 1, minWidth: 160 }}>
                Language
                <select id="explain-lang" value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
                  {languages.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </label>
              <label className="field" style={{ flex: 1, minWidth: 160 }}>
                Detail level
                <select id="explain-detail" value={detailLevel} onChange={(e) => setDetailLevel(e.target.value as 'brief' | 'detailed')}>
                  <option value="brief">Brief</option>
                  <option value="detailed">Detailed</option>
                </select>
              </label>
            </div>
          </div>

          {error && <div className="alert alert-danger"><span>⚠️</span><span>{error}</span></div>}

          <button id="explain-submit" className="btn btn-primary" disabled={loading} type="submit" style={{ alignSelf: 'flex-start', padding: '12px 28px' }}>
            {loading ? <><span className="spinner" /> Explaining…</> : '🔍 Explain'}
          </button>
        </form>

        {result && (
          <div className="result-section">
            <div>
              <div className="code-block-header">
                Explanation
                <CopyButton text={result.explanation} />
              </div>
              <pre className="code-block">{result.explanation}</pre>
            </div>
            <div><span className="latency-badge"><span className="dot" />{Math.round(result.latency_ms)} ms</span></div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
