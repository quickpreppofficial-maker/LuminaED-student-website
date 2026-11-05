(async()=>{
  const c=window.luminaSupabase;
  const heading=document.getElementById('student-heading');
  const intro=document.getElementById('course-intro');
  const box=document.getElementById('courses');
  const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  if(!c){box.innerHTML='<div class="empty">Supabase connection unavailable.</div>';return;}
  const {data:{session},error:sessionError}=await c.auth.getSession();
  if(sessionError){box.innerHTML='<div class="empty">Could not verify your login. Refresh and try again.</div>';return;}
  if(!session?.user){location.replace('login.html?reason=session');return;}
  const {data:p,error:pe}=await c.from('student_academic_profiles').select('faculty,department,level').eq('user_id',session.user.id).maybeSingle();
  if(pe||!p){intro.textContent='Register your faculty, department and level to select your courses.';box.innerHTML='<a class="action" href="register-department.html">Register department</a>';return;}
  heading.textContent=p.faculty+' · '+p.department;
  intro.textContent='Your saved course selections for '+p.level+'.';
  const {data:selectionRows,error}=await c.from('student_course_selections').select('course:courses(course_code,course_title,level,semester)').eq('user_id',session.user.id);
  if(error){console.warn('Saved course selections:',error.message);box.innerHTML='<div class="empty">Your saved course selections could not be loaded. Please refresh or contact support.</div>';return;}
  const rows=(selectionRows||[]).map(row=>row.course).filter(Boolean);
  if(!rows.length){box.innerHTML='<div class="empty">You have not selected any courses yet. Open course registration to view the catalogue and save your choices.</div><a class="action" href="register-department.html">Choose my courses</a>';return;}
  const groups=rows.reduce((acc,r)=>{const term=r.semester||'Semester not assigned';(acc[term]??=[]).push(r);return acc;},{});
  box.innerHTML=Object.entries(groups).map(([term,list])=>`<section class="semester-group" style="grid-column:1/-1"><h3 style="color:var(--navy);font-family:'Lora',Georgia,serif">${esc(term)}</h3><div class="course-grid">${list.map(r=>`<article class="item"><strong>${esc(r.course_code)} · ${esc(r.course_title)}</strong><small>${esc(r.level)}</small></article>`).join('')}</div></section>`).join('')+'<div style="grid-column:1/-1"><a class="action" href="register-department.html">Update course selections</a></div>';
})();