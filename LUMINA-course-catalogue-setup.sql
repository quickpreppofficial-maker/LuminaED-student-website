-- LUMINA course catalogue schema check.
-- Run LUMINA-database-additions.sql first if the courses table does not exist.
-- Semester is intentionally not required or used. This file does not alter existing
-- course data; use LUMINA-import-official-engineering-courses.sql to import supplied rows.
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'courses'
order by ordinal_position;
