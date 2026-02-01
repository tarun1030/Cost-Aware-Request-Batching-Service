# SaaS Dashboard — Frontend

A modern SaaS frontend for request management, analytics, and configuration. Built with **Next.js**, **React**, **Tailwind CSS**, and **shadcn/ui**. It talks to a backend API for queries, analytics, chat history, and settings.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript |
| Styling | Tailwind CSS 4, tailwindcss-animate |
| Components | Radix UI primitives, shadcn/ui, Lucide icons |
| Charts | Recharts |
| Fonts | Geist, Geist Mono (Next.js Google Fonts) |
| Analytics | Vercel Analytics |

---

## Project Structure

```
saa-s-frontend-design/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Root layout (nav, fonts, metadata)
│   ├── page.tsx              # Home / landing
│   ├── globals.css           # Global styles
│   ├── chats/
│   │   └── page.tsx          # Chats: request cards + chat history
│   ├── dashboard/
│   │   └── page.tsx          # Dashboard: analytics + charts
│   └── settings/
│       └── page.tsx          # Settings: API key + thresholds
├── components/
│   ├── navigation.tsx        # Top nav (Chats, Dashboard, Settings)
│   ├── api-config-section.tsx # API key form (Settings)
│   ├── threshold-section.tsx # Priority threshold form (Settings)
│   ├── chat-card.tsx         # Single chat request card (Chats)
│   ├── chat-history-item.tsx # Single chat history row (Chat History)
│   ├── summary-card.tsx      # Metric card (Dashboard)
│   ├── line-chart.tsx        # Request count over time (Dashboard)
│   ├── pie-chart.tsx         # Priority distribution (Dashboard)
│   ├── theme-provider.tsx    # Theme context
│   └── ui/                   # shadcn/ui primitives
├── lib/
│   ├── chat-api.ts           # v1/query, v1/analytics, v1/chat
│   ├── settings-api.ts       # v1/settings
│   └── utils.ts              # cn() etc.
├── hooks/                    # Shared hooks
├── public/                   # Static assets
├── .env                     # NEXT_PUBLIC_API_URL
├── next.config.mjs
├── tailwind.config.*
└── tsconfig.json
```

---

## Architecture

### Routing & Layout

- **App Router**: All pages live under `app/` with file-based routing.
- **Root layout** (`app/layout.tsx`): Wraps the app with dark theme, Geist fonts, global styles, and a fixed top **Navigation** bar. Main content is below the nav (`pt-20`).
- **Navigation** (`components/navigation.tsx`): Client component with links to `/chats`, `/dashboard`, `/settings`. Highlights the active route.

### Pages & Features

| Route | Purpose | Key behavior |
|-------|--------|---------------|
| `/` | Landing | Hero, feature grid, CTAs to Chats / Dashboard. |
| `/chats` | Chats | Request cards (username, query, priority); Submit / Submit All; **Chat History** button opens history view. |
| `/chats` (history) | Chat History | List of past chats (username, query, response, priority) from `GET /v1/chat`; back arrow returns to cards. |
| `/dashboard` | Dashboard | Summary cards (totals, high/medium/low priority); line chart (request count over time); pie chart (priority distribution). Data from `GET /v1/analytics`. |
| `/settings` | Settings | API key section; threshold section (High / Medium / Low: token limit, max latency). Saves via `PUT /v1/settings`. |

### Data Flow & API Layer

- **Base URL**: `process.env.NEXT_PUBLIC_API_URL` (default `http://localhost:8000`). Set in `.env`.
- **`lib/chat-api.ts`**:
  - **POST `/v1/query`** — Submit a single request (username, request_id, prompt, priority). Returns generation response (text, tokens_used, latency_ms, etc.).
  - **GET `/v1/analytics`** — Fetch analytics for the dashboard (total_requests, high/medium/low_priority, request_count_over_time, priority_distribution).
  - **GET `/v1/chat`** — Fetch chat history. Expects `{ chats: [...] }`; each item has `request` (username, prompt, priority) and `response` (text). Mapped to a flat list for the UI.
