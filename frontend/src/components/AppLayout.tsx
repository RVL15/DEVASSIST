import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

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

  const onLogout = async () => {
    await logout();
    await refresh();
    navigate('/login', { replace: true });
  };

  const initials = user ? user.slice(0, 2).toUpperCase() : '??';
  const closeMobile = () => setMobileOpen(false);

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
      </nav>

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <span className="user-name">{user}</span>
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
        <div style={{ width: 36 }} />
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
