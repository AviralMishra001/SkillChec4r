# AI-Powered Assessment Recommendation Engine

I built this because SHL has 130+ assessments and no easy way to figure out which ones actually fit a job description — you either know the catalog by heart or you're clicking through pages manually. This tries to fix that.

Paste in a job description (or a LinkedIn job URL), and it'll semantically match it against the SHL catalog and hand you back the most relevant assessments, ranked.

**Live app:** https://huggingface.co/spaces/Aviral45/SkillChec4r

## How it actually works

It's a two-stage pipeline, not just a single similarity search:

1. **Retrieval** — the job description gets embedded using `all-MiniLM-L6-v2` (via Xenova/transformers.js), and I compare that against precomputed embeddings for every assessment in the catalog using cosine similarity. This narrows 130+ assessments down to the top 15 candidates fast.
2. **Reranking** — those 15 go to Llama 3.1 (via OpenRouter) with a tight prompt that only lets it return index numbers, never assessment names — so it can't invent an assessment that doesn't exist. It picks the best 7.

If you paste a LinkedIn URL instead of raw text, there's an extra step before all this: the page gets fetched, cleaned up, and a separate LLM call pulls out just the job description from the noise.

## Tech stack

- **Next.js 14** (App Router) + TypeScript + Tailwind — frontend and backend live in the same app, no separate Express server
- **Xenova Transformers** for embeddings, run in-process, no external API call needed for this part
- **OpenAI SDK pointed at OpenRouter** for the LLM calls (Llama 3.1 8B) — cheaper than hitting OpenAI directly
- **CSV** as the data source — simple, version-controlled, fine for 130-ish rows
- Deployed as a **Docker container on Hugging Face Spaces**

## A few things I fixed after the first version

Early on, every cold container start meant re-running the embedding model over the whole catalog — slow, and wasteful if two requests hit a fresh container at the same time. Fixed that by precomputing embeddings once at Docker build time (`scripts/precomputeEmbeddings.ts`) and just loading the cached file at runtime, plus a shared init-promise so concurrent cold requests don't duplicate the work.

Also added: basic rate limiting (so one person can't spam the LLM calls and run up API costs), a domain allowlist on the URL-fetch step (so it can't be pointed at random internal/private URLs), a timeout on outgoing fetches, a small in-memory cache for repeated queries, and a fallback so that if the LLM reranking step fails, you still get results from the retrieval stage instead of a hard error.

## Getting started

```bash
npm install
```

Create `.env.local`:
```
OPENROUTER_API_KEY=your_key_here
```

Precompute the embeddings once (this is what the Docker build does automatically, but useful locally too):
```bash
npx tsx scripts/precomputeEmbeddings.ts
```

Run it:
```bash
npm run dev
```

Open `http://localhost:3000`.

## Project layout

```
├── app/
│   ├── api/recommend/      # the main endpoint
│   ├── page.tsx            # UI
│   └── layout.tsx
├── data/
│   ├── shl.csv              # the assessment catalog
│   └── embeddings.json      # precomputed vectors (generated, not hand-written)
├── lib/
│   ├── assessmentStore.ts   # retrieval logic
│   └── __tests__/
├── scripts/
│   └── precomputeEmbeddings.ts
└── Dockerfile
```

## What I'd still want to improve

I haven't formally measured recommendation quality (no Recall@k / labeled eval set yet) — right now I know it works from testing it myself against real job descriptions, but I want to build a proper eval set at some point. Also thought about swapping the CSV + in-memory vectors for a real vector DB if the catalog ever grows past a few hundred entries — not needed yet at this size.

## API

`POST /api/recommend` — send `{ "jobDescription": "..." }`, get back a ranked list of assessments.
