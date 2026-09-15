-- Device lock (already applied to project iknjmeatyxzrwtejbwvm as migration
-- "course_review_device_lock"; kept here as the versioned source):
-- each reviewer account is bound to the first device that signs in. The edge
-- function (service role) registers/validates the device id; the admin can
-- clear it so the person can move to a new computer.
alter table public.review_reviewers
  add column if not exists device_id text,
  add column if not exists device_registered_at timestamptz,
  add column if not exists last_seen_ip text;
