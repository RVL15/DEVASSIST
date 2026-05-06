import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      if (message.includes('pending')) {
        setError('Your account is pending admin approval. Please wait.');
      } else if (message.includes('denied')) {
        setError('Your account has been denied access.');
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!username || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      // Register user (this creates a pending user)
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.status === 403) {
        // User created but pending approval
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setIsSignup(false);
        setSuccess('Account created! Please wait for admin approval.');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to create account');
      }

      // Auto-login if user was approved (shouldn't happen for new users)
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
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
        <h2>{isSignup ? 'Create Account' : 'Welcome back'}</h2>
        <p className="subtitle">{isSignup ? 'Sign up for your AI coding assistant' : 'Sign in to your local AI coding assistant'}</p>

        <form onSubmit={isSignup ? onSignup : onLogin} className="login-form">
          <label className="field">
            Username
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete={isSignup ? 'off' : 'username'}
              autoFocus
              placeholder={isSignup ? 'Choose a username' : 'Enter your username'}
            />
          </label>
          <label className="field">
            Password
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              placeholder={isSignup ? 'At least 6 characters' : 'Enter your password'}
            />
          </label>

          {isSignup && (
            <label className="field">
              Confirm Password
              <input
                id="signup-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Confirm your password"
              />
            </label>
          )}

          {error && (
            <div className="alert alert-danger">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <span>✓</span>
              <span>{success}</span>
            </div>
          )}

          <button
            id="auth-submit"
            className="btn btn-primary"
            disabled={loading || submitting}
            type="submit"
            style={{ marginTop: 4, width: '100%', padding: '12px 20px' }}
          >
            {submitting ? (
              <>
                <span className="spinner" />
                {isSignup ? 'Creating account…' : 'Signing in…'}
              </>
            ) : (
              isSignup ? 'Create Account →' : 'Sign in →'
            )}
          </button>
        </form>

        <div className="login-footer">
          {isSignup ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setIsSignup(false);
                  setError(null);
                  setSuccess(null);
                  setConfirmPassword('');
                }}
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setIsSignup(true);
                  setError(null);
                  setSuccess(null);
                }}
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
