# LLM Batch API

FastAPI service that batches LLM (Gemini) requests by priority, runs one combined LLM call per batch, and returns individual responses. Includes chat history storage, analytics (batch-level), and configurable settings (API key, priority thresholds) for a frontend.

---

## Architecture

### Overview

1. **Client** sends `POST /v1/query` with `username`,`prompt`, `priority` (HIGH / MEDIUM / LOW), and metadata.
2. **Queue manager** enqueues the request in a priority-specific queue (HIGH / MEDIUM / LOW).
3. A **dispatcher loop** periodically checks each queue; when a **batching window** expires or **max batch size** is reached, it takes a batch and hands it to the **batch processor**.
4. **Batch processor** builds a **single combined prompt** (all questions + system instruction per priority), calls the **LLM client** once, parses the **JSON response**, and maps results back to each request by index.
5. Each request’s **future** is resolved with its **GenerationResponse**; the pair is stored in **chat store** and written to **individual log**.
6. **Settings** (API key, tokens/latency per priority) are persisted in `data/settings.json` and can be read/updated via **GET/PUT /v1/settings**. **Analytics** (batch counts, time-series, priority distribution) are computed from chat store and served at **GET /v1/analytics**.

### Component diagram

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                      FastAPI app (main.py)                │
                    │  /health  /v1/query  /v1/chat  /v1/settings  /v1/analytics │
                    └─────────────────────────────────────────────────────────┘
                                              │
         ┌────────────────────────────────────┼────────────────────────────────────┐
         │                                    │                                    │
         ▼                                    ▼                                    ▼
┌─────────────────┐              ┌─────────────────────┐              ┌─────────────────────┐
│  QueueManager   │              │   BatchProcessor    │              │  Settings / Chat    │
│  - high_queue   │──dispatch───▶│  - build 1 prompt   │              │  - settings_store   │
│  - medium_queue │   (batch)    │  - 1 LLM call        │              │  - chat_store       │
│  - low_queue    │              │  - parse JSON        │              │  - get_analytics()  │
│  - windows      │              │  - map to request_id │              └─────────────────────┘
│  - max_batch    │              │  - append_chat()     │
└─────────────────┘              └──────────┬──────────┘
                                            │
                                            ▼
                                 ┌─────────────────────┐
                                 │     LLMClient       │
                                 │  - Gemini API       │
                                 │  - get_api_key()   │
                                 │  - get_thresholds()│
                                 └─────────────────────┘
