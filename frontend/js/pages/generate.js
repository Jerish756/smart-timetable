/**
 * ═══════════════════════════════════════════════
 *  SmartTable AI — Generate Page
 *  Course input, preferences, schedule generation
 * ═══════════════════════════════════════════════
 */

import { $, $$, showToast, showModal, hideModal, formatTime, COURSE_COLORS } from '../utils.js';
import api from '../api.js';

/**
 * Render the Generate page
 */
export async function renderGenerate(container, state) {
  // Load user courses
  let courses = [];
  try {
    const data = await api.courses.getAll();
    courses = data.courses || [];
  } catch (e) {
    // Will show empty state
  }

  const prefs = state.user?.preferences || {};

  container.innerHTML = `
    <div class="generate-page">
      <!-- Hero -->
      <div class="generate-hero animate-in">
        <h1>Plan around your real day.</h1>
        <p>SmartTable AI syncs with your life to find the perfect intellectual flow states for your growth.</p>
        <button class="btn btn-primary btn-lg" style="margin-top: var(--space-lg);" id="btn-hero-add">
          📅 Add Timetable
        </button>
      </div>

      <!-- Content Grid -->
      <div class="generate-content">
        <!-- Left Column -->
        <div class="generate-left">
          <!-- Your Day -->
          <div class="card your-day-card animate-in stagger-1">
            <div class="section-header">
              <span class="section-icon">📋</span>
              <h2>Your day</h2>
            </div>
            <div class="checkbox-row">
              <label class="checkbox-group">
                <input type="checkbox" id="pref-busy" ${prefs.isBusyDuringDay ? 'checked' : ''} />
                <span>I am busy during the day (School/Work)</span>
              </label>
            </div>
            <div class="busy-times">
              <div class="time-picker-card">
                <label>BUSY FROM</label>
                <input type="time" id="busy-from" value="09:00" />
              </div>
              <div class="time-picker-card">
                <label>BUSY TILL</label>
                <input type="time" id="busy-till" value="17:00" />
              </div>
            </div>
          </div>

          <!-- Daily Routine -->
          <div class="card animate-in stagger-2">
            <div class="section-header">
              <span class="section-icon">🖥️</span>
              <h2>Your daily routine</h2>
            </div>
            <div class="routine-grid">
              <div class="routine-item">
                <span class="routine-icon">☀️</span>
                <div class="routine-info">
                  <div class="routine-label">WAKING TIME</div>
                  <input type="time" id="wake-time" value="07:00" style="background:var(--bg-input);border:1px solid var(--border-primary);border-radius:var(--radius-md);padding:8px;color:var(--text-primary);width:100%;" />
                </div>
              </div>
              <div class="routine-item">
                <span class="routine-icon">🌙</span>
                <div class="routine-info">
                  <div class="routine-label">SLEEPING TIME</div>
                  <input type="time" id="sleep-time" value="23:00" style="background:var(--bg-input);border:1px solid var(--border-primary);border-radius:var(--radius-md);padding:8px;color:var(--text-primary);width:100%;" />
                </div>
              </div>
              <div class="routine-item">
                <span class="routine-icon">🍳</span>
                <div class="routine-info">
                  <div class="routine-label">BREAKFAST</div>
                  <input type="time" id="meal-breakfast" value="08:00" style="background:var(--bg-input);border:1px solid var(--border-primary);border-radius:var(--radius-md);padding:8px;color:var(--text-primary);width:100%;" />
                </div>
              </div>
              <div class="routine-item">
                <span class="routine-icon">🍽️</span>
                <div class="routine-info">
                  <div class="routine-label">LUNCH</div>
                  <input type="time" id="meal-lunch" value="13:00" style="background:var(--bg-input);border:1px solid var(--border-primary);border-radius:var(--radius-md);padding:8px;color:var(--text-primary);width:100%;" />
                </div>
              </div>
            </div>
          </div>

          <!-- Best Time to Study -->
          <div class="card animate-in stagger-3">
            <div class="section-header">
              <span class="section-icon">🌤️</span>
              <h2>Best time to study</h2>
            </div>
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: var(--space-md);">
              When do you feel most intellectually sharp?
            </p>
            <div class="best-time-options" id="best-time-options">
              <button class="preference-option" data-value="early_morning">
                <span class="pref-icon">🌅</span>
                <span class="pref-label">Early morning</span>
              </button>
              <button class="preference-option selected" data-value="morning">
                <span class="pref-icon">☀️</span>
                <span class="pref-label">Morning</span>
              </button>
              <button class="preference-option" data-value="evening">
                <span class="pref-icon">✨</span>
                <span class="pref-label">Evening</span>
              </button>
              <button class="preference-option" data-value="night">
                <span class="pref-icon">🌙</span>
                <span class="pref-label">Night</span>
              </button>
            </div>
          </div>

          <!-- Schedule Preferences -->
          <div class="card animate-in stagger-4">
            <div class="section-header">
              <span class="section-icon">⚙️</span>
              <h2>Schedule preferences</h2>
            </div>
            <div style="display: flex; flex-direction: column; gap: var(--space-md);">
              <label class="checkbox-group">
                <input type="checkbox" id="pref-no-morning" ${prefs.noMorningClasses ? 'checked' : ''} />
                <span>No morning classes (before 10:00 AM)</span>
              </label>
              <label class="checkbox-group">
                <input type="checkbox" id="pref-evenings" ${prefs.eveningsOnly ? 'checked' : ''} />
                <span>Evenings only (after 5:00 PM)</span>
              </label>
              <label class="checkbox-group">
                <input type="checkbox" id="pref-free-friday" ${prefs.freeFridays ? 'checked' : ''} />
                <span>Keep Fridays free</span>
              </label>
              <div class="form-row" style="margin-top: var(--space-sm);">
                <div class="form-group">
                  <label>Schedule Intensity</label>
                  <select id="pref-intensity">
                    <option value="balanced" ${prefs.scheduleIntensity === 'balanced' ? 'selected' : ''}>Balanced</option>
                    <option value="compressed" ${prefs.scheduleIntensity === 'compressed' ? 'selected' : ''}>Compressed</option>
                    <option value="distributed" ${prefs.scheduleIntensity === 'distributed' ? 'selected' : ''}>Distributed</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Break Duration (minutes)</label>
                  <select id="pref-break">
                    <option value="15" ${prefs.breakDuration === 15 ? 'selected' : ''}>15 mins</option>
                    <option value="30" ${prefs.breakDuration === 30 ? 'selected' : ''}>30 mins</option>
                    <option value="45" ${!prefs.breakDuration || prefs.breakDuration === 45 ? 'selected' : ''}>45 mins</option>
                    <option value="60" ${prefs.breakDuration === 60 ? 'selected' : ''}>60 mins</option>
                    <option value="90" ${prefs.breakDuration === 90 ? 'selected' : ''}>90 mins</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="generate-right">
          <!-- Subjects Panel -->
          <div class="card animate-in stagger-2">
            <div class="card-header">
              <h2 class="card-title">📚 Subjects</h2>
              <span class="badge badge-primary">${courses.length} ACTIVE</span>
            </div>
            <div class="subjects-panel" id="subjects-panel">
              <div class="subjects-list" id="subjects-list">
                <!-- Courses render here -->
              </div>
              <button class="add-subject-btn" id="btn-add-subject" style="margin-top: var(--space-md);">
                <span>⊕</span> Add Subject
              </button>
            </div>
          </div>

          <!-- Upcoming Exams -->
          <div class="card animate-in stagger-3">
            <div class="card-header">
              <h2 class="card-title">🔔 Upcoming exams</h2>
            </div>
            <div class="exams-list" id="exams-list">
              <!-- Rendered dynamically -->
            </div>
            <button class="add-exam-btn" id="btn-add-exam" style="margin-top: var(--space-sm);">
              📅 Add Exam Date
            </button>
          </div>

          <!-- Generate CTA -->
          <div class="animate-in stagger-5">
            <button class="generate-cta-btn" id="btn-generate">
              GENERATE FLOW SCHEDULE <span class="cta-lightning">⚡</span>
            </button>
            <div class="generate-cta-sub">OPTIMIZING FOR INTELLECTUAL FLOW</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ── Render Courses List ──
  renderCoursesList(courses);

  // ── Render Exams ──
  renderExams();

  // ── Event: Best Time Selection ──
  const bestTimeOptions = $$('#best-time-options .preference-option');
  bestTimeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      bestTimeOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });

  // ── Event: Add Subject ──
  $('#btn-add-subject')?.addEventListener('click', () => openCourseModal(null, courses, container, state));
  $('#btn-hero-add')?.addEventListener('click', () => openCourseModal(null, courses, container, state));

  // ── Event: Add Exam ──
  $('#btn-add-exam')?.addEventListener('click', () => {
    const exams = JSON.parse(localStorage.getItem('st_exams') || '[]');
    const name = prompt('Exam subject name:');
    if (!name) return;
    const date = prompt('Exam date (YYYY-MM-DD):');
    if (!date) return;
    exams.push({ id: Date.now(), name, date, type: 'Mid-term Assessment' });
    localStorage.setItem('st_exams', JSON.stringify(exams));
    renderExams();
    showToast('Exam date added!', 'success');
  });

  // ── Event: Generate Schedule ──
  $('#btn-generate')?.addEventListener('click', () => generateSchedule(state));
}

/**
 * Render courses in the subjects list
 */
function renderCoursesList(courses) {
  const list = $('#subjects-list');
  if (!list) return;

  if (courses.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:20px;color:var(--text-tertiary);font-size:0.85rem;">
        No subjects added yet.<br/>Click "Add Subject" to get started.
      </div>
    `;
    return;
  }

  list.innerHTML = courses.map(c => `
    <div class="course-card" data-id="${c._id}">
      <div class="course-color" style="background: ${c.color}"></div>
      <div class="course-info">
        <div class="course-name">${c.name}</div>
        <div class="course-code">${c.code} • ${c.sessionsPerWeek}x/week • ${c.sessionDuration || 60} mins</div>
      </div>
      <div class="course-actions">
        <button class="course-action-btn btn-edit-course" data-id="${c._id}" title="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="course-action-btn btn-delete-course" data-id="${c._id}" title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
  `).join('');

  // Edit handlers
  list.querySelectorAll('.btn-edit-course').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      try {
        const data = await api.courses.get(id);
        openCourseModal(data.course, courses, document.getElementById('page-container'), null);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  // Delete handlers
  list.querySelectorAll('.btn-delete-course').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm('Delete this course?')) return;
      try {
        await api.courses.delete(btn.dataset.id);
        showToast('Course deleted', 'success');
        // Re-fetch and re-render
        const data = await api.courses.getAll();
        renderCoursesList(data.courses || []);
        // Update badge
        const badge = document.querySelector('.badge-primary');
        if (badge) badge.textContent = `${(data.courses || []).length} ACTIVE`;
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });
}

