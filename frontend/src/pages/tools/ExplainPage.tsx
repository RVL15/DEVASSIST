import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { ExplainResponse, Language } from '../../types';
import AppLayout from '../../components/AppLayout';
import CopyButton from '../../components/CopyButton';
import { loadPersistedValue, savePersistedValue, toolStorageKeys } from '../../utils/toolPersistence';

const languages: Language[] = ['python', 'javascript', 'typescript', 'cpp', 'java', 'go', 'rust', 'auto'];

export default function ExplainPage() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<Language>('python');
  const [detailLevel, setDetailLevel] = useState<'brief' | 'detailed'>('detailed');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Streaming state
  const [streamedExplanation, setStreamedExplanation] = useState<string | null>(() => loadPersistedValue<string | null>(toolStorageKeys.explain, null));
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    savePersistedValue(toolStorageKeys.explain, streamedExplanation);
  }, [streamedExplanation]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setStreamedExplanation('');
    setLatency(null);
    
    const t0 = performance.now();
    try {
      const stream = api.stream('/api/v1/explain', { code, language, detail_level: detailLevel });
      for await (const chunk of stream) {
        setStreamedExplanation((prev) => (prev || '') + chunk);
      }
      setLatency(performance.now() - t0);
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
          <p>Paste any code and get a clear, thorough explanation streamed instantly.</p>
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

        {streamedExplanation !== null && (
          <div className="result-section">
            <div>
              <div className="code-block-header">
                Explanation
                {loading && <span className="spinner" style={{width: 12, height: 12, borderWidth: 2, marginLeft: 8}}/>}
                {!loading && <CopyButton text={streamedExplanation} />}
              </div>
              <pre className="code-block">{streamedExplanation}</pre>
            </div>
            {latency !== null && (
              <div><span className="latency-badge"><span className="dot" />{Math.round(latency)} ms</span></div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
