-- Hardening pass from the security advisors (already applied to project
-- iknjmeatyxzrwtejbwvm as migration "course_review_hardening"):
-- 1) pin search_path on the two remaining functions;
-- 2) take the RLS helper functions out of reach of anonymous API callers.
--    `authenticated` keeps EXECUTE because RLS policies evaluate these
--    functions as the querying role.

alter function public.review_jwt_email() set search_path = public;
alter function public.review_try_uuid(text) set search_path = public;

revoke execute on function public.review_is_admin() from public, anon;
revoke execute on function public.review_has_access(uuid) from public, anon;
revoke execute on function public.review_can_see_file(uuid) from public, anon;
revoke execute on function public.review_owns_comment(uuid) from public, anon;
revoke execute on function public.review_jwt_email() from public, anon;
revoke execute on function public.review_try_uuid(text) from public, anon;

grant execute on function public.review_is_admin() to authenticated, service_role;
grant execute on function public.review_has_access(uuid) to authenticated, service_role;
grant execute on function public.review_can_see_file(uuid) to authenticated, service_role;
grant execute on function public.review_owns_comment(uuid) to authenticated, service_role;
grant execute on function public.review_jwt_email() to authenticated, service_role;
grant execute on function public.review_try_uuid(text) to authenticated, service_role;
