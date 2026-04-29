import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { api } from '../api/client';

const tools = [
  { path: '/tools/generate', icon: '✨', label: 'Generate', desc: 'Create code from a natural language prompt with AI.', glow: 'rgba(99,102,241,0.12)' },
  { path: '/tools/explain', icon: '🔍', label: 'Explain', desc: 'Get a clear explanation of any code snippet.', glow: 'rgba(34,211,238,0.1)' },
  { path: '/tools/bugfix', icon: '🐛', label: 'Bugfix', desc: 'Detect bugs and get a fixed version of your code.', glow: 'rgba(239,68,68,0.1)' },
  { path: '/tools/refactor', icon: '♻️', label: 'Refactor', desc: 'Improve code quality for readability, performance, and more.', glow: 'rgba(16,185,129,0.1)' },
  { path: '/tools/autocomplete', icon: '⚡', label: 'Autocomplete', desc: 'Context-aware cursor completion powered by local LLMs.', glow: 'rgba(245,158,11,0.1)' },
  { path: '/tools/chat', icon: '💬', label: 'Chat', desc: 'Multi-turn conversation with session memory and file context.', glow: 'rgba(139,92,246,0.12)' },
];

type HealthData = { status: string; version: string };

export default function DashboardPage() {
  const [health, setHealth] = useState<HealthData | null>(null);

  useEffect(() => {
    void api.get<HealthData>('/health').then(setHealth).catch(() => null);
  }, []);

  return (
    <AppLayout>
      <div className="page-content">
        <div className="page-header">
          <h1>Dashboard</h1>
          <p>Your local AI-powered coding assistant. All processing stays on your machine.</p>
        </div>

        {/* Status banner */}
        <div className="card" style={{ padding: '18px 24px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: '2rem' }}>🦙</div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>Powered by Ollama — 100% Local</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                No cloud, no API keys, no data leaks.
              </div>
            </div>
          </div>
          {health && (
            <span className={`health-indicator ${health.status === 'ok' ? 'health-ok' : 'health-err'}`}>
              <span className="health-pulse" />
              Backend v{health.version}
            </span>
          )}
        </div>

        {/* Quick stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '16px 0' }}>
          {[
            { label: 'Tools', value: '6', icon: '🛠️' },
            { label: 'Privacy', value: '100%', icon: '🔒' },
            { label: 'Cloud', value: 'None', icon: '🚫' },
          ].map((s) => (
            <div key={s.label} className="card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tool cards */}
        <div style={{ marginTop: 8, marginBottom: 8, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Tools
        </div>
        <div className="dashboard-grid">
          {tools.map((t) => (
            <Link
              key={t.path}
              to={t.path}
              className="tool-card"
              style={{ '--card-glow': t.glow } as React.CSSProperties}
            >
              <div className="tool-card-icon">{t.icon}</div>
              <div className="tool-card-title">{t.label}</div>
              <div className="tool-card-desc">{t.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
