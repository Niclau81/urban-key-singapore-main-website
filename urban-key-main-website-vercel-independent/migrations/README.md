# Private user-data migration

The actual user-record export is intentionally delivered as a separate attachment named `urban-key-user-data-migration.json`. It is **not** in this directory and must not be committed, deployed, or copied into `public/`.

Create each account in Supabase Auth first. Then use the returned UUID to create the matching `public.profiles` row. The independent application deliberately does not import the previous managed-platform sign-in identifier, sessions, tokens, payment identifiers, or other credentials.
