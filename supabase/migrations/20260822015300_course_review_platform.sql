-- Course Review Platform: schema, RLS and storage
-- (already applied to project iknjmeatyxzrwtejbwvm as migration
--  "course_review_platform_schema"; kept here as the versioned source)
--
-- Admin: emails listed in review_admins (seeded below).
-- Reviewers: identified by email; access is granted per course folder.
-- Comments are keyed by author_email so removing access never deletes comments.

create table if not exists public.review_admins (
  email text primary key,
  created_at timestamptz not null default now()
);
insert into public.review_admins (email) values ('raqueldiaz@raqueldiaz.com.br')
  on conflict do nothing;

create table if not exists public.review_courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.review_files (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.review_courses(id) on delete cascade,
  name text not null,
  storage_path text not null,
  page_count int not null default 0,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists review_files_course_idx on public.review_files (course_id, position);

-- Registry of invited reviewers. access_code doubles as their sign-in code and
-- is visible to the admin only (so it can be re-shared with the colleague).
create table if not exists public.review_reviewers (
  email text primary key,
  display_name text,
  access_code text,
  created_at timestamptz not null default now()
);

create table if not exists public.review_access (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.review_courses(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  unique (course_id, email)
);
create index if not exists review_access_email_idx on public.review_access (email);

create table if not exists public.review_comments (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.review_files(id) on delete cascade,
  page_number int not null,
  author_email text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists review_comments_file_page_idx on public.review_comments (file_id, page_number);
create index if not exists review_comments_author_idx on public.review_comments (author_email);

create table if not exists public.review_replies (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.review_comments(id) on delete cascade,
  author_email text not null,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists review_replies_comment_idx on public.review_replies (comment_id);

-- ---------- helper functions (security definer so RLS checks can consult
-- ---------- admin/access tables without recursive RLS) ----------

create or replace function public.review_jwt_email() returns text
language sql stable
as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

create or replace function public.review_is_admin() returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.review_admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$$;

create or replace function public.review_has_access(cid uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.review_access
    where course_id = cid
      and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$$;

create or replace function public.review_can_see_file(fid uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.review_files f
    where f.id = fid
      and (public.review_is_admin() or public.review_has_access(f.course_id))
  )
$$;

create or replace function public.review_owns_comment(cid uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.review_comments c
    where c.id = cid
      and lower(c.author_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$$;

create or replace function public.review_try_uuid(t text) returns uuid
language plpgsql immutable
as $$
begin
  return t::uuid;
exception when others then
  return null;
end $$;

-- ---------- row level security ----------

alter table public.review_admins enable row level security;
alter table public.review_courses enable row level security;
alter table public.review_files enable row level security;
alter table public.review_reviewers enable row level security;
alter table public.review_access enable row level security;
alter table public.review_comments enable row level security;
alter table public.review_replies enable row level security;

create policy "own admin row" on public.review_admins
  for select to authenticated using (lower(email) = public.review_jwt_email());

create policy "courses select" on public.review_courses
  for select to authenticated
  using (public.review_is_admin() or public.review_has_access(id));
create policy "courses admin write" on public.review_courses
  for all to authenticated
  using (public.review_is_admin()) with check (public.review_is_admin());

create policy "files select" on public.review_files
  for select to authenticated
  using (public.review_is_admin() or public.review_has_access(course_id));
create policy "files admin write" on public.review_files
  for all to authenticated
  using (public.review_is_admin()) with check (public.review_is_admin());

create policy "reviewers admin all" on public.review_reviewers
  for all to authenticated
  using (public.review_is_admin()) with check (public.review_is_admin());

create policy "access admin all" on public.review_access
  for all to authenticated
  using (public.review_is_admin()) with check (public.review_is_admin());

-- A reviewer only ever sees their own comments; the admin sees everything.
create policy "comments select own or admin" on public.review_comments
  for select to authenticated
  using (public.review_is_admin() or lower(author_email) = public.review_jwt_email());
create policy "comments insert own" on public.review_comments
  for insert to authenticated
  with check (
    lower(author_email) = public.review_jwt_email()
    and public.review_can_see_file(file_id)
  );
create policy "comments update own" on public.review_comments
  for update to authenticated
  using (lower(author_email) = public.review_jwt_email())
  with check (lower(author_email) = public.review_jwt_email());
create policy "comments delete own or admin" on public.review_comments
  for delete to authenticated
  using (public.review_is_admin() or lower(author_email) = public.review_jwt_email());

create policy "replies select admin or comment owner" on public.review_replies
  for select to authenticated
  using (public.review_is_admin() or public.review_owns_comment(comment_id));
create policy "replies insert admin" on public.review_replies
  for insert to authenticated
  with check (public.review_is_admin() and lower(author_email) = public.review_jwt_email());
create policy "replies delete admin" on public.review_replies
  for delete to authenticated using (public.review_is_admin());
create policy "replies update read state" on public.review_replies
  for update to authenticated
  using (public.review_is_admin() or public.review_owns_comment(comment_id))
  with check (public.review_is_admin() or public.review_owns_comment(comment_id));

-- Reviewers may only flip read_at (mark a message as read), never edit bodies.
revoke update on public.review_replies from authenticated;
grant update (read_at) on public.review_replies to authenticated;

-- ---------- storage: private bucket for course PDFs ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('course-review-pdfs', 'course-review-pdfs', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;

-- Objects are stored as <course_id>/<file_id>.pdf
create policy "review pdfs read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'course-review-pdfs'
    and (
      public.review_is_admin()
      or public.review_has_access(public.review_try_uuid((storage.foldername(name))[1]))
    )
  );
create policy "review pdfs admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'course-review-pdfs' and public.review_is_admin());
create policy "review pdfs admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'course-review-pdfs' and public.review_is_admin());
create policy "review pdfs admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'course-review-pdfs' and public.review_is_admin());
