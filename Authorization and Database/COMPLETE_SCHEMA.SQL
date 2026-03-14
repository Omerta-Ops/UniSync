```sql

-- 1. PROFILES TABLE (Stores student identity)
create table if not exists public.profiles (
  id text primary key,           -- Firebase UID
  email text not null,
  full_name text,
  roll_number text,              -- Extracted from email
  university_domain text,        -- e.g., krmu.edu.in
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. CONNECTED_ACCOUNTS TABLE (Stores OAuth tokens)
create table if not exists public.connected_accounts (
  id uuid default gen_random_uuid() primary key,
  user_id text references public.profiles(id) on delete cascade not null,
  provider text not null,        -- 'google' or 'microsoft'
  email_address text,            -- The email from the provider
  access_token text,
  refresh_token text,
  expires_at bigint,             -- Token expiration timestamp
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure one provider account per user
  unique(user_id, provider)
);

-- 3. ATTACHMENTS TABLE (Stores uploaded files)
create table if not exists public.attachments (
  id uuid default gen_random_uuid() primary key,
  user_id text references public.profiles(id) on delete cascade not null,
  file_name text not null,
  file_type text,                -- e.g., 'pdf', 'jpg'
  storage_path text not null,    -- Path in Supabase Storage bucket
  bucket_id text default 'unisync-files',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. ENABLE RLS (Security Best Practice)
alter table public.profiles enable row level security;
alter table public.connected_accounts enable row level security;
alter table public.attachments enable row level security;

-- 5. BASIC POLICIES (Allow Service Role full access, restrict public)
-- Since your backend uses the SERVICE_ROLE key, it bypasses these policies.
-- These are placeholders for when you add frontend direct access later.

create policy "Service Role has full access" on public.profiles for all using (true);
create policy "Service Role has full access" on public.connected_accounts for all using (true);
create policy "Service Role has full access" on public.attachments for all using (true);

```
