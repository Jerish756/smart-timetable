/**
 * ═══════════════════════════════════════════════
 *  SmartTable AI — Settings Page
 *  Theme, preferences, profile, security
 * ═══════════════════════════════════════════════
 */

import { $, showToast } from '../utils.js';
import api from '../api.js';

/**
 * Render the Settings page
 */
export async function renderSettings(container, state) {
  const user = state.user || {};
  const prefs = user.preferences || {};
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  container.innerHTML = `
    <div class="settings-page">
      <div class="page-header animate-in">
        <h1>Settings</h1>
        <p class="page-subtitle">Customize your SmartTable AI experience.</p>
      </div>

      <!-- Appearance -->
      <div class="settings-section animate-in stagger-1">
        <h2>🎨 Appearance</h2>
        <div class="settings-row">
          <div class="setting-info">
            <div class="setting-label">Dark Mode</div>
            <div class="setting-desc">Toggle between dark and light themes</div>
          </div>
          <div class="setting-control">
            <label class="toggle">
              <input type="checkbox" id="setting-dark-mode" ${isDark ? 'checked' : ''} />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        <div class="settings-row">
          <div class="setting-info">
            <div class="setting-label">Accent Color</div>
            <div class="setting-desc">Choose your primary accent color</div>
          </div>
          <div class="setting-control">
            <div class="color-options" id="accent-colors">
              <div class="color-option selected" data-color="#7C3AED" style="background:#7C3AED"></div>
              <div class="color-option" data-color="#3B82F6" style="background:#3B82F6"></div>
              <div class="color-option" data-color="#10B981" style="background:#10B981"></div>
              <div class="color-option" data-color="#F59E0B" style="background:#F59E0B"></div>
              <div class="color-option" data-color="#EC4899" style="background:#EC4899"></div>
              <div class="color-option" data-color="#EF4444" style="background:#EF4444"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Profile -->
      <div class="settings-section animate-in stagger-2">
        <h2>👤 Profile</h2>
        <div class="form-group">
          <label for="setting-name">Full Name</label>
          <input type="text" id="setting-name" value="${user.name || ''}" />
        </div>
        <div class="form-group">
          <label for="setting-email">Email Address</label>
          <input type="email" id="setting-email" value="${user.email || ''}" />
        </div>
        <div class="settings-actions">
          <button class="btn btn-primary" id="btn-save-profile">Save Profile</button>
        </div>
      </div>

      <!-- Schedule Preferences -->
      <div class="settings-section animate-in stagger-3">
        <h2>⚙️ Schedule Preferences</h2>
        <div class="settings-row">
          <div class="setting-info">
            <div class="setting-label">No morning classes</div>
            <div class="setting-desc">Avoid scheduling sessions before 10:00 AM</div>
          </div>
          <div class="setting-control">
            <label class="toggle">
              <input type="checkbox" id="setting-no-morning" ${prefs.noMorningClasses ? 'checked' : ''} />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        <div class="settings-row">
          <div class="setting-info">
            <div class="setting-label">Evenings only</div>
            <div class="setting-desc">Only schedule sessions after 5:00 PM</div>
          </div>
          <div class="setting-control">
            <label class="toggle">
              <input type="checkbox" id="setting-evenings" ${prefs.eveningsOnly ? 'checked' : ''} />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        <div class="form-row" style="margin-top: var(--space-md);">
          <div class="form-group">
            <label for="setting-intensity">Schedule Intensity</label>
            <select id="setting-intensity">
              <option value="balanced" ${prefs.scheduleIntensity === 'balanced' ? 'selected' : ''}>Balanced</option>
              <option value="compressed" ${prefs.scheduleIntensity === 'compressed' ? 'selected' : ''}>Compressed</option>
              <option value="distributed" ${prefs.scheduleIntensity === 'distributed' ? 'selected' : ''}>Distributed</option>
            </select>
          </div>
          <div class="form-group">
            <label for="setting-break">Break Duration</label>
            <select id="setting-break">
              <option value="15" ${prefs.breakDuration === 15 ? 'selected' : ''}>15 minutes</option>
              <option value="30" ${prefs.breakDuration === 30 ? 'selected' : ''}>30 minutes</option>
              <option value="45" ${!prefs.breakDuration || prefs.breakDuration === 45 ? 'selected' : ''}>45 minutes</option>
              <option value="60" ${prefs.breakDuration === 60 ? 'selected' : ''}>60 minutes</option>
              <option value="90" ${prefs.breakDuration === 90 ? 'selected' : ''}>90 minutes</option>
            </select>
          </div>
        </div>
        <div class="form-row" style="margin-top: var(--space-md);">
          <div class="form-group">
            <label for="setting-wake">Wake Up Time</label>
            <input type="time" id="setting-wake" value="${prefs.wakeTime || '07:00'}" />
          </div>
          <div class="form-group">
            <label for="setting-sleep">Sleep Time</label>
            <input type="time" id="setting-sleep" value="${prefs.sleepTime || '22:00'}" />
          </div>
        </div>
        <div class="settings-actions">
          <button class="btn btn-primary" id="btn-save-prefs">Save Preferences</button>
        </div>
      </div>

      <!-- Data Management -->
      <div class="settings-section animate-in stagger-4">
        <h2>🗄️ Data Management</h2>
        <div class="settings-row">
          <div class="setting-info">
            <div class="setting-label">Export Data</div>
            <div class="setting-desc">Download all your courses and schedules as JSON</div>
          </div>
          <div class="setting-control">
            <button class="btn btn-secondary btn-sm" id="btn-export">Export</button>
          </div>
        </div>
        <div class="settings-row">
          <div class="setting-info">
            <div class="setting-label">Clear Local Data</div>
            <div class="setting-desc">Remove tasks, exams, and preferences from this browser</div>
          </div>
          <div class="setting-control">
            <button class="btn btn-danger btn-sm" id="btn-clear-data">Clear</button>
          </div>
        </div>
      </div>

      <!-- About -->
      <div class="settings-section animate-in stagger-5" style="text-align:center;">
        <div style="font-size:2rem;margin-bottom:var(--space-sm);">
          <svg width="40" height="40" viewBox="0 0 28 28" fill="none" style="display:inline;">
            <path d="M14 2L2 8l12 6 12-6-12-6z" fill="url(#gradS)" />
            <path d="M2 20l12 6 12-6" stroke="url(#gradS)" stroke-width="2" fill="none" />
            <path d="M2 14l12 6 12-6" stroke="url(#gradS)" stroke-width="2" fill="none" />
            <defs><linearGradient id="gradS" x1="0" y1="0" x2="28" y2="28"><stop stop-color="#7C3AED" /><stop offset="1" stop-color="#3B82F6" /></linearGradient></defs>
          </svg>
        </div>
        <h3>SmartTable AI</h3>
        <p style="color:var(--text-tertiary);font-size:0.85rem;">v1.0.0 • Designed for Intellectual Flow</p>
        <p style="color:var(--text-tertiary);font-size:0.8rem;margin-top:var(--space-xs);">Built with Node.js, Express, MongoDB, and Vanilla JS</p>
      </div>
    </div>
  `;

  // ── Dark Mode Toggle ──
  $('#setting-dark-mode')?.addEventListener('change', (e) => {
    const theme = e.target.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('st_theme', theme);
    showToast(`${theme === 'dark' ? '🌙 Dark' : '☀️ Light'} mode activated`, 'success');
  });

  // ── Accent Color ──
  document.querySelectorAll('#accent-colors .color-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('#accent-colors .color-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      document.documentElement.style.setProperty('--accent-primary', opt.dataset.color);
      showToast('Accent color updated!', 'success');
    });
  });

  // ── Save Profile ──
  $('#btn-save-profile')?.addEventListener('click', async () => {
    try {
      const name = $('#setting-name').value.trim();
      const email = $('#setting-email').value.trim();
      if (!name || !email) {
        showToast('Name and email are required', 'error');
        return;
      }
      await api.auth.updateProfile({ name, email });
      state.user.name = name;
      state.user.email = email;
      localStorage.setItem('st_user', JSON.stringify(state.user));

      // Update UI
      const initials = document.getElementById('user-initials');
      if (initials) initials.textContent = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

      showToast('Profile updated!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // ── Save Preferences ──
  $('#btn-save-prefs')?.addEventListener('click', async () => {
    try {
      const preferences = {
        noMorningClasses: $('#setting-no-morning').checked,
        eveningsOnly: $('#setting-evenings').checked,
        scheduleIntensity: $('#setting-intensity').value,
        breakDuration: parseInt($('#setting-break').value),
        wakeTime: $('#setting-wake').value,
        sleepTime: $('#setting-sleep').value,
      };
      await api.auth.updatePreferences(preferences);
      state.user.preferences = preferences;
      localStorage.setItem('st_user', JSON.stringify(state.user));
      showToast('Preferences saved!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // ── Export Data ──
  $('#btn-export')?.addEventListener('click', async () => {
    try {
      const [coursesData, schedulesData] = await Promise.all([
        api.courses.getAll(),
        api.schedules.getAll()
      ]);
      const exportData = {
        user: state.user,
        courses: coursesData.courses,
        schedules: schedulesData.schedules,
        tasks: JSON.parse(localStorage.getItem('st_tasks') || '[]'),
        exams: JSON.parse(localStorage.getItem('st_exams') || '[]'),
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smarttable-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Data exported successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // ── Clear Local Data ──
  $('#btn-clear-data')?.addEventListener('click', () => {
    if (!confirm('This will clear all local data (tasks, exams, preferences). Are you sure?')) return;
    localStorage.removeItem('st_tasks');
    localStorage.removeItem('st_exams');
    showToast('Local data cleared', 'info');
  });
}
