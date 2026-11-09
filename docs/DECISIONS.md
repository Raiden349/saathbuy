# Decisions

## Phase 1

- Use Tailwind CSS v4 and its `@theme` block for the exact brand tokens.
- Keep the Home screen as a quiet shell until deal data is added in Phase 4.
- Keep tab links available now; routes arrive in their assigned phases.
- Use the provided brand and icon assets in their specified public folders.
- Keep Supabase client factories lazy so local shell rendering does not require environment values.
- Use Next.js Webpack for production builds because the Turbopack CSS worker exits in this Windows build environment.

## Phase 2

- Store streak week keys using the Asia/Karachi ISO calendar week, which matches the campus-facing time zone.
- Seed pickup times at 4:00 pm Asia/Karachi and store them as `timestamptz` values.
- Make the seed safe to run again by skipping existing pickup points, deals, and deal-cost rows.
- Restrict profile updates with PostgreSQL column grants so users cannot change balance, admin, credit, or streak fields.

## Phase 4

- Read deals through the anon/authenticated Supabase client and close expired deals lazily before Home and detail reads.
- Only optimize deal images from the configured Supabase project's public Storage path; missing or unsupported URLs stay on the category tile.
- Render a stable "Deadline" label until the countdown hydrates in the browser to avoid server/client clock mismatches.
