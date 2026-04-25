/**
 * ═══════════════════════════════════════════════
 *  SmartTable AI — Analytics Page
 *  Study insights, subject focus, upcoming exams
 * ═══════════════════════════════════════════════
 */

import { $, showToast, capitalize, DAYS, DAY_LABELS } from '../utils.js';
import api from '../api.js';

/**
 * Render the Analytics page
 */
export async function renderAnalytics(container, state) {
  let courses = [];
  let schedules = [];

  try {
    const [coursesData, schedulesData] = await Promise.all([
      api.courses.getAll(),
      api.schedules.getAll()
    ]);
    courses = coursesData.courses || [];
    schedules = schedulesData.schedules || [];
  } catch (e) {
    // Will show with defaults
  }

  const activeSchedule = schedules.find(s => s.status === 'finalized') || schedules[0];
  const stats = activeSchedule?.stats || {};

  // Calculate subject focus data
  const subjectHours = {};
  if (activeSchedule) {
    activeSchedule.slots?.forEach(slot => {
      const duration = (slot.endMinutes - slot.startMinutes) / 60;
      subjectHours[slot.courseName] = (subjectHours[slot.courseName] || 0) + duration;
    });
  }

  const totalHours = Object.values(subjectHours).reduce((s, h) => s + h, 0) || 1;

  // Day distribution for chart
  const dayDistribution = {};
  DAYS.forEach(d => dayDistribution[d] = 0);
  if (activeSchedule) {
    activeSchedule.slots?.forEach(slot => {
      dayDistribution[slot.day] = (dayDistribution[slot.day] || 0) + (slot.endMinutes - slot.startMinutes) / 60;
    });
  }
  const maxDayHours = Math.max(...Object.values(dayDistribution), 1);
  const todayDayName = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];

  // Exams from localStorage
  const exams = JSON.parse(localStorage.getItem('st_exams') || '[]')
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

  container.innerHTML = `
    <div class="analytics-page">
      <!-- Header -->
      <div class="page-header animate-in">
        <h1>Performance Analytics</h1>
        <p class="page-subtitle">Track your intellectual flow and study efficiency through data-driven insights.</p>
      </div>

      <!-- Main Analytics Grid -->
      <div class="analytics-grid">
        <!-- Study Blocks Chart -->
        <div class="card animate-in stagger-1">
          <div class="card-header">
            <div>
              <h2 class="card-title">Study Blocks Generated</h2>
              <div class="card-subtitle">WEEKLY OUTPUT • MON - SUN</div>
            </div>
            <div style="display:flex;gap:var(--space-xs);">
              <button class="date-nav-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg></button>
              <button class="date-nav-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="9 18 15 12 9 6"/></svg></button>
            </div>
          </div>
          <div class="chart-container" id="weekly-chart">
            ${DAYS.map(day => {
              const height = dayDistribution[day] > 0 ? (dayDistribution[day] / maxDayHours) * 200 : 10;
              const isActive = day === todayDayName;
              return `<div class="chart-bar ${isActive ? 'active' : ''}" style="height:${height}px;" title="${capitalize(day)}: ${dayDistribution[day].toFixed(1)}h"></div>`;
            }).join('')}
          </div>
          <div class="chart-labels">
            ${DAYS.map(day => `<span class="chart-label ${day === todayDayName ? 'active' : ''}">${DAY_LABELS[day]}</span>`).join('')}
          </div>
        </div>

        <!-- Subject Focus -->
        <div class="card card-accent animate-in stagger-2">
          <h2 class="card-title" style="margin-bottom: var(--space-lg);">Subject Focus</h2>
          <div class="subject-progress" id="subject-progress">
            ${courses.length > 0 ? courses.map(course => {
              const hours = subjectHours[course.name] || 0;
              const percentage = Math.round((hours / totalHours) * 100);
              return `
                <div class="subject-progress-item">
                  <div class="subject-progress-header">
                    <span class="subject-progress-name">${course.name}</span>
                    <span class="subject-progress-value" style="color:${course.color};">${percentage}% Goal</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" style="width:${percentage}%;background:${course.color};"></div>
                  </div>
                  <div class="subject-progress-focus">Focus: ${course.type ? capitalize(course.type.replace('_', ' ')) : 'General'}</div>
                </div>
              `;
            }).join('') : '<div style="text-align:center;color:var(--text-tertiary);padding:20px;">Add courses to see focus data</div>'}
          </div>

          ${courses.length > 0 ? `
          <div class="ai-insight" style="margin-top: var(--space-lg);">
            AI Insight: ${courses[0] ? `Increase ${courses[0].name} focus on Tuesday mornings to hit weekly targets.` : 'Generate a schedule to get AI insights.'}
          </div>` : ''}
        </div>
      </div>

      <!-- Bottom Row -->
      <div class="analytics-bottom">
        <!-- Busy Window Alert -->
        <div class="card analytics-alert-card animate-in stagger-3">
          <span class="alert-badge" style="position:relative;">ALERT</span>
          <h2 class="card-title" style="font-size:1.5rem; margin-top:var(--space-sm);">Busy Window</h2>
          <p style="color:var(--text-secondary);font-size:0.9rem;">
            ${stats.longestDay ? `You have a high-density collision between 14:00 - 16:30 this ${stats.longestDay}.` : 'No schedule conflicts detected. Great job!'}
          </p>
          ${stats.longestDay ? `
          <div class="alert-overlap">
            <div class="alert-overlap-icon">⚠️</div>
            <div>
              <strong>${stats.totalSessions || 0} Sessions</strong><br/>
              <span style="font-size:0.8rem;color:var(--text-tertiary);">Schedule Overlap on ${stats.longestDay}</span>
            </div>
          </div>` : ''}
          <button class="btn btn-secondary" style="width:100%;margin-top:var(--space-md);" onclick="window.dispatchEvent(new CustomEvent('navigate',{detail:{page:'schedule'}}))">
            Optimize Gap
          </button>
        </div>

        <!-- Upcoming Exams -->
        <div class="card animate-in stagger-4">
          <div class="card-header">
            <h2 class="card-title">Upcoming Exams</h2>
            <a href="#" style="font-size:0.8rem;color:var(--accent-primary);font-weight:600;" onclick="window.dispatchEvent(new CustomEvent('navigate',{detail:{page:'generate'}}));return false;">View Calendar ↗</a>
          </div>
          <div class="exams-list">
            ${exams.length > 0 ? exams.slice(0, 4).map(exam => {
              const d = new Date(exam.date);
              const daysUntil = Math.ceil((d - new Date()) / 86400000);
              const priority = daysUntil <= 7 ? 'Critical' : 'Stable';
              const dotColor = daysUntil <= 7 ? 'var(--danger)' : 'var(--success)';
              return `
                <div class="exam-card">
                  <div class="exam-date-badge">
                    <span class="day">${d.getDate()}</span>
                    <span class="month">${months[d.getMonth()]}</span>
                  </div>
                  <div class="exam-info">
                    <div class="exam-name">${exam.name}</div>
                    <div class="exam-details">${exam.type || 'Assessment'}</div>
                  </div>
                  <div class="exam-status">
                    <div class="exam-priority">
                      <span class="dot" style="background:${dotColor}"></span>
                      ${priority}
                    </div>
                    <div class="exam-next-session">${daysUntil > 0 ? `In ${daysUntil} days` : 'Today!'}</div>
                  </div>
                </div>
              `;
            }).join('') : `
              <div style="text-align:center;padding:30px;color:var(--text-tertiary);font-size:0.85rem;">
                No upcoming exams.<br/>Add exam dates on the Generate page.
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- Overall Stats -->
      ${activeSchedule ? `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-md);" class="animate-in stagger-5">
        <div class="card">
          <div class="stat-block">
            <div class="stat-value">${stats.totalHours || 0}h</div>
            <div class="stat-label">Weekly Hours</div>
          </div>
        </div>
        <div class="card">
          <div class="stat-block">
            <div class="stat-value">${stats.totalSessions || 0}</div>
            <div class="stat-label">Total Sessions</div>
          </div>
        </div>
        <div class="card">
          <div class="stat-block">
            <div class="stat-value">${stats.averagePerDay || 0}h</div>
            <div class="stat-label">Avg Per Day</div>
          </div>
        </div>
        <div class="card">
          <div class="stat-block">
            <div class="stat-value">${activeSchedule.score}</div>
            <div class="stat-label">Quality Score</div>
          </div>
        </div>
      </div>` : ''}
    </div>
  `;
}