/**
 * Render exams from localStorage
 */
function renderExams() {
  const list = $('#exams-list');
  if (!list) return;

  const exams = JSON.parse(localStorage.getItem('st_exams') || '[]');
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

  if (exams.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:12px;color:var(--text-tertiary);font-size:0.8rem;">No upcoming exams</div>';
    return;
  }

  list.innerHTML = exams.sort((a, b) => new Date(a.date) - new Date(b.date)).map(e => {
    const d = new Date(e.date);
    return `
      <div class="exam-card">
        <div class="exam-date-badge">
          <span class="day">${d.getDate()}</span>
          <span class="month">${months[d.getMonth()]}</span>
        </div>
        <div class="exam-info">
          <div class="exam-name">${e.name}</div>
          <div class="exam-details">${e.type || 'Exam'}</div>
        </div>
        <button class="course-action-btn" onclick="
          const exams = JSON.parse(localStorage.getItem('st_exams') || '[]');
          localStorage.setItem('st_exams', JSON.stringify(exams.filter(x => x.id !== ${e.id})));
          this.closest('.exam-card').remove();
        " style="opacity:0.5;">
          <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' width='14' height='14'><line x1='18' y1='6' x2='6' y2='18'/><line x1='6' y1='6' x2='18' y2='18'/></svg>
        </button>
      </div>
    `;
  }).join('');
}

