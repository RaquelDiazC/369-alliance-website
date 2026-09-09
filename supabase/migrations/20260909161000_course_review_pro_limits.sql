-- Pro plan limits (already applied to project iknjmeatyxzrwtejbwvm; kept here
-- as the versioned source): real course videos are 200-700 MB each, so the
-- per-file cap moves from 50 MB to 2 GB. The org was upgraded to Supabase Pro
-- (100 GB file storage included; Pro projects never auto-pause).
--
-- NOTE: the project-wide "Upload file size limit" (Dashboard -> Project
-- Settings -> Storage) must also be raised to 2 GB — it caps every upload
-- regardless of the bucket setting and is not configurable via SQL.
update storage.buckets
  set file_size_limit = 2147483648 -- 2 GB
  where id = 'course-review-pdfs';
