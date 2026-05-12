# CreatorStudio — YouTube AI Generator

AI-powered YouTube content studio: paste a video link or describe a topic to generate 10 optimized titles, a full SEO description, tags, and 5–8 thumbnail variations.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/yt-ai-generator run dev` — run the frontend (port 21533)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TailwindCSS, shadcn/ui, TanStack Query, wouter, JSZip
- API: Express 5, OpenAI SDK
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod validation schemas
- `artifacts/api-server/src/routes/youtube.ts` — YouTube Data API fetching
- `artifacts/api-server/src/routes/generate.ts` — OpenAI content + thumbnail generation, Replicate Flux
- `artifacts/yt-ai-generator/src/pages/home.tsx` — main single-page UI

## Architecture decisions

- Contract-first: OpenAPI spec drives both server Zod validation and client React Query hooks via Orval codegen
- Thumbnail generation tries Replicate Flux (higher quality) first, falls back to DALL-E 3 automatically
- `POST /api/generate/all` runs content + thumbnail generation in parallel on the backend for speed
- Config status endpoint (`GET /api/config/status`) lets frontend show which features are active without exposing key values

## Product

- Paste a YouTube URL → fetch real video metadata via YouTube Data API → generate 10 titles, SEO description, 20 tags, 5–8 thumbnail concepts
- Manual mode: enter topic, description, style, and target audience directly
- Results in tabbed layout: Titles (with Top Pick badges + copy), Description & Tags (editable textarea + pill badges), Thumbnails (image grid + individual download + ZIP download)
- Regenerate individual sections independently
- Dark/light mode toggle
- Config notice banner if any API key is missing

## Required Secrets

- `OPENAI_API_KEY` — GPT-4o for content + DALL-E 3 for thumbnails (required)
- `YOUTUBE_API_KEY` — YouTube Data API v3 for video metadata fetching (required for URL mode)
- `REPLICATE_API_KEY` — Flux Schnell for higher-quality thumbnails (optional; falls back to DALL-E)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Thumbnail generation can take 30–60 seconds (DALL-E 3 is sequential per image)
- Replicate uses `Prefer: wait` header for synchronous responses — no polling needed
- Always run codegen after changing `openapi.yaml`: `pnpm --filter @workspace/api-spec run codegen`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
