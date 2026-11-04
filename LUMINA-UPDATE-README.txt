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
