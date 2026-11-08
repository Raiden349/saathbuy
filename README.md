# SaathBuy

SaathBuy is a campus group-buying web app. Students join together to get lower prices and collect orders at a campus pickup point.

## Local setup

1. Install Node.js 20.9 or newer.
2. Copy `.env.example` to `.env.local` and fill in the Supabase and application values.
3. Install dependencies with `npm install`.
4. Start the app with `npm run dev` and open `http://localhost:3000`.

The Supabase service role key is server-only. Never expose it to browser code or commit `.env.local`.

## Environment variables

See `.env.example` for the full list. The app shell can render before Supabase is configured; database features require the corresponding values.

## Deploy

Import the GitHub repository into Vercel, add the environment variables from `.env.example` in the project settings, and deploy the `main` branch. Set `NEXT_PUBLIC_SITE_URL` to the deployed site URL.
