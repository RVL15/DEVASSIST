import { AuthMeResponse, LoginResponse } from '../types';

// In dev, Vite proxies /api/* → backend. In prod, backend serves the SPA itself.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? '';

async function apiFetch<T>(path: string, payload?: unknown): Promise<T> {
  const url = `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, {
    method: payload !== undefined ? 'POST' : 'GET',
    headers: payload !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
    credentials: 'include',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }

  return (await res.json()) as T;
}

export const api = {
  async get<T>(path: string): Promise<T> {
    return apiFetch<T>(path);
  },
  async post<T>(path: string, payload: unknown): Promise<T> {
    return apiFetch<T>(path, payload);
  },
  async del<T>(path: string): Promise<T> {
    const url = `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`API error ${res.status}: ${text || res.statusText}`);
    }
    return (await res.json()) as T;
  },
};

export async function login(username: string, password: string) {
  return api.post<LoginResponse>('/api/v1/auth/login', { username, password });
}

export async function authMe(): Promise<AuthMeResponse> {
  return api.get<AuthMeResponse>('/api/v1/auth/me');
}

export async function logout(): Promise<{ ok: boolean }> {
  return api.post<{ ok: boolean }>('/api/v1/auth/logout', {});
}