- **`lib/settings-api.ts`**:
  - **PUT `/v1/settings`** — Partial update. Body can include `api_key`, `high_priority`, `medium_priority`, `low_priority`. Each priority is `{ tokens, latency }`. Only non-null fields are sent.

All API calls are made from client components via `fetch`. Errors are surfaced in the UI (banners / inline messages).

### Component Hierarchy (conceptual)

- **Home**: `page.tsx` → sections + links.
- **Chats**: `chats/page.tsx` → view state (home vs history). Home: `ChatCard` grid + header (Chat History, Submit All, Add Card). History: back button + `ChatHistoryItemCard` grid, data from `fetchChatHistory()`.
- **Dashboard**: `dashboard/page.tsx` → `useEffect` calls `fetchAnalytics()`; passes data to `SummaryCard`, `LineChartComponent`, `PieChartComponent`; shows loading/error.
- **Settings**: `settings/page.tsx` → `ApiConfigSection` (calls `putSettings({ api_key })` on save), `ThresholdSection` x3 (each calls `putSettings({ high_priority })` etc. on save). Single error banner for any settings failure.

### Styling & Theming

- **Dark theme** by default (`className="dark"` on `<html>`).
- **Tailwind**: `background`, `foreground`, `card`, `border`, `muted`, `primary`, `destructive` etc. used for a consistent monochrome look.
- **Patterns**: Rounded corners (`rounded-2xl`), light borders (`border-border/30`), hover states, minimal shadows.

---

## Backend API Contract (summary)

The frontend expects the following endpoints and shapes. Backend must be running and CORS must allow the frontend origin.

| Method | Endpoint | Request / Response |
|--------|----------|--------------------|
| **POST** | `/v1/query` | Body: `{ username, request_id, prompt, created_at, priority }`. Response: `{ request_id, username, text, tokens_used, latency_ms, created_at, completed_at }`. |
| **GET** | `/v1/analytics` | Response: `{ total_requests, high_priority, medium_priority, low_priority, request_count_over_time: [{ date, count }], priority_distribution: [{ name, value }] }`. At least 2 time-series points recommended for the line chart. |
| **GET** | `/v1/chat` | Response: `{ chats: [{ timestamp?, request: { username, request_id, prompt, created_at, priority }, response: { request_id, username, text, ... } }], count? }`. |
| **PUT** | `/v1/settings` | Body (all optional): `{ api_key?, high_priority?: { tokens, latency }, medium_priority?, low_priority? }`. Partial updates supported. |

---

## Getting Started

### Prerequisites

- Node.js (LTS)
- pnpm (or npm / yarn)

### Install

```bash
pnpm install
```

### Environment

Create a `.env` (or `.env.local`) in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Replace with your backend base URL if different.

### Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Ensure the backend is running and reachable at `NEXT_PUBLIC_API_URL`.

### Build & Start

```bash
pnpm build
pnpm start
```

### Lint

```bash
pnpm lint
```

---

## Implementation Notes

- **Chats**: Each card has local state; submitting uses `POST /v1/query` with a new `request_id`. Chat History is a separate view that fetches `GET /v1/chat` when opened.
- **Dashboard**: Analytics are fetched once on mount. Line chart uses `dataKey="date"` and formats dates for the x-axis; pie chart uses `priority_distribution` or falls back to high/medium/low counts.
- **Settings**: No GET settings endpoint; form state is local until save. Each save (API key or one threshold) sends only the changed field(s) in the PUT body.

---

## License & Meta

- **Project name**: my-v0-project (see `package.json`)
- **Description**: Modern SaaS frontend with request management and analytics (see layout metadata)
- Icons and assets in `public/`; favicon and apple icon configured in `app/layout.tsx`.
