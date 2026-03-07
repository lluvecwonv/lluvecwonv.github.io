# Chaewon's Website

https://lluvecwonv.github.io/

## Supabase setup

1. Copy `.env.example` to `.env.local`.
2. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project.
3. Run the SQL in [schema.sql](/Users/yoonnchaewon/.codex/worktrees/ce88/my_site/supabase/schema.sql) in the Supabase SQL editor.
4. Create one admin user in Supabase Auth and set `VITE_ADMIN_EMAIL` to that email.

When Supabase env vars are present:
- blog posts are read from `posts`
- travel spots are read from `travel_spots`
- admin login uses Supabase email/password auth

When Supabase is not configured:
- blog posts fall back to local markdown files in `src/posts`
- travel spots fall back to browser `localStorage`
