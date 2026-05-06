export const toolStorageKeys = {
  generate: 'devassist_tool_generate_result',
  explain: 'devassist_tool_explain_result',
  autocomplete: 'devassist_tool_autocomplete_result',
  bugfix: 'devassist_tool_bugfix_result',
  refactor: 'devassist_tool_refactor_result',
  chatMessages: 'devassist_tool_chat_messages',
  chatSession: 'devassist_chat_session',
} as const;

export function loadPersistedValue<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function savePersistedValue<T>(key: string, value: T | null) {
  if (typeof window === 'undefined') return;
  if (value === null) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function clearToolStorage() {
  if (typeof window === 'undefined') return;
  Object.values(toolStorageKeys).forEach((key) => window.localStorage.removeItem(key));
}