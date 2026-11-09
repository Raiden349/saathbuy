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

## Phase 5

- Keep server-side deal-join RPCs as the only write path for joins and cancellations. The browser submits choices; the SQL function validates balances, quantities, deadlines, wallet references, and final points updates.
- Keep the 30-day referral ID in an HttpOnly, same-site cookie set only from a valid deal-detail `ref` UUID.
- Show payment estimates from the active tier, with no external payment processing in v1.

## Phase 6

- Sign pickup QR payloads with a server-only HMAC; verify signatures before looking up a join or calling the collection RPC.
- Keep camera access behind an explicit start action and offer the full QR URL as a manual fallback.
- Use the existing `mark_delivered` and `collect_join` database RPCs for admin collection, preserving the database as the authority for payment, points, and deal completion.
- Close expired deals through the existing lazy close function, with a daily authenticated Vercel cron as a backup.

## Phase 7

- Keep rewards, streak, and free-fee credit balances sourced from the existing protected profile and points ledger data; the join RPC remains authoritative for credit use and streak updates.
- Build referral URLs from the configured site origin and the signed-in user's ID. Count referred joins with the server-only service role, filtering by the authenticated user's ID and the current deal.
- Let authenticated students create product requests and toggle their own votes under the existing row-level security policies; calculate and sort vote totals on the server.
