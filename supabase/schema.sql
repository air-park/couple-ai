-- ============================================================
-- couple-ai v1 schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Auto-create user profile on OAuth signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.users (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ── Users ───────────────────────────────────────────────────
create table if not exists public.users (
  id           uuid references auth.users(id) on delete cascade primary key,
  email        text,
  display_name text,
  avatar_url   text,
  tier         text not null default 'free' check (tier in ('free', 'paid')),
  created_at   timestamptz default now(),
  last_active_at timestamptz default now()
);

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Relationships ───────────────────────────────────────────
create table if not exists public.relationships (
  id                uuid default gen_random_uuid() primary key,
  owner_user_id     uuid references public.users(id) on delete cascade not null,
  relationship_type text default 'dating' check (relationship_type in ('dating', 'married', 'cohabiting', 'other')),
  nickname          text,                  -- 예: "남자친구와", "우리 관계"
  partner_name      text,
  status            text default 'active' check (status in ('active', 'paused', 'ended')),
  created_at        timestamptz default now()
);

-- ── Conversation Sessions ───────────────────────────────────
create table if not exists public.conversation_sessions (
  id              uuid default gen_random_uuid() primary key,
  relationship_id uuid references public.relationships(id) on delete set null,
  user_id         uuid references public.users(id) on delete set null,
  input_type      text not null check (input_type in ('text', 'image')),
  raw_input       text,
  status          text default 'draft' check (status in (
    'draft', 'uploaded', 'extracted', 'confirmed',
    'analyzing', 'analyzed', 'closed'
  )),
  created_at      timestamptz default now(),
  analyzed_at     timestamptz
);

-- ── Messages ────────────────────────────────────────────────
create table if not exists public.messages (
  id             uuid default gen_random_uuid() primary key,
  session_id     uuid references public.conversation_sessions(id) on delete cascade not null,
  speaker_label  text not null,
  original_text  text not null,
  source_type    text default 'typed' check (source_type in ('typed', 'extracted')),
  message_order  integer not null,
  ocr_confidence real,
  created_at     timestamptz default now()
);

-- ── Extracted Contents (OCR) ────────────────────────────────
create table if not exists public.extracted_contents (
  id               uuid default gen_random_uuid() primary key,
  session_id       uuid references public.conversation_sessions(id) on delete cascade not null,
  ocr_raw          text not null,
  user_edited      text not null,
  extraction_model text default 'gpt-4o-mini',
  created_at       timestamptz default now(),
  constraint extracted_contents_session_unique unique (session_id)
);

-- ── Analysis Results ────────────────────────────────────────
-- (session can have both free + paid results)
create table if not exists public.analysis_results (
  id                     uuid default gen_random_uuid() primary key,
  session_id             uuid references public.conversation_sessions(id) on delete cascade not null,
  tier                   text not null check (tier in ('free', 'paid')),
  model_used             text not null,
  persona_results        jsonb not null,  -- array of persona objects
  misunderstanding       text,            -- paid only
  final_mediator_comment text,            -- paid only
  created_at             timestamptz default now(),
  constraint analysis_results_session_tier_unique unique (session_id, tier)
);

create index if not exists idx_analysis_results_session
  on public.analysis_results(session_id);

-- ── Payments ────────────────────────────────────────────────
create table if not exists public.payments (
  id                uuid default gen_random_uuid() primary key,
  user_id           uuid references public.users(id) on delete set null,
  session_id        uuid references public.conversation_sessions(id) on delete set null,
  toss_payment_key  text unique,
  toss_order_id     text unique not null,
  amount            integer not null,
  status            text default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled')),
  payment_method    text,
  paid_at           timestamptz,
  created_at        timestamptz default now()
);

-- ── Follow-ups ──────────────────────────────────────────────
create table if not exists public.followups (
  id                      uuid default gen_random_uuid() primary key,
  session_id              uuid references public.conversation_sessions(id) on delete cascade not null,
  outcome                 text check (outcome in ('resolved', 'ongoing', 'worsened', 'unknown')),
  user_action_taken       text,
  current_emotional_state text,
  ai_response             text,
  created_at              timestamptz default now()
);

-- ── Memory Summaries ────────────────────────────────────────
create table if not exists public.memory_summaries (
  id                uuid default gen_random_uuid() primary key,
  relationship_id   uuid references public.relationships(id) on delete cascade not null,
  recurring_topics  text[] default '{}',
  a_patterns        text,
  b_patterns        text,
  frequent_triggers text[] default '{}',
  session_count     integer default 0,
  resolution_rate   real,
  summary_text      text,
  last_updated      timestamptz default now(),
  constraint memory_summaries_relationship_unique unique (relationship_id)
);

-- ── Knowledge Cards (RAG precursor) ─────────────────────────
create table if not exists public.knowledge_cards (
  id        uuid default gen_random_uuid() primary key,
  title     text not null,
  principle text not null,
  example   text,
  category  text,
  tags      text[] default '{}',
  active    boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
alter table public.users enable row level security;
alter table public.relationships enable row level security;
alter table public.conversation_sessions enable row level security;
alter table public.messages enable row level security;
alter table public.extracted_contents enable row level security;
alter table public.analysis_results enable row level security;
alter table public.payments enable row level security;
alter table public.followups enable row level security;
alter table public.memory_summaries enable row level security;
alter table public.knowledge_cards enable row level security;

-- Users
create policy "users_own" on public.users
  for all using (auth.uid() = id);

-- Relationships
create policy "relationships_own" on public.relationships
  for all using (auth.uid() = owner_user_id);

-- Sessions: own data OR anonymous (user_id is null)
create policy "sessions_own" on public.conversation_sessions
  for all using (auth.uid() = user_id or user_id is null);

-- Messages, Extracted, Results: via session ownership
create policy "messages_via_session" on public.messages
  for all using (
    exists (
      select 1 from public.conversation_sessions s
      where s.id = session_id and (s.user_id = auth.uid() or s.user_id is null)
    )
  );

create policy "extracted_via_session" on public.extracted_contents
  for all using (
    exists (
      select 1 from public.conversation_sessions s
      where s.id = session_id and (s.user_id = auth.uid() or s.user_id is null)
    )
  );

create policy "results_via_session" on public.analysis_results
  for all using (
    exists (
      select 1 from public.conversation_sessions s
      where s.id = session_id and (s.user_id = auth.uid() or s.user_id is null)
    )
  );

-- Payments: own only
create policy "payments_own" on public.payments
  for all using (auth.uid() = user_id);

-- Followups: via owned session
create policy "followups_via_session" on public.followups
  for all using (
    exists (
      select 1 from public.conversation_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- Memory: via owned relationship
create policy "memory_via_relationship" on public.memory_summaries
  for all using (
    exists (
      select 1 from public.relationships r
      where r.id = relationship_id and r.owner_user_id = auth.uid()
    )
  );

-- Knowledge cards: public read
create policy "knowledge_cards_public_read" on public.knowledge_cards
  for select using (active = true);
