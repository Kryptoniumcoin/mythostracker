# Local Deployment Guide — Baby Brezza Price Monitor

## Prerequisites

- **Node.js 18+** and **npm/bun**
- **Supabase CLI** (`brew install supabase/tap/supabase`)
- **OpenClaw** running locally on your Mac Mini

## 1. Clone & Install

```bash
git clone <your-repo-url>
cd baby-brezza-price-monitor
npm install
```

## 2. Configure Supabase Locally

```bash
supabase start
```

This starts a local Supabase instance (Postgres, Auth, Edge Functions, etc.).

## 3. Set Environment Variables for Edge Functions

Create a file `supabase/.env.local` with your OpenClaw configuration:

```env
# Point to your local OpenClaw instance
AI_BASE_URL=http://host.docker.internal:7331/v1
AI_MODEL=chatgpt-codex-5.4
AI_API_KEY=your-openclaw-oauth-token-here

# Firecrawl API key for web scraping
FIRECRAWL_API_KEY=your-firecrawl-key-here
```

> **Note:** Use `host.docker.internal` instead of `localhost` because Supabase
> edge functions run inside Docker. This resolves to your Mac's localhost.

## 4. Serve Edge Functions Locally

```bash
supabase functions serve --env-file supabase/.env.local
```

This starts the edge functions server at `http://localhost:54321/functions/v1/`.

## 5. Configure the Frontend

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

> The publishable key above is the default local Supabase anon key.

## 6. Start the Frontend

```bash
npm run dev
```

Open `http://localhost:5173` and click **Scan Prices**.

## Environment Variables Reference

| Variable | Description | Example |
|---|---|---|
| `AI_BASE_URL` | OpenAI-compatible API base URL | `http://host.docker.internal:7331/v1` |
| `AI_MODEL` | Model identifier to use | `chatgpt-codex-5.4` |
| `AI_API_KEY` | API key or OAuth token (skip for no-auth local) | `your-token` |
| `FIRECRAWL_API_KEY` | Firecrawl API key for scraping | `fc-xxx` |

## Updating the OAuth Token

If your OpenClaw OAuth token expires, update it in `supabase/.env.local` and restart:

```bash
# Stop with Ctrl+C, then:
supabase functions serve --env-file supabase/.env.local
```

## Troubleshooting

- **"Connection refused"**: Make sure OpenClaw is running at port 7331 and use `host.docker.internal` not `localhost`
- **"401 Unauthorized"**: Your OAuth token may have expired — refresh it in `.env.local`
- **Scraping fails**: Ensure your Firecrawl API key is valid and has credits
