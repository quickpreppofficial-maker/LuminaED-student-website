-- LuminaED course catalogue migration
-- Run this AFTER LUMINA-database-additions.sql in Supabase SQL Editor.
-- Adds semester support only. No course codes or course titles are invented here.
-- Add course rows only after the user supplies the official course codes and titles.

alter table public.courses
  add column if not exists semester text not null default 'First Semester';

-- Verify the catalogue is ready for official course data.
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'courses'
order by ordinal_position;
