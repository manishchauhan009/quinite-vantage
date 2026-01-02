# Copilot / AI Agent Instructions — Vantage (Next.js + Supabase)

This file contains focused, actionable guidance for AI coding agents working in this repository.
Keep edits minimal and reference the exact files below for examples.

1. Big picture
- Frontend: Next.js App Router (Next 16+) in the `app/` folder — UI is shadcn + Radix-based components under `components/ui/`.
- Backend: Next.js API surface is implemented in a single catch-all route: [app/api/[[...path]]/route.js](app/api/[[...path]]/route.js). Treat this file as the canonical HTTP API router.
- Auth & DB: Supabase (Postgres) is the primary DB/auth provider. Server and browser clients live in `lib/supabase/*`.
- Permissions/Audit: Role/feature permissions and audit logging are implemented in `lib/permissions.js` and enforced from the API route.

2. Key files to read before making changes
- `lib/supabase/server.js` — how server-side supabase client is created (uses Next cookies).
- `lib/supabase/admin.js` — SERVICE ROLE client; NEVER expose to client-side code. Use only in server code and API routes.
- `app/api/[[...path]]/route.js` — single place for API endpoint behavior and permission checks.
- `lib/permissions.js` — permission check helpers (`hasPermission`, `getUserPermissions`) and `logAudit`.
- `database/schema.sql` — canonical DB schema and RLS policies; use Supabase SQL Editor for migrations.

3. Environment & dev commands
- Required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Start dev: run `yarn install` then `yarn dev` (see `package.json` scripts).
- Build: `yarn build` then `yarn start` for production-like run.

4. Project-specific conventions and gotchas
- API routing: All API requests funnel through `app/api/[[...path]]/route.js`. Add/modify handlers there (GET/POST/OPTIONS already implemented). Follow its path-parsing pattern.
- Permission checks: Use `hasPermission(supabase, userId, 'feature.name')` from `lib/permissions.js`. Platform admins are short-circuited in these helpers.
- Admin client usage: Use `createAdminClient()` from `lib/supabase/admin.js` only in server code — it bypasses RLS. If you need cross-organization operations, use it but add explicit logging/audit calls.
- Cookie handling: Server client reads Next cookies via `cookies()` in `lib/supabase/server.js` — mirror that pattern when adding server-side auth-sensitive code.
- Database changes: The project expects you to run SQL via Supabase UI (see README). Do not assume automated migrations; update `database/` SQL files and document steps in PR.

5. Testing & debugging tips
- No unit test suite is present; manual testing is done via `yarn dev` and hitting API routes.
- For API debugging, log errors in `app/api/[[...path]]/route.js` (already logs) and check Supabase logs for DB errors.
- To simulate elevated actions locally, set `SUPABASE_SERVICE_ROLE_KEY` in your env and call server-side admin functions — but never commit service keys.

6. Code-style & patterns to follow
- Small, single-responsibility helpers in `lib/` (see `lib/permissions.js`) — follow same error handling style (try/catch, console.error, safe fallback).
- UI components are wrapped as shadcn-style components in `components/ui/`. Reuse existing components rather than creating new raw markup.
- API responses use NextResponse JSON and a small CORS helper in the router — continue that convention.

7. Integration points to watch
- Supabase: auth, RLS, triggers (automatic profile creation) — see `database/schema.sql` for triggers and RLS policies.
- External libs: `mongodb` is listed in `package.json` and `next.config.mjs` lists `mongodb` in `serverExternalPackages`. If you add server packages, update `next.config.mjs` accordingly.
- Images: `next.config.mjs` sets `images.unoptimized = true` — image hosting/optimization may be handled external to Next.

8. PR & commit guidance for AI edits
- Keep changes scoped to feature/bugfix. If touching DB schema, include SQL in `database/` and explicit migration instructions in PR description.
- When adding server code that uses the admin client, include a short justification and audit/logging call.
- Update README or inline file comments for any non-obvious setup changes (env, external service URLs).

If anything above is unclear or you want more examples (small PR-ready diffs), tell me which area to expand (API, auth, DB, or UI) and I'll iterate.
