/* LuminaED academic registration and course selection.
   Uses the browser-safe Supabase publishable key from supabase-client.js.
   Row Level Security remains the authority for every database write. */
(async () => {
  const supabase = window.luminaSupabase;
  const form = document.getElementById('department-form');
  const status = document.getElementById('department-status');
  const profileButton = document.getElementById('save-department');
  const coursePanel = document.getElementById('course-panel');
  const courseList = document.getElementById('course-list');
  const courseStatus = document.getElementById('course-status');
  const saveCoursesButton = document.getElementById('save-courses');
  const selectedCount = document.getElementById('selected-count');

  if (!supabase) {
    setStatus(status, 'Supabase connection is unavailable. Refresh the page and try again.', 'error');
    return;
  }

  let currentUser = null;
  let availableCourses = [];
  let savedSelectionIds = new Set();

  function setStatus(node, message, type = '') {
    node.textContent = message;
    node.className = `status ${type}`.trim();
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function canonicalFacultyName(value) {
    const cleaned = value.trim().replace(/\s+/g, ' ');
    if (/^(faculty of engineering( and technology)?( \(fet\))?|fet)$/i.test(cleaned)) return 'Faculty of Engineering';
    return cleaned;
  }

  function canonicalDepartmentName(value) {
    const cleaned = value.trim().replace(/\s+/g, ' ');
    if (/^electrical\s*(\/|\/\s*)\s*electronics\s*engineering$/i.test(cleaned) ||
        /^electrical\s+electronics\s+engineering$/i.test(cleaned)) {
      return 'Electrical Engineering';
    }
    return cleaned;
  }

  async function getDepartmentNamesForQuery(department) {
    const input = department.trim();
    const { data: exactAlias, error: aliasError } = await supabase
      .from('department_aliases')
      .select('canonical_department')
      .eq('alias', input)
      .maybeSingle();

    if (aliasError) console.warn('Department alias lookup:', aliasError.message);
    const canonical = exactAlias?.canonical_department || canonicalDepartmentName(input);
    const { data: aliases, error } = await supabase
      .from('department_aliases')
      .select('alias')
      .eq('canonical_department', canonical);

    if (error) {
      console.warn('Department aliases list:', error.message);
      return [...new Set([input, canonical])];
    }
    return [...new Set([input, canonical, ...(aliases || []).map(row => row.alias)])];
  }

  async function getCourses(faculty, department, level) {
    const departmentNames = await getDepartmentNamesForQuery(department);
    const canonicalFaculty = canonicalFacultyName(faculty);
    const facultyNames = [...new Set([faculty.trim(), canonicalFaculty])];
    const { data, error } = await supabase
      .from('courses')
      .select('id,faculty,department,level,course_code,course_title')
      .in('faculty', facultyNames)
      .in('department', departmentNames)
      .eq('level', level)
      .eq('is_active', true)
      .order('course_code', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async function loadSelections() {
    const { data, error } = await supabase
      .from('student_course_selections')
      .select('course_id')
      .eq('user_id', currentUser.id);
    if (error) throw error;
    savedSelectionIds = new Set((data || []).map(row => String(row.course_id)));
  }

  function renderCourses() {
    if (!availableCourses.length) {
      courseList.innerHTML = '<div class="empty">No courses are currently listed for this faculty, department and level. The catalogue may not have been uploaded yet.</div>';
      saveCoursesButton.hidden = true;
      selectedCount.textContent = '0 selected';
      return;
    }

    courseList.innerHTML = `
      <div class="course-grid">
        ${availableCourses.map(course => {
          const checked = savedSelectionIds.has(String(course.id));
          return `<label class="course-choice ${checked ? 'is-selected' : ''}">
            <input class="course-checkbox" type="checkbox" value="${escapeHtml(course.id)}" ${checked ? 'checked' : ''}>
            <span class="choice-copy">
              <strong>${escapeHtml(course.course_code)}</strong>
              <span>${escapeHtml(course.course_title)}</span>
            </span>
          </label>`;
        }).join('')}
      </div>`;

    courseList.querySelectorAll('.course-checkbox').forEach(input => {
      input.addEventListener('change', () => {
        input.closest('.course-choice').classList.toggle('is-selected', input.checked);
        updateSelectedCount();
      });
    });
    saveCoursesButton.hidden = false;
    updateSelectedCount();
  }

  function updateSelectedCount() {
    const count = courseList.querySelectorAll('.course-checkbox:checked').length;
    selectedCount.textContent = `${count} selected`;
  }

  async function loadCourseSelection() {
    const faculty = form.elements.faculty.value.trim();
    const department = form.elements.department.value.trim();
    const level = form.elements.level.value;
    if (!faculty || !department || !level) {
      coursePanel.hidden = true;
      return;
    }

    coursePanel.hidden = false;
    courseList.innerHTML = '<div class="empty">Loading courses for your registration...</div>';
    setStatus(courseStatus, '');
    saveCoursesButton.hidden = true;

    try {
      const [courses] = await Promise.all([
        getCourses(faculty, department, level),
        loadSelections()
      ]);
      availableCourses = courses;
      renderCourses();
      setStatus(courseStatus, courses.length
        ? 'Select the courses you are taking, then save your choices.'
        : 'Your academic details are saved. Courses will appear when this catalogue is available.',
        courses.length ? '' : '');
    } catch (error) {
      console.error('Course selection load:', error);
      courseList.innerHTML = '<div class="empty">We could not load the course catalogue. Please refresh and try again.</div>';
      setStatus(courseStatus, error.message || 'Could not load courses.', 'error');
    }
  }

  async function saveCourseSelection() {
    const chosenIds = [...courseList.querySelectorAll('.course-checkbox:checked')].map(input => Number(input.value));
    const availableIds = new Set(availableCourses.map(course => String(course.id)));
    saveCoursesButton.disabled = true;
    setStatus(courseStatus, 'Saving your course selections...');

    try {
      const { data: existing, error: existingError } = await supabase
        .from('student_course_selections')
        .select('id,course_id')
        .eq('user_id', currentUser.id);
      if (existingError) throw existingError;

      const chosenSet = new Set(chosenIds.map(String));
      // Change only selections belonging to the catalogue currently on screen.
      // Preserve any saved selections from other levels/departments.
      const removeRows = (existing || []).filter(row =>
        availableIds.has(String(row.course_id)) && !chosenSet.has(String(row.course_id))
      );
      const existingCourseIds = new Set((existing || []).map(row => String(row.course_id)));
      const addIds = chosenIds.filter(id => !existingCourseIds.has(String(id)));

      // Delete only rows no longer selected, then insert only new selections.
      // This avoids wiping existing choices if an insert fails.
      if (removeRows.length) {
        const { error } = await supabase
          .from('student_course_selections')
          .delete()
          .in('id', removeRows.map(row => row.id))
          .eq('user_id', currentUser.id);
        if (error) throw error;
      }

      if (addIds.length) {
        const payload = addIds.map(course_id => ({ user_id: currentUser.id, course_id }));
        const { error } = await supabase.from('student_course_selections').insert(payload);
        if (error) throw error;
      }

      savedSelectionIds = new Set(chosenIds.map(String));
      renderCourses();
      setStatus(courseStatus, `Your ${chosenIds.length} course${chosenIds.length === 1 ? '' : 's'} ${chosenIds.length === 1 ? 'selection has' : 'selections have'} been saved.`, 'success');
    } catch (error) {
      console.error('Course selection save:', error);
      setStatus(courseStatus, error.message || 'Could not save your course selections. Check your Supabase policies.', 'error');
    } finally {
      saveCoursesButton.disabled = false;
    }
  }

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session?.user) {
      location.replace('login.html?reason=session');
      return;
    }
    currentUser = session.user;

    const { data: profile, error } = await supabase
      .from('student_academic_profiles')
      .select('faculty,department,level')
      .eq('user_id', currentUser.id)
      .maybeSingle();
    if (error) throw error;

    if (profile) {
      form.elements.faculty.value = canonicalFacultyName(profile.faculty || '');
      form.elements.department.value = canonicalDepartmentName(profile.department || '');
      form.elements.level.value = profile.level || '';
      setStatus(status, 'Your saved academic details are loaded.');
      await loadCourseSelection();
    }

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const faculty = canonicalFacultyName(form.elements.faculty.value);
      const department = canonicalDepartmentName(form.elements.department.value);
      const level = form.elements.level.value;
      if (!faculty || !department || !['100 Level', '200 Level', '300 Level', '400 Level', '500 Level'].includes(level)) {
        setStatus(status, 'Enter your faculty and department, and select a level from 100 to 500.', 'error');
        return;
      }

      profileButton.disabled = true;
      setStatus(status, 'Saving your academic details...');
      try {
        const payload = { user_id: currentUser.id, faculty, department, level, updated_at: new Date().toISOString() };
        const { error: saveError } = await supabase
          .from('student_academic_profiles')
          .upsert(payload, { onConflict: 'user_id' });
        if (saveError) throw saveError;
        setStatus(status, 'Your faculty, department and level have been saved.', 'success');
        await loadCourseSelection();
      } catch (saveError) {
        console.error('Academic profile save:', saveError);
        setStatus(status, saveError.message || 'Could not save your academic details. Check your profile table and RLS policies.', 'error');
      } finally {
        profileButton.disabled = false;
      }
    });

    saveCoursesButton.addEventListener('click', saveCourseSelection);
  } catch (error) {
    console.error('Academic registration initialisation:', error);
    setStatus(status, error.message || 'Could not load your academic details. Check your connection and Supabase setup.', 'error');
  }
})();
