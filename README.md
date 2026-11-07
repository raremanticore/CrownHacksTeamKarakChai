# Volo

Volo is a Vite + HTML/CSS/vanilla JavaScript volunteer discovery app for finding local events and learning how to help. Event discovery is available at the `/discovery` route.

## Run locally

The app ships with curated demo events so it works immediately. To connect a Supabase project, run `supabase/schema.sql` in the SQL editor, seed the `events` table, and copy `.env.example` to `.env.local` with:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Vercel detects the Vite build automatically. Use `npm run build` to create the production bundle.
