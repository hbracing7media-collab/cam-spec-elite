## Repository-specific instructions for AI coding agents

This project is a Next.js app that uses Supabase (Postgres + Storage). The important, discoverable integration points follow.

- **Key environment variables**: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (server-only). See `app/api/cams/submit/route.ts` for usage.

- **Primary server route to match**: `app/api/cam-submit/route.ts` (handles multipart/form-data uploads). It expects `multipart/form-data` POSTs and uploads files to Supabase storage buckets.

- **Database table to use**: `cse_cam_submissions_table` (see migration at `migrations/001_create_cse_cam_submissions_table.sql`). Use the table schema in that file when writing queries or migrations.

- **Storage buckets (names used by code)**:
  - `cam_cards` — stores cam-card files.
  - `dyno_sheets` — stores dyno sheet files.

- **File path conventions** (constructed in `app/api/cam-submit/route.ts`):
  - `id` is a UUID created server-side.
  - `folder` = `user_id/id` if `user_id` is provided, otherwise `id`.
  - `safeBase` = sanitized `brand-part_number-cam_name` (max ~120 chars).
  - Cam-card path: `${folder}/${safeBase}-cam-card.{ext}` (e.g. `123/550e8400-e29b-41d4-a716-446655440000/Brand-123-MyCam-cam-card.jpg`).
  - Dyno sheet path(s): `${folder}/${safeBase}-dyno-<n>-<safeName>` (e.g. `id/Brand-...-dyno-1-sheet1.png`).

- **Column expectations** (see migration):
  - `cam_card_path` is stored as text.
  - `dyno_paths` is JSONB (array of strings) or `NULL`.
  - `spec` stores the full parsed payload as JSONB for auditing.

- **Testing uploads**: emulate a multipart POST (fields accept snake_case or camelCase). Minimal curl example:

```bash
curl -v -X POST "http://localhost:3000/api/cam-submit" \
  -F "cam_name=My Cam" \
  -F "brand=BrandX" \
  -F "part_number=PN123" \
  -F "engine_make=Ford" \
  -F "engine_family=ModX" \
  -F "cam_card=@./fixtures/cam-card.jpg;type=image/jpeg" \
  -F "dyno_sheets[]=@./fixtures/dyno1.pdf;type=application/pdf"
```

- **Supabase bucket creation**: use the Supabase CLI or dashboard. Example (Supabase CLI):

```bash
supabase storage create-bucket cam_cards --public
supabase storage create-bucket dyno_sheets --public
```

If you can't run the CLI, create buckets via the Supabase project dashboard and set appropriate ACLs.

- **When editing server routes**: prefer server-side `createClient` with the service role key as shown in `app/api/cam-submit/route.ts`. Keep `auth: { persistSession: false }` for ephemeral admin calls.

- **Error handling & responses**: API returns JSON shape `{ ok: boolean, message?: string, ... }`. When writing new endpoints follow the same pattern and HTTP status conventions.

- **Where to look for related code**:
  - `app/api/cam-submit/route.ts` — main upload handler (fields, sanitization, storage paths).
  - `lib/supabaseClient.ts` and `lib/auth.ts` — general auth/supabase helpers used elsewhere.
  - `public/` and `storage/` — static and storage directory names referenced by app.

If anything above is unclear or you need additional integration examples (e.g., serverless function tests, more migration SQL, or a PostgREST policy example), tell me which area to expand.
