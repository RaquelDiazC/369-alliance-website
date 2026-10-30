-- Video lessons (already applied to project iknjmeatyxzrwtejbwvm as migration
-- "course_review_video_support"; kept here as the versioned source):
-- files can now be MP4 videos; comments on a video are anchored to a playback
-- timestamp (time_seconds) instead of a page.
alter table public.review_files
  add column if not exists kind text not null default 'pdf',
  add column if not exists duration_seconds double precision;

alter table public.review_files
  drop constraint if exists review_files_kind_check;
alter table public.review_files
  add constraint review_files_kind_check check (kind in ('pdf', 'video'));

alter table public.review_comments
  add column if not exists time_seconds double precision;

-- The private bucket now also accepts MP4 uploads (same 50 MB limit).
update storage.buckets
  set allowed_mime_types = array['application/pdf', 'video/mp4']
  where id = 'course-review-pdfs';
