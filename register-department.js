/* LuminaED academic registration with automatic course display.
   Students register faculty, department and level once; the matching active
   catalogue is then displayed automatically. No manual course selections. */
(async () => {
  const supabase = window.luminaSupabase;
  const form = document.getElementById('department-form');
  const status = document.getElementById('department-status');
  const profileButton = document.getElementById('save-department');
  const coursePanel = document.getElementById('course-panel');
  const courseList = document.getElementById('course-list');
  const courseStatus = document.getElementById('course-status');

  function setStatus(node, message, type = '') {
    if (!node) return;
    node.textContent = message;
    node.className = `status ${type}`.trim();
  }
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  function canonicalFacultyName(value = '') {
    const cleaned = value.trim().replace(/\s+/g, ' ');
    return /^(faculty of engineering( and technology)?( \(fet\))?|fet)$/i.test(cleaned)
      ? 'Faculty of Engineering' : cleaned;
  }
  function canonicalDepartmentName(value = '') {
    const cleaned = value.trim().replace(/\s+/g, ' ');
    if (/^electrical\s*(\/\s*)?electronics\s+engineering$/i.test(cleaned) ||
        /^electrical\s+electronics\s+engineering$/i.test(cleaned)) return 'Electrical Engineering';
    return cleaned;
  }
  async function getDepartmentNames(department) {
    const canonical = canonicalDepartmentName(department);
    const { data, error } = await supabase.from('department_aliases')
      .select('alias').eq('canonical_department', canonical);
    if (error) console.warn('Department aliases:', error.message);
    return [...new Set([department.trim(), canonical, ...((data || []).map(row => row.alias))])];
  }
  async function loadCourses(faculty, department, level) {
    const facultyName = canonicalFacultyName(faculty);
    const facultyNames = [...new Set([faculty.trim(), facultyName])];
    const departmentNames = await getDepartmentNames(department);
    const { data, error } = await supabase.from('courses')
      .select('course_code,course_title,level')
      .in('faculty', facultyNames)
      .in('department', departmentNames)
      .eq('level', level)
      .eq('is_active', true)
      .order('course_code', { ascending: true });
    if (error) throw error;
    const unique = new Map();
    (data || []).forEach(course => {
      const key = `${String(course.course_code).trim().toUpperCase()}|${String(course.course_title).trim().toLowerCase()}`;
      if (!unique.has(key)) unique.set(key, course);
    });
    return [...unique.values()];
  }
  async function displayCourses() {
    const faculty = form.elements.faculty.value.trim();
    const department = form.elements.department.value.trim();
    const level = form.elements.level.value;
    if (!faculty || !department || !level) { coursePanel.hidden = true; return; }
    coursePanel.hidden = false;
    courseList.innerHTML = '<div class="empty">Loading your department courses...</div>';
    setStatus(courseStatus, '');
    try {
      const courses = await loadCourses(faculty, department, level);
      if (!courses.length) {
        courseList.innerHTML = '<div class="empty">No courses have been uploaded for this faculty, department and level yet. Your courses will appear here once the official catalogue is uploaded.</div>';
        setStatus(courseStatus, 'Your academic registration is saved.');
        return;
      }
      courseList.innerHTML = `<div class="course-grid">${courses.map(course =>
        `<article class="course-card"><span class="course-code">${escapeHtml(course.course_code)}</span><h3 class="course-title">${escapeHtml(course.course_title)}</h3></article>`
      ).join('')}</div>`;
      setStatus(courseStatus, `${courses.length} course${courses.length === 1 ? '' : 's'} automatically loaded for your registered programme.`, 'success');
    } catch (error) {
      console.error('Automatic course loading:', error);
      courseList.innerHTML = '<div class="empty">We could not load your course catalogue. Please refresh and try again.</div>';
      setStatus(courseStatus, error.message || 'Could not load courses.', 'error');
    }
  }

  if (!supabase) {
    setStatus(status, 'Supabase connection is unavailable. Refresh the page and try again.', 'error');
    return;
  }
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session?.user) { location.replace('login.html?reason=session'); return; }
    const currentUser = session.user;
    const { data: profile, error } = await supabase.from('student_academic_profiles')
      .select('faculty,department,level').eq('user_id', currentUser.id).maybeSingle();
    if (error) throw error;
    if (profile) {
      form.elements.faculty.value = canonicalFacultyName(profile.faculty || '');
      form.elements.department.value = canonicalDepartmentName(profile.department || '');
      form.elements.level.value = profile.level || '';
      setStatus(status, 'Your saved academic details are loaded.');
      await displayCourses();
    }
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const faculty = canonicalFacultyName(form.elements.faculty.value);
      const department = canonicalDepartmentName(form.elements.department.value);
      const level = form.elements.level.value;
      if (!faculty || !department || !['100 Level','200 Level','300 Level','400 Level','500 Level'].includes(level)) {
        setStatus(status, 'Enter your faculty and department, and select a level from 100 to 500.', 'error');
        return;
      }
      profileButton.disabled = true;
      setStatus(status, 'Saving your academic details...');
      try {
        const { error: saveError } = await supabase.from('student_academic_profiles').upsert({
          user_id: currentUser.id, faculty, department, level, updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        if (saveError) throw saveError;
        setStatus(status, 'Your faculty, department and level have been saved.', 'success');
        await displayCourses();
      } catch (saveError) {
        console.error('Academic profile save:', saveError);
        setStatus(status, saveError.message || 'Could not save your academic details.', 'error');
      } finally { profileButton.disabled = false; }
    });
  } catch (error) {
    console.error('Academic registration initialisation:', error);
    setStatus(status, error.message || 'Could not load your academic details. Check your connection and Supabase setup.', 'error');
  }
})();
