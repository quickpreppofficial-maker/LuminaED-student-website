LuminaED UPDATE — IMPLEMENTATION NOTES

1. Extract this ZIP and replace the corresponding files in your existing project folder.
2. In Supabase SQL Editor, run LUMINA-database-additions.sql if you have not already run it.
3. Run LUMINA-course-catalogue-setup.sql after the database additions. It adds the semester column only; it does not invent or insert course data.
4. Add course rows to public.courses only with the exact official faculty, department, level, semester, course_code and course_title values you provide. Study Tools filters on exact text matches.
5. In Supabase Authentication > URL Configuration, add the deployed update-password.html URL to the allowed redirect URLs. Keep the existing email-confirmation redirect to login.html?confirmed=1.
6. The signup flow uses Supabase's default confirmation email. Resend and OTP are not configured.
7. Test the password-reset flow on the deployed site after configuring the redirect URL.
8. Administration social entries are placeholders because no official social handles were supplied. Replace them with real profile URLs/handles.
9. Test History displays rows in public.test_attempts. The test.html scoring flow does not yet insert attempts; scoring rules and integration remain pending.
10. Dashboard destinations: Study Tools, Tests, Past Questions, Summaries, Progress, Register Department, Test History, Buy Books and Administration. My Account is available from the dashboard header.

ACADEMIC PROFILE + COURSE CATALOGUE
1. Register Department saves one academic profile in student_academic_profiles for the signed-in user.
2. Study Tools reads the saved faculty, department and level, then fetches matching active courses from public.courses. Courses are grouped by semester.
3. The course catalogue is intentionally empty until official course codes and titles are supplied. No temporary or fabricated course codes are included.
4. After adding official course rows, sign in, save the student's academic details, then open Study Tools to verify the matching courses appear.

KNOWN FEATURE LIMITATIONS BEFORE PUBLIC LAUNCH
- Tests, past questions, summaries, progress tracking and book purchasing pages are currently informational placeholders, not completed functional modules.
- Test History can display saved attempts, but the test page does not yet record them.
- Administration now uses luminaedofficial@gmail.com as its official email contact. Social handles remain placeholders until official profile links are supplied.
- The account page requires the profile SELECT, INSERT and UPDATE policies in lumina_profiles_trigger.sql. Run that SQL once in Supabase if it has not already been applied.

UPDATED COURSE REGISTRATION FLOW (2026-11-05)
1. register-department.html now loads register-department.js.
2. Students save faculty, department and a level from 100 Level to 500 Level. Postgraduate and 600 Level are not offered in this form.
3. After saving academic details, the page loads all active matching courses from public.courses. Electrical Engineering and its configured Electrical/Electronics aliases resolve to the same catalogue.
4. Students tick the courses they are taking and choose Save my courses. Their choices are stored in public.student_course_selections and preselected when they return.
5. Study Tools now displays the student's saved course selections and provides a link to update them. A null semester is displayed as “Semester not assigned”; the code does not guess semester allocations.
6. The live Supabase database must contain student_academic_profiles, courses, department_aliases and student_course_selections with the RLS policies already configured for this project. Do not put a Supabase service-role key in browser files.
7. The department field remains editable because the authoritative faculties-and-departments list has not yet been supplied. Once supplied, it can replace free-text entry with verified department choices.


COURSE DISPLAY QUERY FIX (2026-11-06)
1. Course retrieval no longer selects, orders by, groups by, or requires the semester column.
2. Registration displays all matching active courses in one selectable catalogue.
3. Faculty name compatibility maps Faculty of Engineering and Technology (FET), Faculty of Engineering and FET to the canonical database value Faculty of Engineering.
4. Electrical/Electronics Engineering naming variants resolve to the existing Electrical Engineering catalogue.
5. Study Tools displays the signed-in student's saved selections for the current faculty, department and level only.
6. Saving a selection modifies only rows belonging to the catalogue currently displayed; selections from other levels/departments are preserved.
7. Supabase RLS policies and table grants were inspected and are present for authenticated course reads and student-owned registration/selections. The browser flow still requires a signed-in end-to-end test on the deployed site.

NOVEMBER 6, 2026 — STUDY TOOLS SELECTED-COURSE CARD LAYOUT FIX
- Reworked the selected-course cards in study-tools.html only; registration/selection checkboxes were not restyled as part of this change.
- Removed the nested course-grid wrapper that caused the selected-course layout to size incorrectly inside its parent grid.
- Selected courses now render as direct grid children with a two-column desktop layout and a single-column mobile layout.
- Course codes and titles are displayed separately. Long titles wrap within the card, with min-width/overflow-wrap safeguards to prevent text escaping card boundaries.
- Added consistent card spacing, padding, border, subtle background, and a full-width action row.
- Preserved the existing saved-selection query and filter behaviour; this is a presentation fix, not a database change.

Validation performed on this ZIP:
- Node syntax checks passed for all 7 standalone JavaScript files and the inline Study Tools script.
- HTML local-reference and duplicate-ID scan passed across all 16 HTML files.
- No Supabase schema, course rows, or student selections were modified.


OFFICIAL ENGINEERING COURSE CATALOGUE IMPORT (2026-11-06)
- Added 680 supplied catalogue records across seven departments.
- Department record counts (as pasted):
  * Chemical Engineering: 119 entries
  * Civil Engineering: 99 entries
  * Computer Engineering: 49 entries
  * Electrical Engineering: 116 entries
  * Mechanical Engineering: 147 entries
  * Mechatronics Engineering: 104 entries
  * Water Resources Engineering: 46 entries
- Files: LUMINA-official-course-catalogue.csv (reviewable source data), LUMINA-import-official-engineering-courses.sql (idempotent Supabase import), and LUMINA-engineering-department-aliases.sql (optional name aliases).
- Course levels are assigned from the first digit of the three-digit numeric portion of each supplied code. No semester is assigned. This is a convention-based mapping and should be checked against the institution's official level mapping if any exceptions exist.
- All distinct source codes are preserved, including trailing-hyphen codes. This may mean parallel entries appear when the source itself listed both variants.
- IMPORTANT: These files are packaged locally only. They have NOT been executed against Supabase and nothing has been deployed to GitHub.


COURSE REGISTRATION SCHEMA CHECK (2026-11-06)
- Added LUMINA-course-registration-schema-fix.sql to create/repair the department_aliases and student_course_selections tables, indexes, and owner-scoped RLS policies idempotently. Run it after LUMINA-database-additions.sql and before importing course rows.
- Registration selections are unique per student/course. Students can read, insert, and delete only their own selections.
- The import is a separate step and is not executed by opening the website.
