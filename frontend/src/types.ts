export type Language =
  | 'python'
  | 'javascript'
  | 'typescript'
  | 'cpp'
  | 'java'
  | 'go'
  | 'rust'
  | 'auto';

export interface FileContext {
  content: string;
  language: Language;
  filename?: string | null;
}

export interface AutocompleteResponse {
  completion: string;
  latency_ms: number;
}

export interface ExplainResponse {
  explanation: string;
  latency_ms: number;
}

export interface Bug {
  line?: number | null;
  type: string;
  description: string;
  fix: string;
}

export interface BugFixResponse {
  bugs: Bug[];
  fixed_code: string;
  latency_ms: number;
}

export interface RefactorResponse {
  refactored_code: string;
  changes: string[];
  latency_ms: number;
}

export interface GenerateResponse {
  code: string;
  explanation: string;
  latency_ms: number;
}

export interface ChatResponse {
  session_id: string;
  reply: string;
  latency_ms: number;
}

export interface AuthMeResponse {
  username: string;
  is_admin?: boolean;
}

export interface LoginResponse {
  ok: boolean;
  username: string;
  token: string;
  latency_ms: number;
}

// Simple helper shape for API responses with a discriminant.
export type BackendResponse<TAction extends string> = {
  ok?: boolean;
} & Record<string, unknown>;

