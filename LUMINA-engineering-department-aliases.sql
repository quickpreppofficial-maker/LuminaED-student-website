-- Optional standalone alias setup. The full schema migration also applies these rows.
insert into public.department_aliases (alias, canonical_department) values
  ('Electrical / Electronics Engineering', 'Electrical Engineering'),
  ('Electrical/Electronics Engineering', 'Electrical Engineering'),
  ('Electrical and Electronics Engineering', 'Electrical Engineering'),
  ('Electrical & Electronics Engineering', 'Electrical Engineering')
on conflict (alias) do update set canonical_department = excluded.canonical_department;
