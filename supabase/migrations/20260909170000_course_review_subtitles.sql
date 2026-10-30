-- Subtitles for video lessons (already applied to project iknjmeatyxzrwtejbwvm
-- as migration "course_review_subtitles"; kept here as the versioned source):
-- each video can carry one sidecar WebVTT file, stored in the same private
-- bucket as <course_id>/<file_id>-sub-<ts>.vtt. SRT uploads are converted to
-- VTT client-side before storage.
alter table public.review_files
  add column if not exists subtitle_path text;

update storage.buckets
  set allowed_mime_types = array['application/pdf', 'video/mp4', 'text/vtt']
  where id = 'course-review-pdfs';
