import React, { useState } from 'react';
import { api } from '../../api/client';
import { GenerateResponse, Language } from '../../types';
import AppLayout from '../../components/AppLayout';
import CopyButton from '../../components/CopyButton';
import { loadPersistedValue, savePersistedValue, toolStorageKeys } from '../../utils/toolPersistence';

const languages: Language[] = ['python', 'javascript', 'typescript', 'cpp', 'java', 'go', 'rust', 'auto'];

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState<Language>('python');
  const [includeFileContext, setIncludeFileContext] = useState(false);
  const [fileContent, setFileContent] = useState('');
  const [fileFilename, setFileFilename] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(() => loadPersistedValue<GenerateResponse | null>(toolStorageKeys.generate, null));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const file_context = includeFileContext
        ? { content: fileContent, filename: fileFilename || undefined, language }
        : null;
      const res = await api.post<GenerateResponse>('/api/v1/generate', { prompt, language, file_context });
      setResult(res);
      savePersistedValue(toolStorageKeys.generate, res);
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
          <h1>✨ Generate</h1>
          <p>Describe what you need and get working code instantly.</p>
        </div>

        <form onSubmit={submit} className="tool-form">
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label className="field">
              Prompt
              <textarea
                id="generate-prompt"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Binary search tree with insert and search methods…"
                required
              />
            </label>

            <label className="field">
              Language
              <select id="generate-lang" value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
                {languages.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </label>

            <label className="toggle-wrap">
              <input
                type="checkbox"
                checked={includeFileContext}
                onChange={(e) => setIncludeFileContext(e.target.checked)}
              />
              <span className="toggle" />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Include file context</span>
            </label>

            {includeFileContext && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="fade-in">
                <label className="field">
                  File name <span style={{ textTransform: 'none', color: 'var(--text-muted)' }}>(optional)</span>
                  <input id="generate-filename" type="text" value={fileFilename} onChange={(e) => setFileFilename(e.target.value)} placeholder="main.py" />
                </label>
                <label className="field">
                  File content
                  <textarea rows={8} value={fileContent} onChange={(e) => setFileContent(e.target.value)} placeholder="Paste your existing code here…" />
                </label>
              </div>
            )}
          </div>

          {error && <div className="alert alert-danger"><span>⚠️</span><span>{error}</span></div>}

          <button id="generate-submit" className="btn btn-primary" disabled={loading} type="submit" style={{ alignSelf: 'flex-start', padding: '12px 28px' }}>
            {loading ? <><span className="spinner" /> Generating…</> : '✨ Generate'}
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
            <div>
              <div className="code-block-header">
                {language} code
                <CopyButton text={result.code} />
              </div>
              <pre className="code-block">{result.code}</pre>
            </div>
            <div><span className="latency-badge"><span className="dot" />{Math.round(result.latency_ms)} ms</span></div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
