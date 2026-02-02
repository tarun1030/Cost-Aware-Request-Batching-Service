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

/**
 * Submit a query with streaming response support.
 * Calls onChunk for each text chunk received, and onComplete when done.
 */
export async function submitQuery(
  requestId: string,
  username: string,
  prompt: string,
  priority: number,
  onChunk: (text: string) => void,
  onComplete: (response: GenerationResponse) => void,
  onError: (error: string) => void
): Promise<void> {
  const body: GenerationRequest = {
    username,
    request_id: requestId,
    prompt,
    created_at: new Date().toISOString(),
    priority,
  };

  try {
    const res = await fetch(`${API_BASE}/v1/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Request failed: ${res.status} ${res.statusText}`);
    }

    if (!res.body) {
      throw new Error('Response body is null');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let metadata: Partial<GenerationResponse> = {};

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'text') {
              fullText += data.content;
              onChunk(data.content);
            } else if (data.type === 'done') {
              metadata = {
                request_id: data.request_id,
                username: data.username,
                tokens_used: data.tokens_used,
                latency_ms: data.latency_ms,
                created_at: data.created_at,
                completed_at: data.completed_at,
              };
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          } catch (e) {
            console.error('Failed to parse SSE message:', e);
          }
        }
      }
    }

    // Complete with full response
    if (metadata.request_id) {
      onComplete({
        request_id: metadata.request_id,
        username: metadata.username || username,
        text: fullText,
        tokens_used: metadata.tokens_used || 0,
        latency_ms: metadata.latency_ms || 0,
        created_at: metadata.created_at || new Date().toISOString(),
        completed_at: metadata.completed_at || new Date().toISOString(),
      });
    } else {
      throw new Error('Incomplete response from server');
    }

  } catch (err) {
    onError(err instanceof Error ? err.message : 'Request failed');
  }
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