/**
 * Open course add/edit modal
 */
function openCourseModal(course, courses, container, state) {
  const isEdit = !!course;
  const colorOptions = COURSE_COLORS.map((c, i) =>
    `<div class="color-option ${course?.color === c ? 'selected' : (!course && i === (courses.length % COURSE_COLORS.length) ? 'selected' : '')}" data-color="${c}" style="background:${c}"></div>`
  ).join('');

  showModal(`
    <h2 style="margin-bottom: var(--space-lg);">${isEdit ? 'Edit' : 'Add'} Subject</h2>
    <form id="course-form">
      <div class="course-form-grid">
        <div class="form-group full-width">
          <label for="course-name">Subject Name</label>
          <input type="text" id="course-name" placeholder="e.g. Advanced Calculus" value="${course?.name || ''}" required />
        </div>
        <div class="form-group">
          <label for="course-code">Course Code</label>
          <input type="text" id="course-code" placeholder="e.g. MATH301" value="${course?.code || ''}" required />
        </div>
        <div class="form-group">
          <label for="course-instructor">Instructor</label>
          <input type="text" id="course-instructor" placeholder="Professor name" value="${course?.instructor || ''}" />
        </div>
        <div class="form-group">
          <label for="course-hours">Total Weekly Hours</label>
          <input type="number" id="course-hours" min="1" max="20" value="${course?.totalHours || 3}" required />
        </div>
        <div class="form-group">
          <label for="course-sessions">Sessions Per Week</label>
          <input type="number" id="course-sessions" min="1" max="10" value="${course?.sessionsPerWeek || 3}" required />
        </div>
        <div class="form-group">
          <label for="course-duration">Session Duration</label>
          <select id="course-duration">
            <option value="30" ${course?.sessionDuration === 30 ? 'selected' : ''}>30 mins</option>
            <option value="60" ${!course?.sessionDuration || course?.sessionDuration === 60 ? 'selected' : ''}>60 mins</option>
            <option value="90" ${course?.sessionDuration === 90 ? 'selected' : ''}>90 mins</option>
            <option value="120" ${course?.sessionDuration === 120 ? 'selected' : ''}>120 mins</option>
          </select>
        </div>
        <div class="form-group">
          <label for="course-type">Type</label>
          <select id="course-type">
            <option value="theoretical" ${course?.type === 'theoretical' ? 'selected' : ''}>Theoretical</option>
            <option value="practical_lab" ${course?.type === 'practical_lab' ? 'selected' : ''}>Practical Lab</option>
            <option value="seminar" ${course?.type === 'seminar' ? 'selected' : ''}>Seminar</option>
            <option value="tutorial" ${course?.type === 'tutorial' ? 'selected' : ''}>Tutorial</option>
            <option value="elective" ${course?.type === 'elective' ? 'selected' : ''}>Elective</option>
          </select>
        </div>
        <div class="form-group">
          <label for="course-priority">Priority (1-10)</label>
          <input type="number" id="course-priority" min="1" max="10" value="${course?.priority || 5}" />
        </div>
        <div class="form-group full-width">
          <label>Color</label>
          <div class="color-options" id="color-options">
            ${colorOptions}
          </div>
        </div>
      </div>
      <div style="display:flex;gap:var(--space-md);margin-top:var(--space-lg);">
        <button type="submit" class="btn btn-primary btn-full">${isEdit ? 'Update' : 'Add'} Subject</button>
        <button type="button" class="btn btn-ghost" onclick="document.getElementById('modal-overlay').style.display='none'">Cancel</button>
      </div>
    </form>
  `);

  // Color selection
  document.querySelectorAll('#color-options .color-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('#color-options .color-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });

  // Form submit
  document.getElementById('course-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const selectedColor = document.querySelector('#color-options .color-option.selected');
    const courseData = {
      name: $('#course-name').value.trim(),
      code: $('#course-code').value.trim(),
      instructor: $('#course-instructor').value.trim(),
      totalHours: parseInt($('#course-hours').value),
      sessionsPerWeek: parseInt($('#course-sessions').value),
      sessionDuration: parseInt($('#course-duration').value),
      type: $('#course-type').value,
      priority: parseInt($('#course-priority').value),
      color: selectedColor?.dataset.color || COURSE_COLORS[0],
    };

    try {
      if (isEdit) {
        await api.courses.update(course._id, courseData);
        showToast('Subject updated!', 'success');
      } else {
        await api.courses.create(courseData);
        showToast('Subject added!', 'success');
      }
      hideModal();

      // Re-fetch and re-render
      const data = await api.courses.getAll();
      renderCoursesList(data.courses || []);
      const badge = document.querySelector('.badge-primary');
      if (badge) badge.textContent = `${(data.courses || []).length} ACTIVE`;
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

/**
 * Generate schedule using the backend algorithm
 */
async function generateSchedule(state) {
  const btn = $('#btn-generate');
  if (!btn) return;

  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="btn-loader"></span> GENERATING...';
  btn.disabled = true;

  try {
    const preferences = {
      noMorningClasses: $('#pref-no-morning')?.checked || false,
      eveningsOnly: $('#pref-evenings')?.checked || false,
      freeFridays: $('#pref-free-friday')?.checked || false,
      scheduleIntensity: $('#pref-intensity')?.value || 'balanced',
      breakDuration: parseInt($('#pref-break')?.value || '45'),
      isBusyDuringDay: $('#pref-busy')?.checked || false,
      busyFrom: $('#busy-from')?.value || '09:00',
      busyTill: $('#busy-till')?.value || '17:00',
    };

    // Also save preferences to user profile
    try {
      await api.auth.updatePreferences(preferences);
    } catch (e) { /* non-critical */ }

    const result = await api.schedules.generate({
      title: `Schedule — ${new Date().toLocaleDateString()}`,
      preferences,
    });

    showToast(result.message || 'Schedule generated successfully!', 'success');

    // Navigate to schedule page
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'schedule' } }));
    }, 500);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}
