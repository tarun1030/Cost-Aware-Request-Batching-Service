const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/** Matches backend PriorityThreshold (tokens + latency). */
export interface PriorityThreshold {
  tokens: number;
  latency: number;
}

/** PUT /v1/settings body – all optional for partial update. */
export interface SettingsUpdate {
  api_key?: string | null;
  high_priority?: PriorityThreshold | null;
  medium_priority?: PriorityThreshold | null;
  low_priority?: PriorityThreshold | null;
}

/** Build body with only defined, non-null fields (partial update). */
function toPutBody(update: SettingsUpdate): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (update.api_key != null && update.api_key !== '') {
    body.api_key = update.api_key;
  }
  if (update.high_priority != null) {
    body.high_priority = update.high_priority;
  }
  if (update.medium_priority != null) {
    body.medium_priority = update.medium_priority;
  }
  if (update.low_priority != null) {
    body.low_priority = update.low_priority;
  }
  return body;
}

export async function putSettings(update: SettingsUpdate): Promise<void> {
  const body = toPutBody(update);
  if (Object.keys(body).length === 0) {
    return;
  }

  const res = await fetch(`${API_BASE}/v1/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Settings update failed: ${res.status} ${res.statusText}`);
  }
}
