const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface GenerationRequest {
  username: string;
  request_id: string;
  prompt: string;
  created_at: string; // ISO 8601 datetime
  priority: number; // 0=Low, 1=Medium, 2=High
}

export interface GenerationResponse {
  request_id: string;
  username: string;
  text: string;
  tokens_used: number;
  latency_ms: number;
  created_at: string;
  completed_at: string;
}

export async function submitQuery(
  requestId: string,
  username: string,
  prompt: string,
  priority: number // 0=Low, 1=Medium, 2=High
): Promise<GenerationResponse> {
  const body: GenerationRequest = {
    username,
    request_id: requestId,
    prompt,
    created_at: new Date().toISOString(),
    priority,
  };

  const res = await fetch(`${API_BASE}/v1/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// Analytics API (matches backend AnalyticsResponse)
export interface TimeSeriesPoint {
  date: string;
  count: number;
}

export interface PriorityDistributionItem {
  name: string;
  value: number;
}

export interface AnalyticsResponse {
  total_requests: number;
  high_priority: number;
  medium_priority: number;
  low_priority: number;
  request_count_over_time: TimeSeriesPoint[];
  priority_distribution: PriorityDistributionItem[];
}

export async function fetchAnalytics(): Promise<AnalyticsResponse> {
  const res = await fetch(`${API_BASE}/v1/analytics`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Analytics failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// Chat history API (GET /v1/chat)
// Backend returns { chats: [{ timestamp?, batch_id?, request: { username, request_id, prompt, created_at, priority }, response: { request_id, username, text, ... } }], count? }
export interface ChatHistoryItem {
  request_id?: string;
  username: string;
  query: string;
  response?: string;
  priority: number; // 0=Low, 1=Medium, 2=High
  created_at?: string;
  completed_at?: string;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

export async function fetchChatHistory(): Promise<ChatHistoryItem[]> {
  const res = await fetch(`${API_BASE}/v1/chat`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Chat history failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const list = Array.isArray(data) ? data : data.chats ?? data.items ?? [];

  return list.map((item: unknown) => {
    if (!isObject(item)) {
      return { username: '', query: '', priority: 1 };
    }
    const req = isObject(item.request) ? item.request : {};
    const resp = isObject(item.response) ? item.response : {};
    const username = String(resp.username ?? req.username ?? '');
    const query = String(req.prompt ?? '');
    const responseText = resp.text != null ? String(resp.text) : undefined;
    const priority = typeof req.priority === 'number' ? req.priority : 1;
    const requestId = (resp.request_id ?? req.request_id) as string | undefined;
    const created_at = (req.created_at ?? resp.created_at) as string | undefined;
    const completed_at = (resp.completed_at ?? item.timestamp) as string | undefined;

    return {
      request_id: requestId,
      username,
      query,
      response: responseText,
      priority,
      created_at,
      completed_at,
    };
  });
}
