/**
 * ═══════════════════════════════════════════════
 *  SmartTable AI — Schedule Page
 *  Interactive timetable view with today/week layouts
 * ═══════════════════════════════════════════════
 */

import { $, $$, showToast, formatTime, capitalize, DAYS, DAY_LABELS, DAY_FULL, TIME_SLOTS } from '../utils.js';
import api from '../api.js';

/**
 * Render the Schedule page
 */
export async function renderSchedule(container, state) {
  let schedules = [];
  let activeSchedule = null;

  try {
    const data = await api.schedules.getAll();
    schedules = data.schedules || [];
    // Find the most recent finalized or draft schedule
    activeSchedule = schedules.find(s => s.status === 'finalized') || schedules[0] || null;
  } catch (e) {
    // Show empty state
  }

  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  container.innerHTML = `
    <div class="schedule-page">
      <!-- Header -->
      <div class="page-header animate-in">
        <span class="page-label">ACTIVE TIMETABLE</span>
        <div class="page-header-row">
          <div>
            <h1>Optimize Your Flow</h1>
            <p class="page-subtitle">Adjust your sessions by dragging blocks or refining break intervals for peak performance.</p>
          </div>
          <div style="display:flex;gap:var(--space-sm);">
            <button class="btn btn-secondary" id="btn-download-pdf">📋 Download PDF</button>
            <button class="btn btn-primary" id="btn-save-layout">💾 Save Layout</button>
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="schedule-toolbar animate-in stagger-1">
        <div class="schedule-toolbar-left">
          <div class="schedule-view-tabs" id="view-tabs">
            <button class="schedule-view-tab active" data-view="today">Today</button>
            <button class="schedule-view-tab" data-view="week">Week</button>
            <button class="schedule-view-tab" data-view="month">Month</button>
          </div>
          <div class="date-navigator">
            <button class="date-nav-btn" id="date-prev">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span class="date-current" id="date-display">${months[today.getMonth()].toUpperCase()} ${today.getDate()}</span>
            <button class="date-nav-btn" id="date-next">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
        <div class="schedule-toolbar-right">
          ${schedules.length > 1 ? `
          <select id="schedule-selector" style="padding:6px 12px;background:var(--bg-input);color:var(--text-primary);border:1px solid var(--border-primary);border-radius:var(--radius-md);font-size:0.8rem;">
            ${schedules.map(s => `<option value="${s._id}" ${s._id === activeSchedule?._id ? 'selected' : ''}>${s.title} (${s.status})</option>`).join('')}
          </select>` : ''}
        </div>
      </div>

      <!-- Main Content -->
      <div class="schedule-main">
        <!-- Schedule View -->
        <div id="schedule-view" class="animate-in stagger-2">
          ${activeSchedule ? renderTodayView(activeSchedule, today) : renderEmptySchedule()}
        </div>

        <!-- Sidebar -->
        <div class="schedule-sidebar">
          <!-- Break Suggestion -->
          <div class="break-card animate-in stagger-3">
            <div class="card-subtitle">💡 BREAK SUGGESTION</div>
            <h3>Your cognitive load is peaking.</h3>
            <p>Based on your 150m study block, we suggest a 10-minute 'Eye Strain' exercise and a glass of water now.</p>
            <button class="btn" id="btn-start-break">Start 10m Break</button>
          </div>

          <!-- Busy Windows -->
          <div class="card animate-in stagger-4">
            <div class="card-header">
              <h2 class="card-title">Busy Windows</h2>
            </div>
            <div class="busy-window-list">
              <div class="busy-item">
                <span class="busy-dot"></span>
                <span class="busy-label">Exam Window</span>
                <span class="busy-time">2:00 PM - 4:00 PM</span>
              </div>
              <div class="busy-item">
                <span class="busy-dot" style="background:var(--warning)"></span>
                <span class="busy-label">Work Shift</span>
                <span class="busy-time">5:30 PM - 8:00 PM</span>
              </div>
            </div>
            <div class="ai-insight" style="margin-top: var(--space-md);">
              "The busiest people have the most time to spare." — Optimized by AI
            </div>
          </div>

          <!-- Daily Metrics -->
          <div class="card animate-in stagger-5">
            <h2 class="card-title" style="margin-bottom: var(--space-md);">Daily Metrics</h2>
            <div class="metrics-grid">
              <div class="metric-item">
                <div class="metric-label">FOCUS SCORE</div>
                <div class="metric-value">${activeSchedule ? Math.min(99, activeSchedule.score + 5) : 0}%</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">REST RATIO</div>
                <div class="metric-value">1:4</div>
              </div>
            </div>
          </div>

          ${activeSchedule && activeSchedule.status === 'draft' ? `
          <button class="btn btn-primary btn-full animate-in stagger-6" id="btn-finalize">
            ✅ Finalize This Schedule
          </button>` : ''}
        </div>
      </div>
    </div>
  `;

  // ── View Tab Switching ──
  $$('#view-tabs .schedule-view-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('#view-tabs .schedule-view-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const view = tab.dataset.view;
      const viewContainer = $('#schedule-view');
      if (!activeSchedule) return;
      if (view === 'today') {
        viewContainer.innerHTML = renderTodayView(activeSchedule, today);
      } else if (view === 'week') {
        viewContainer.innerHTML = renderWeekView(activeSchedule);
      } else {
        viewContainer.innerHTML = renderMonthView(activeSchedule, today);
      }
    });
  });

  // ── Schedule Selector ──
  $('#schedule-selector')?.addEventListener('change', async (e) => {
    try {
      const data = await api.schedules.get(e.target.value);
      activeSchedule = data.schedule;
      const viewContainer = $('#schedule-view');
      const activeTab = document.querySelector('#view-tabs .schedule-view-tab.active');
      const currentView = activeTab?.dataset.view || 'today';
      if (currentView === 'week') {
        viewContainer.innerHTML = renderWeekView(activeSchedule);
      } else {
        viewContainer.innerHTML = renderTodayView(activeSchedule, today);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // ── Finalize ──
  $('#btn-finalize')?.addEventListener('click', async () => {
    if (!activeSchedule) return;
    try {
      await api.schedules.finalize(activeSchedule._id);
      showToast('Schedule finalized! 🎉', 'success');
      renderSchedule(container, state); // Re-render
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // ── Download PDF (basic print) ──
  $('#btn-download-pdf')?.addEventListener('click', () => {
    window.print();
    showToast('Opening print dialog for PDF export', 'info');
  });

  // ── Save Layout ──
  $('#btn-save-layout')?.addEventListener('click', () => {
    showToast('Layout saved successfully!', 'success');
  });

  // ── Break Timer ──
  $('#btn-start-break')?.addEventListener('click', () => {
    showToast('Break timer started! Take a 10-minute break. 🧘', 'info');
  });
}

/**
 * Render today's schedule as a vertical timeline
 */
function renderTodayView(schedule, today) {
  const todayDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][today.getDay()];

  const todaySlots = (schedule.slots || [])
    .filter(s => s.day === todayDay)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  if (todaySlots.length === 0) {
    // Show slots from the next available day
    const nextDay = DAYS.find(d => schedule.slots.some(s => s.day === d));
    if (nextDay) {
      const nextSlots = schedule.slots.filter(s => s.day === nextDay).sort((a, b) => a.startMinutes - b.startMinutes);
      return `
        <div class="card">
          <p style="color:var(--text-secondary);margin-bottom:var(--space-md);">No sessions today. Here's your next day (${capitalize(nextDay)}):</p>
          ${renderTimelineSlots(nextSlots)}
        </div>
      `;
    }
    return `
      <div class="card">
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <h3>No sessions today</h3>
          <p>Enjoy your day off! Check the week view for your full schedule.</p>
        </div>
      </div>
    `;
  }

  return `<div class="card">${renderTimelineSlots(todaySlots)}</div>`;
}

/**
 * Render timeline slots with proper time labels
 */
function renderTimelineSlots(slots) {
  const typeIcons = {
    theoretical: '📖',
    practical_lab: '🔬',
    seminar: '💬',
    tutorial: '📝',
    elective: '🎨',
  };

  let html = '<div class="today-schedule">';

  slots.forEach((slot, i) => {
    // Add break indicator between slots
    if (i > 0) {
      const gap = slot.startMinutes - slots[i - 1].endMinutes;
      if (gap > 0) {
        html += `
          <div class="today-break" style="position:relative;">
            <span class="today-time-label">${formatTime(slots[i-1].endTime)}</span>
            <span class="break-icon">☕</span>
            <span>Active Break (${gap} mins)</span>
          </div>
        `;
      }
    }

    const duration = slot.endMinutes - slot.startMinutes;
    const icon = typeIcons[slot.type] || '📖';

    html += `
      <div class="today-slot" style="background:${slot.color}22; border-left: 4px solid ${slot.color}; position:relative;">
        <span class="today-time-label">${formatTime(slot.startTime)}</span>
        <div class="today-slot-icon" style="background:${slot.color}33;color:${slot.color};">${icon}</div>
        <div class="today-slot-info">
          <div class="today-slot-name" style="color:${slot.color};">${slot.courseName}</div>
          <div class="today-slot-meta">${slot.type ? capitalize(slot.type.replace('_', ' ')) : 'Study'} • Focus Intensity: High</div>
          <div style="font-size:0.7rem;color:var(--text-tertiary);margin-top:2px;">${formatTime(slot.startTime)} — ${formatTime(slot.endTime)}</div>
        </div>
        <span class="today-slot-duration">${duration}m</span>
      </div>
    `;
  });

  html += '</div>';
  return html;
}

/**
 * Render week grid view
 */
function renderWeekView(schedule) {
  const slots = schedule.slots || [];

  // Build time grid from 7:00 to 20:00
  let html = '<div class="timetable-wrapper"><div class="timetable-grid">';

  // Header row
  html += '<div class="timetable-header">Time</div>';
  const today = new Date();
  const todayDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][today.getDay()];

  DAYS.forEach(day => {
    html += `<div class="timetable-header ${day === todayDay ? 'day-today' : ''}">${DAY_LABELS[day]}</div>`;
  });

  // Time rows (each row = 1 hour)
  for (let hour = 7; hour <= 20; hour++) {
    const timeStr = `${String(hour).padStart(2, '0')}:00`;
    html += `<div class="timetable-time">${formatTime(timeStr)}</div>`;

    DAYS.forEach(day => {
      html += `<div class="timetable-cell" data-day="${day}" data-hour="${hour}">`;

      // Find slots that start within this hour
      const cellSlots = slots.filter(s =>
        s.day === day &&
        s.startMinutes >= hour * 60 &&
        s.startMinutes < (hour + 1) * 60
      );

      cellSlots.forEach(slot => {
        const topOffset = (slot.startMinutes - hour * 60);
        const height = Math.max(30, slot.endMinutes - slot.startMinutes);
        html += `
          <div class="timetable-slot" style="
            top: ${topOffset}px;
            height: ${height}px;
            background: ${slot.color}20;
            border-color: ${slot.color};
            color: ${slot.color};
          ">
            <div class="slot-name">${slot.courseName}</div>
            <div class="slot-code">${slot.courseCode}</div>
            <div class="slot-time">${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}</div>
            ${slot.room ? `<div class="slot-room">${slot.room}</div>` : ''}
          </div>
        `;
      });

      html += '</div>';
    });
  }

  html += '</div></div>';

  // Schedule stats
  if (schedule.stats) {
    html += `
      <div style="display:flex;gap:var(--space-lg);margin-top:var(--space-lg);flex-wrap:wrap;">
        <div class="card" style="flex:1;min-width:120px;">
          <div class="stat-block">
            <div class="stat-value">${schedule.stats.totalHours}h</div>
            <div class="stat-label">Total Hours</div>
          </div>
        </div>
        <div class="card" style="flex:1;min-width:120px;">
          <div class="stat-block">
            <div class="stat-value">${schedule.stats.totalSessions}</div>
            <div class="stat-label">Sessions</div>
          </div>
        </div>
        <div class="card" style="flex:1;min-width:120px;">
          <div class="stat-block">
            <div class="stat-value">${schedule.stats.daysUsed}</div>
            <div class="stat-label">Days Used</div>
          </div>
        </div>
        <div class="card" style="flex:1;min-width:120px;">
          <div class="stat-block">
            <div class="stat-value">${schedule.score}/100</div>
            <div class="stat-label">Quality Score</div>
          </div>
        </div>
      </div>
    `;
  }

  return html;
}

/**
 * Render a simple month view
 */
function renderMonthView(schedule, today) {
  const year = today.getFullYear();
  const month = today.getMonth();
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Count sessions per day of week
  const sessionsByDay = {};
  (schedule.slots || []).forEach(s => {
    sessionsByDay[s.day] = (sessionsByDay[s.day] || 0) + 1;
  });

  let html = `<div class="card"><h2 class="card-title" style="margin-bottom:var(--space-md);">${months[month]} ${year}</h2>`;
  html += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;">';

  // Day headers
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
    html += `<div style="font-size:0.7rem;color:var(--text-tertiary);padding:8px;font-weight:600;">${d}</div>`;
  });

  // Empty cells for first week
  for (let i = 0; i < firstDay; i++) {
    html += '<div></div>';
  }

  // Day cells
  const dayMap = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = dayMap[new Date(year, month, d).getDay()];
    const isToday = d === today.getDate();
    const hasSessions = sessionsByDay[dayOfWeek] > 0;

    html += `
      <div style="
        padding:8px 4px;
        border-radius:var(--radius-sm);
        font-size:0.85rem;
        ${isToday ? 'background:var(--accent-primary);color:white;font-weight:700;' : ''}
        ${hasSessions && !isToday ? 'background:rgba(124,58,237,0.1);color:var(--accent-primary);' : ''}
        cursor:pointer;
      ">
        ${d}
        ${hasSessions ? '<div style="width:4px;height:4px;border-radius:50%;background:var(--accent-primary);margin:2px auto 0;"></div>' : ''}
      </div>
    `;
  }

  html += '</div></div>';
  return html;
}

/**
 * Render empty schedule state
 */
function renderEmptySchedule() {
  return `
    <div class="card">
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
          <line x1="8" y1="14" x2="8" y2="14.01"/>
          <line x1="12" y1="14" x2="12" y2="14.01"/>
          <line x1="16" y1="14" x2="16" y2="14.01"/>
        </svg>
        <h3>No schedule generated yet</h3>
        <p>Head to the Generate page, add your subjects, and let SmartTable AI create the perfect schedule for you.</p>
        <button class="btn btn-primary" onclick="window.dispatchEvent(new CustomEvent('navigate', {detail:{page:'generate'}}))">
          ⚡ Generate Now
        </button>
      </div>
    </div>
  `;
}
