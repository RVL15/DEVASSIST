import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../api/client';
import { ChatResponse, FileContext, Language } from '../../types';
import AppLayout from '../../components/AppLayout';

const languages: Language[] = ['python', 'javascript', 'typescript', 'cpp', 'java', 'go', 'rust', 'auto'];
type ChatMessage = { role: 'user' | 'assistant'; content: string };

function randomSessionId() {
  return Math.random().toString(36).slice(2);
}

export default function ChatPage() {
  const storageKey = 'devassist_chat_session';
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeContext, setIncludeContext] = useState(false);
  const [contextLanguage, setContextLanguage] = useState<Language>('python');
  const [contextContent, setContextContent] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const existing = window.localStorage.getItem(storageKey);
    const sid = existing || randomSessionId();
    setSessionId(sid);
    window.localStorage.setItem(storageKey, sid);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const file_context: FileContext | null = useMemo(() => {
    if (!includeContext) return null;
    return { content: contextContent, language: contextLanguage, filename: undefined };
  }, [includeContext, contextContent, contextLanguage]);

  const send = async () => {
    const msg = text.trim();
    if (!msg || !sessionId) return;
    setError(null);
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setText('');
    try {
      const res = await api.post<ChatResponse>('/api/v1/chat', { session_id: sessionId, message: msg, file_context });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const clear = async () => {
    setError(null);
    if (!sessionId) return;
    setLoading(true);
    try {
      await api.del(`/api/v1/chat/${sessionId}`);
      setMessages([]);
      const sid = randomSessionId();
      setSessionId(sid);
      window.localStorage.setItem(storageKey, sid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: 800 }}>
        <div className="page-header">
          <h1>💬 Chat</h1>
          <p>Multi-turn conversation with your code. Session memory is persisted.</p>
        </div>

        {/* Chat window */}
        <div
          className="card"
          style={{
            flex: 1,
            minHeight: 320,
            maxHeight: 480,
            overflowY: 'auto',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            marginBottom: 16,
          }}
        >
          {messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: 10 }}>
              <span style={{ fontSize: '2.5rem' }}>💬</span>
              <span style={{ fontSize: '0.9rem' }}>No messages yet. Ask something about your code.</span>
            </div>
          ) : (
            <>
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}
                  className="fade-in"
                >
                  <div className={`chat-bubble ${m.role}`}>{m.content}</div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div className="chat-bubble assistant" style={{ padding: 0 }}>
                    <div className="typing-indicator">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: 12 }}><span>⚠️</span><span>{error}</span></div>}

        {/* Input area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <textarea
              id="chat-input"
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask DevAssist… (Enter to send, Shift+Enter for newline)"
              style={{ flex: 1 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button id="chat-send" className="btn btn-primary" disabled={loading || !text.trim()} onClick={() => void send()} type="button" style={{ padding: '10px 20px' }}>
                {loading ? <span className="spinner" /> : 'Send'}
              </button>
              <button id="chat-clear" className="btn btn-danger" disabled={loading} onClick={() => void clear()} type="button" style={{ padding: '10px 20px', fontSize: '0.8125rem' }}>
                Clear
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label className="toggle-wrap">
              <input type="checkbox" checked={includeContext} onChange={(e) => setIncludeContext(e.target.checked)} />
              <span className="toggle" />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>File context</span>
            </label>
          </div>

          {includeContext && (
            <div className="card fade-in" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label className="field" style={{ maxWidth: 200 }}>
                Language
                <select value={contextLanguage} onChange={(e) => setContextLanguage(e.target.value as Language)}>
                  {languages.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </label>
              <label className="field">
                File content
                <textarea rows={6} value={contextContent} onChange={(e) => setContextContent(e.target.value)} placeholder="Paste your code for context…" />
              </label>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
