import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const themeKey = 'devassist_theme';

const tools = [
  { path: '/tools/generate', icon: '✨', label: 'Generate' },
  { path: '/tools/explain', icon: '🔍', label: 'Explain' },
  { path: '/tools/bugfix', icon: '🐛', label: 'Bugfix' },
  { path: '/tools/refactor', icon: '♻️', label: 'Refactor' },
  { path: '/tools/autocomplete', icon: '⚡', label: 'Autocomplete' },
  { path: '/tools/chat', icon: '💬', label: 'Chat' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (window.localStorage.getItem(themeKey) as 'dark' | 'light' | null) || 'dark';
  });

  useEffect(() => {
    document.body.dataset.theme = theme;
    window.localStorage.setItem(themeKey, theme);
  }, [theme]);

  const onLogout = async () => {
    await logout();
    await refresh();
    navigate('/login', { replace: true });
  };

  const initials = user && user.username ? user.username.slice(0, 2).toUpperCase() : '??';
  const closeMobile = () => setMobileOpen(false);
  const themeLabel = theme === 'dark' ? 'Light mode' : 'Dark mode';

  const SidebarContent = (
    <>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⚡</div>
        <div className="sidebar-logo-text">Dev<span>Assist</span></div>
        {/* Mobile close */}
        <button
          className="mobile-close-btn"
          onClick={closeMobile}
          aria-label="Close menu"
        >✕</button>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Dashboard</div>
        <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeMobile}>
          <span className="nav-icon">🏠</span>Home
        </NavLink>
        <NavLink to="/health" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeMobile}>
          <span className="nav-icon">🩺</span>API Health
        </NavLink>

        <div className="sidebar-section-label" style={{ marginTop: 8 }}>Tools</div>
        {tools.map((t) => (
          <NavLink
            key={t.path}
            to={t.path}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            onClick={closeMobile}
          >
            <span className="nav-icon">{t.icon}</span>
            {t.label}
          </NavLink>
        ))}

        {user?.is_admin && (
          <>
            <div className="sidebar-section-label" style={{ marginTop: 8 }}>Admin</div>
            <NavLink
              to="/admin/users"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={closeMobile}
            >
              <span className="nav-icon">👥</span>User Management
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          aria-label={`Switch to ${themeLabel}`}
        >
          <span className="theme-toggle-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{themeLabel}</span>
        </button>
        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <span className="user-name">{user?.username}</span>
          {user?.is_admin && <span className="user-badge">Admin</span>}
        </div>
        <button
          id="sidebar-logout"
          className="btn btn-ghost"
          onClick={() => void onLogout()}
          style={{ width: '100%', fontSize: '0.875rem' }}
        >
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="app-layout">
      {/* Mobile top bar */}
      <header className="mobile-topbar">
        <button
          className="hamburger-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <span /><span /><span />
        </button>
        <div className="mobile-logo">
          <div className="sidebar-logo-icon" style={{ width: 26, height: 26, fontSize: 13, borderRadius: 6 }}>⚡</div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Dev<span style={{ color: 'var(--primary-light)' }}>Assist</span></span>
        </div>
        <button
          type="button"
          className="theme-toggle-btn theme-toggle-btn-sm"
          onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          aria-label={`Switch to ${themeLabel}`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="mobile-overlay"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — always in DOM, animated on mobile */}
      <aside className={`sidebar${mobileOpen ? ' sidebar-open' : ''}`}>
        {SidebarContent}
      </aside>

      {/* Main content */}
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}
