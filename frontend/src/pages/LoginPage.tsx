import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">⚡</div>
          <div className="login-logo-text">Dev<span>Assist</span></div>
        </div>
        <h2>Welcome back</h2>
        <p className="subtitle">Sign in to your local AI coding assistant</p>

        <form onSubmit={onSubmit} className="login-form">
          <label className="field">
            Username
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </label>
          <label className="field">
            Password
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          {error && (
            <div className="alert alert-danger">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            id="login-submit"
            className="btn btn-primary"
            disabled={loading || submitting}
            type="submit"
            style={{ marginTop: 4, width: '100%', padding: '12px 20px' }}
          >
            {submitting ? (
              <>
                <span className="spinner" />
                Signing in…
              </>
            ) : (
              'Sign in →'
            )}
          </button>
        </form>

        <div className="login-hint">
          Default credentials: <code>admin</code> / <code>admin</code>
        </div>
      </div>
    </div>
  );
}
