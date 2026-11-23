-- LuminaED: remove only the older GFE 306/307 records with no semester assigned.
-- This intentionally leaves semester-assigned records and all PDF/material links untouched.
-- Review the preview before executing the DELETE.
BEGIN;

SELECT id, course_code, course_title, faculty, department, level, semester, created_at
FROM public.courses
WHERE regexp_replace(upper(coalesce(course_code, '')), '[^A-Z0-9]', '', 'g') IN ('GFE306','GFE307')
  AND (semester IS NULL OR btrim(semester::text) = '')
ORDER BY course_code, created_at ASC;

-- Targeted removal: only GFE 306/307 rows with an unassigned semester.
DELETE FROM public.courses
WHERE regexp_replace(upper(coalesce(course_code, '')), '[^A-Z0-9]', '', 'g') IN ('GFE306','GFE307')
  AND (semester IS NULL OR btrim(semester::text) = '');

COMMIT;
