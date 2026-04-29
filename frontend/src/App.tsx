import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import GeneratePage from './pages/tools/GeneratePage';
import ExplainPage from './pages/tools/ExplainPage';
import BugfixPage from './pages/tools/BugfixPage';
import RefactorPage from './pages/tools/RefactorPage';
import ChatPage from './pages/tools/ChatPage';
import AutocompletePage from './pages/tools/AutocompletePage';
import HealthPage from './pages/HealthPage';

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16, color: 'var(--text-secondary)',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, animation: 'pulse 1.5s infinite',
      }}>⚡</div>
      <span style={{ fontSize: '0.9rem' }}>Loading DevAssist…</span>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/health" element={<RequireAuth><HealthPage /></RequireAuth>} />
      <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="/tools/generate" element={<RequireAuth><GeneratePage /></RequireAuth>} />
      <Route path="/tools/explain" element={<RequireAuth><ExplainPage /></RequireAuth>} />
      <Route path="/tools/bugfix" element={<RequireAuth><BugfixPage /></RequireAuth>} />
      <Route path="/tools/refactor" element={<RequireAuth><RefactorPage /></RequireAuth>} />
      <Route path="/tools/autocomplete" element={<RequireAuth><AutocompletePage /></RequireAuth>} />
      <Route path="/tools/chat" element={<RequireAuth><ChatPage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
