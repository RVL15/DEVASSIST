import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import AppLayout from '../components/AppLayout';

interface User {
  username: string;
  status: 'approved' | 'pending' | 'denied';
  created_at: string;
  password?: string;
  login_history?: { timestamp: string; status: string }[];
  password_history?: { password: string; changed_at: string }[];
}

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    loadUsers();
  }, [user, navigate]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/auth/users');
      if (!response.ok) throw new Error('Failed to load users');
      const data = await response.json();
      setUsers(data.users);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (username: string, approved: boolean) => {
    try {
      setActionLoading(username);
      const response = await fetch(`/api/v1/auth/users/${username}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, approved }),
      });
      if (!response.ok) throw new Error('Failed to update user');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'status-badge status-approved';
      case 'pending':
        return 'status-badge status-pending';
      case 'denied':
        return 'status-badge status-denied';
      default:
        return 'status-badge';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <AppLayout>
      <div className="page-content">
        <div className="admin-header">
          <div>
            <h1>User Management</h1>
            <p className="admin-subtitle">Approve or deny user registrations</p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <React.Fragment key={u.username}>
                      <tr>
                        <td>
                          <code>{u.username}</code>
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(u.status)}>
                            {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                          </span>
                        </td>
                        <td>{formatDate(u.created_at)}</td>
                        <td className="actions">
                          {u.status === 'pending' && (
                            <>
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleApprove(u.username, true)}
                                disabled={actionLoading === u.username}
                              >
                                {actionLoading === u.username ? '...' : '✓ Approve'}
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleApprove(u.username, false)}
                                disabled={actionLoading === u.username}
                              >
                                {actionLoading === u.username ? '...' : '✕ Deny'}
                              </button>
                            </>
                          )}
                          {u.status === 'approved' && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleApprove(u.username, false)}
                              disabled={actionLoading === u.username}
                            >
                              {actionLoading === u.username ? '...' : '✕ Revoke'}
                            </button>
                          )}
                          {u.status === 'denied' && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleApprove(u.username, true)}
                              disabled={actionLoading === u.username}
                            >
                              {actionLoading === u.username ? '...' : '✓ Approve'}
                            </button>
                          )}
                          <button
                            className="btn btn-sm"
                            onClick={() => setExpandedUser(expandedUser === u.username ? null : u.username)}
                            style={{ marginLeft: '8px' }}
                          >
                            {expandedUser === u.username ? 'Hide Details' : 'View Details'}
                          </button>
                        </td>
                      </tr>
                      {expandedUser === u.username && (
                        <tr>
                          <td colSpan={4} style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '16px' }}>
                            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                              <div style={{ flex: 1, minWidth: '250px' }}>
                                <h4 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Sign-in History</h4>
                                {u.login_history && u.login_history.length > 0 ? (
                                  <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '0.9em' }}>
                                    {u.login_history.map((lh, i) => (
                                      <li key={i} style={{ marginBottom: '4px' }}>
                                        {formatDate(lh.timestamp)} - <span style={{ color: lh.status === 'success' ? 'var(--text-primary)' : 'var(--danger-color)' }}>{lh.status}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9em' }}>No login history.</p>
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: '250px' }}>
                                <h4 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Password Info</h4>
                                <p style={{ fontSize: '0.9em', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                                  <strong>Current Password:</strong> <code>{u.password || 'N/A'}</code>
                                </p>
                                {u.password_history && u.password_history.length > 0 && (
                                  <>
                                    <strong style={{ fontSize: '0.9em', color: 'var(--text-secondary)' }}>History:</strong>
                                    <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '0.9em' }}>
                                      {u.password_history.map((ph, i) => (
                                        <li key={i} style={{ marginBottom: '4px' }}>
                                          {formatDate(ph.changed_at)} - <code>{ph.password}</code>
                                        </li>
                                      ))}
                                    </ul>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
