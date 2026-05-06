import React, { useMemo, useState } from 'react';
import { api } from '../../api/client';
import { RefactorResponse, Language } from '../../types';
import AppLayout from '../../components/AppLayout';
import CopyButton from '../../components/CopyButton';
import { loadPersistedValue, savePersistedValue, toolStorageKeys } from '../../utils/toolPersistence';

const languages: Language[] = ['python', 'javascript', 'typescript', 'cpp', 'java', 'go', 'rust', 'auto'];
const goalsAll = ['readability', 'performance', 'security', 'dry'] as const;
type RefactorGoal = (typeof goalsAll)[number];

const goalMeta: Record<RefactorGoal, { icon: string; desc: string }> = {
  readability: { icon: '📖', desc: 'Cleaner, more understandable code' },
  performance: { icon: '⚡', desc: 'Faster execution & efficiency' },
  security: { icon: '🔒', desc: 'Eliminate security vulnerabilities' },
  dry: { icon: '♻️', desc: "Don't Repeat Yourself" },
};

export default function RefactorPage() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<Language>('python');
  const [goals, setGoals] = useState<RefactorGoal[]>(['readability']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RefactorResponse | null>(() => loadPersistedValue<RefactorResponse | null>(toolStorageKeys.refactor, null));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<RefactorResponse>('/api/v1/refactor', { code, language, goals });
      setResult(res);
      savePersistedValue(toolStorageKeys.refactor, res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const goalChecks = useMemo(() => goalsAll.map((g) => ({ goal: g, checked: goals.includes(g) })), [goals]);

  return (
    <AppLayout>
      <div className="page-content">
        <div className="page-header">
          <h1>♻️ Refactor</h1>
          <p>Improve your code quality with targeted refactoring goals.</p>
        </div>

        <form onSubmit={submit} className="tool-form">
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label className="field">
              Code
              <textarea id="refactor-code" rows={12} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste the code to refactor…" required />
            </label>
            <label className="field" style={{ maxWidth: 220 }}>
              Language
              <select id="refactor-lang" value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
                {languages.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </label>

            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Refactor goals</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {goalChecks.map(({ goal, checked }) => (
                  <label
                    key={goal}
                    className={`goal-tag${checked ? ' active' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setGoals((prev) =>
                          e.target.checked ? [...prev, goal] : prev.filter((x) => x !== goal)
                        );
                      }}
                    />
                    {goalMeta[goal].icon} {goal}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {error && <div className="alert alert-danger"><span>⚠️</span><span>{error}</span></div>}

          <button id="refactor-submit" className="btn btn-primary" disabled={loading || goals.length === 0} type="submit" style={{ alignSelf: 'flex-start', padding: '12px 28px' }}>
            {loading ? <><span className="spinner" /> Refactoring…</> : '♻️ Refactor'}
          </button>
        </form>

        {result && (
          <div className="result-section">
            <div>
              <h2 style={{ marginBottom: 12 }}>Changes made</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.changes.map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 14px', borderRadius: 8, background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    <span style={{ color: '#6ee7b7', flexShrink: 0 }}>→</span>
                    {c}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="code-block-header">
                Refactored code
                <CopyButton text={result.refactored_code} />
              </div>
              <pre className="code-block">{result.refactored_code}</pre>
            </div>
            <div><span className="latency-badge"><span className="dot" />{Math.round(result.latency_ms)} ms</span></div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
