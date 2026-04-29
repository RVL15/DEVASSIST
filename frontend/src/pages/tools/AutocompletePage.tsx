import React, { useState } from 'react';
import { api } from '../../api/client';
import { AutocompleteResponse, FileContext, Language } from '../../types';
import AppLayout from '../../components/AppLayout';
import CopyButton from '../../components/CopyButton';

const languages: Language[] = ['python', 'javascript', 'typescript', 'cpp', 'java', 'go', 'rust', 'auto'];

export default function AutocompletePage() {
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [maxTokens, setMaxTokens] = useState(256);
  const [includeContext, setIncludeContext] = useState(false);
  const [contextLanguage, setContextLanguage] = useState<Language>('python');
  const [contextContent, setContextContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AutocompleteResponse | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const file_context: FileContext | null = includeContext
        ? { content: contextContent, language: contextLanguage, filename: undefined }
        : null;
      const res = await api.post<AutocompleteResponse>('/api/v1/autocomplete', { prefix, suffix, max_tokens: maxTokens, file_context });
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
          <h1>⚡ Autocomplete</h1>
          <p>Cursor-aware code completion. Provide what comes before and after the cursor.</p>
        </div>

        <form onSubmit={submit} className="tool-form">
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label className="field">
              Prefix <span style={{ textTransform: 'none', color: 'var(--text-muted)', fontSize: '0.75rem' }}>(code before cursor)</span>
              <textarea id="autocomplete-prefix" rows={6} value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="def binary_search(arr, target):" required />
            </label>

            <label className="field">
              Suffix <span style={{ textTransform: 'none', color: 'var(--text-muted)', fontSize: '0.75rem' }}>(code after cursor, optional)</span>
              <textarea id="autocomplete-suffix" rows={4} value={suffix} onChange={(e) => setSuffix(e.target.value)} placeholder="return -1" />
            </label>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <label className="field" style={{ flex: '0 0 140px' }}>
                Max tokens
                <input id="autocomplete-tokens" type="number" min={1} max={2048} value={maxTokens} onChange={(e) => setMaxTokens(Number(e.target.value))} />
              </label>
            </div>

            <label className="toggle-wrap">
              <input type="checkbox" checked={includeContext} onChange={(e) => setIncludeContext(e.target.checked)} />
              <span className="toggle" />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Include file context</span>
            </label>

            {includeContext && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="fade-in">
                <label className="field" style={{ maxWidth: 220 }}>
                  Context language
                  <select value={contextLanguage} onChange={(e) => setContextLanguage(e.target.value as Language)}>
                    {languages.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </label>
                <label className="field">
                  Context content
                  <textarea rows={8} value={contextContent} onChange={(e) => setContextContent(e.target.value)} placeholder="Paste the full file content for context…" required />
                </label>
              </div>
            )}
          </div>

          {error && <div className="alert alert-danger"><span>⚠️</span><span>{error}</span></div>}

          <button id="autocomplete-submit" className="btn btn-primary" disabled={loading} type="submit" style={{ alignSelf: 'flex-start', padding: '12px 28px' }}>
            {loading ? <><span className="spinner" /> Completing…</> : '⚡ Complete'}
          </button>
        </form>

        {result && (
          <div className="result-section">
            <div>
              <div className="code-block-header">
                Completion
                <CopyButton text={result.completion} />
              </div>
              <pre className="code-block">{result.completion}</pre>
            </div>
            <div><span className="latency-badge"><span className="dot" />{Math.round(result.latency_ms)} ms</span></div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