```

### Batching rules (QueueManager)

| Priority | Batching window | Max batch size |
|----------|-----------------|----------------|
| HIGH     | 0.2 s           | 6              |
| MEDIUM   | 1.0 s           | 4              |
| LOW      | 4.0 s           | 4              |

A batch is dispatched when the **oldest item** in the queue has waited at least the window **or** the queue size reaches max batch size.

### Priority behavior

- **HIGH (2):** Short, fast answers (fewer tokens, lower latency target).
- **MEDIUM (1):** Balanced length and latency.
- **LOW (0):** Detailed, longer answers (more tokens, higher latency target).

Token limits and latency targets per priority are **configurable** via `PUT /v1/settings` (stored in `data/settings.json`). Defaults align with the Settings UI (e.g. High: 1000 tokens / 500 ms; Medium: 5000 / 2000 ms; Low: 10000 / 5000 ms when set there).

---

## Project structure

```
tarun/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app, routes, lifespan, CORS
│   ├── models.py             # Pydantic: Priority, GenerationRequest/Response, Analytics, Settings
│   ├── config.py             # Default app config (gemini_api_key, gemini_model, etc.)
│   ├── queue_manager.py      # Priority queues, batching windows, dispatcher loop
│   ├── batch_processor.py   # One combined prompt → one LLM call → split by index, chat append
│   ├── llm_client.py         # Gemini client; one generate_batch() call per batch
│   ├── chat_store.py         # data/chats.json: append chat, get_chats(), get_analytics()
│   └── settings_store.py    # data/settings.json: API key, high/medium/low_priority thresholds
├── data/
│   ├── chats.json            # All request/response pairs + batch_id (for analytics by batch)
│   └── settings.json         # Runtime config: api_key, high/medium/low_priority { tokens, latency_ms }
├── logs/
│   ├── llm_request_response.log      # Combined prompt + raw LLM response per batch
│   └── individual_request_response.log # One block per request/response pair
├── tests/
│   ├── test_api.py
│   └── test_batching.py
├── quick_batch_test.py       # Sends 3 HIGH + 3 MEDIUM + 2 LOW requests
├── test_batching_live.py     # Multi-scenario batching tests
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── pytest.ini
└── README.md
```

---

## API reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check. |
| POST | `/v1/query` | Submit a single generation request; returns when its batch is processed and response is ready. |
| GET | `/v1/chat` | Return all stored chats (request/response pairs) from `data/chats.json`. |
| GET | `/v1/settings` | Return current configuration (API key masked). |
| PUT | `/v1/settings` | Update configuration (API key, high/medium/low tokens and latency_ms). Partial body supported. |
| GET | `/v1/analytics` | Return dashboard analytics: total batches, per-priority batch counts, request count over time (by date), priority distribution. |

### POST /v1/query

**Request body:**

```json
{
  "username": "user",
  "request_id": "uuid-or-string",
  "prompt": "Your question here",
  "created_at": "2026-02-01T12:00:00Z",
  "priority": "HIGH"
}
```

`priority`: `"HIGH"` | `"MEDIUM"` | `"LOW"`.

**Response:** `GenerationResponse` (request_id, username, text, tokens_used, latency_ms, created_at, completed_at).

Request timeout is derived from configured `latency_ms` for the priority (e.g. `latency_ms/1000 + 30` seconds).

### GET /v1/chat

**Response:**

```json
{
  "chats": [
    {
      "timestamp": "2026-02-01T12:00:00+00:00",
      "batch_id": "uuid",
      "request": { "request_id": "...", "username": "...", "prompt": "...", "priority": 2, "created_at": "..." },
      "response": { "request_id": "...", "text": "...", "tokens_used": 42, "latency_ms": 123.45, ... }
    }
  ],
  "count": 10
}
```

### GET /v1/settings

**Response:** Current config; API key is masked (e.g. `***...last4`).

```json
{
  "api_key": "***xxxx",
  "high_priority":   { "tokens": 1000, "latency_ms": 500 },
  "medium_priority": { "tokens": 5000, "latency_ms": 2000 },
  "low_priority":    { "tokens": 10000, "latency_ms": 5000 }
}
```

### PUT /v1/settings

**Request body (all keys optional):**

```json
{
  "api_key": "your-gemini-api-key",
  "high_priority":   { "tokens": 1000, "latency_ms": 500 },
  "medium_priority": { "tokens": 5000, "latency_ms": 2000 },
  "low_priority":    { "tokens": 10000, "latency_ms": 5000 }
}
```

Only provided fields are updated. Response shape matches GET /v1/settings.

### GET /v1/analytics

**Response:** Batch-level metrics (not per individual request).

```json
{
  "total_requests": 5,
  "high_priority": 4,
  "medium_priority": 1,
  "low_priority": 0,
  "request_count_over_time": [
    { "date": "2025-01-27", "count": 2 },
    { "date": "2025-01-28", "count": 1 }
  ],
  "priority_distribution": [
    { "name": "High", "value": 4 },
    { "name": "Medium", "value": 1 },
    { "name": "Low", "value": 0 }
  ]
}
```

---

## Configuration

### Built-in config (`app/config.py`)

- `app_name`, `debug`
- `batch_size`, `batch_timeout_seconds` (queue/batching defaults)
- `gemini_api_key`, `gemini_model` — used if no API key is set in Settings (data/settings.json).

### Runtime settings (Settings UI / API)

- Stored in **`data/settings.json`**.
- **API key:** If set via PUT /v1/settings, it overrides `config.gemini_api_key`; LLM client is recreated when the key changes.
- **Per-priority:** `tokens` (max output tokens for that priority), `latency_ms` (target latency; also used to derive request timeout).

---

## Setup and run

### Local

```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Health: `GET http://localhost:8000/health`
- API: `http://localhost:8000` (e.g. POST /v1/query, GET /v1/chat, /v1/settings, /v1/analytics).

### Docker

```bash
docker compose up --build
```

API is at `http://localhost:8000`. Ensure `data/` and `logs/` are writable if you mount them or use volumes so chats and settings persist.

---

## Testing

```bash
pytest tests/ -v
```

**Quick batching test (3 HIGH + 3 MEDIUM + 2 LOW):**

```bash
python quick_batch_test.py
```

**Larger batching suite:**

```bash
python test_batching_live.py
```

Watch server logs for `[ENQUEUE]`, `[DISPATCH]`, `[BATCH_START]`, `[BATCH_COMPLETE]`, and `[LLM_BATCH]` to see batching and single-call behavior.

---

## Logging and storage

- **logs/llm_request_response.log** — One block per **batch**: combined prompt sent to the LLM and raw LLM response.
- **logs/individual_request_response.log** — One block per **request/response** (after splitting the batch).
- **data/chats.json** — Every request/response pair plus `batch_id`; used for GET /v1/chat and GET /v1/analytics (batch counts).
- **data/settings.json** — API key and high/medium/low_priority thresholds; used by GET/PUT /v1/settings and at runtime for LLM and timeouts.

---

## CORS

The app uses `CORSMiddleware` with `allow_origins=["*"]` so a frontend (e.g. on port 3000) can call the API. Tighten `allow_origins` in production.
