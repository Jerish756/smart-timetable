/**
 * ═══════════════════════════════════════════════
 *  SmartTable AI — Dashboard Page
 *  Welcome, performance insights, task manager,
 *  pomodoro timer, AI study buddy
 * ═══════════════════════════════════════════════
 */

import { createElement, $, formatDate, getCurrentTime, getInitials, showToast } from '../utils.js';
import api from '../api.js';

/**
 * Render the dashboard page
 * @param {HTMLElement} container - The page container
 * @param {Object} state - Global app state
 */
export async function renderDashboard(container, state) {
  const user = state.user;
  const now = new Date();

  container.innerHTML = `
    <div class="dashboard-page">
      <!-- Welcome Section -->
      <div class="dashboard-welcome animate-in">
        <div class="welcome-text">
          <h1>Welcome, ${user?.name || 'Student'}</h1>
          <p>Ready to enter your <em>intellectual flow</em> today?</p>
        </div>
        <div class="welcome-time">
          <div class="welcome-clock" id="live-clock">${getCurrentTime()}</div>
          <div class="welcome-date">${formatDate(now)}</div>
        </div>
      </div>

      <!-- Main Dashboard Grid -->
      <div class="dashboard-grid">
        <!-- Left: Performance Insight -->
        <div class="dashboard-performance">
          <div class="card performance-card animate-in stagger-1">
            <div class="card-subtitle">📈 PERFORMANCE INSIGHT</div>
            <div class="performance-value" id="focus-days">
              <span id="focus-count">0</span> <span>days focused</span>
            </div>
            <p class="performance-text">You're building a solid foundation. Maintain this momentum for another <span id="remaining-days">7</span> days to hit your weekly target.</p>
            <div class="progress-bar" style="max-width: 350px; margin-top: var(--space-md);">
              <div class="progress-fill" id="week-progress" style="width: 0%;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; max-width: 350px; margin-top: var(--space-xs);">
              <span style="font-size: 0.7rem; color: var(--text-tertiary);">Day 1</span>
              <span style="font-size: 0.7rem; color: var(--text-tertiary);">Day 7 Goal</span>
            </div>
            <div class="flame-icon">🔥</div>
          </div>
        </div>

        <!-- Right: Quick Stats -->
        <div class="dashboard-stats-side">
          <div class="dashboard-stat-card animate-in stagger-2">
            <div class="stat-icon">📚</div>
            <div class="stat-label">Subjects</div>
            <div class="stat-value" id="stat-subjects">(0)</div>
          </div>
          <div class="dashboard-stat-card animate-in stagger-3">
            <div class="stat-icon">📅</div>
            <div class="stat-label">Next Exam</div>
            <div class="stat-value" style="font-size: 1rem;" id="stat-next-exam">—</div>
          </div>
          <div class="dashboard-stat-card animate-in stagger-4">
            <div class="stat-icon">🔥</div>
            <div class="stat-label">Busy Time</div>
            <div class="stat-value" style="font-size: 0.9rem;" id="stat-busy">09:00 - 17:00</div>
          </div>
          <div class="dashboard-stat-card animate-in stagger-5">
            <div class="stat-icon">✅</div>
            <div class="stat-label">Tasks Done</div>
            <div class="stat-value" id="stat-tasks">0/0</div>
          </div>
        </div>
      </div>

      <!-- Bottom Row -->
      <div class="dashboard-bottom">
        <!-- Task Manager -->
        <div class="card animate-in stagger-3" id="task-manager-card">
          <div class="card-header">
            <h2 class="card-title">Task manager</h2>
            <button class="course-action-btn" id="btn-add-task" style="opacity:1;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            </button>
          </div>
          <div class="task-list" id="task-list">
            <!-- Tasks render here -->
          </div>
          <div id="task-completed-area" style="margin-top: var(--space-md); text-align: center; color: var(--text-tertiary); font-size: 0.8rem;">
            <div style="font-size: 1.5rem; margin-bottom: var(--space-xs);">☑️</div>
            <span>No recent completed tasks</span>
          </div>
        </div>

        <!-- Pomodoro Timer -->
        <div class="card animate-in stagger-4" id="pomodoro-card">
          <div class="card-subtitle" style="text-align: center; margin-bottom: var(--space-md);">POMODORO TIMER</div>
          <div class="pomodoro-container">
            <div class="pomodoro-ring" id="pomodoro-ring">
              <svg viewBox="0 0 180 180">
                <circle class="ring-bg" cx="90" cy="90" r="87" />
                <circle class="ring-progress" id="pomo-progress" cx="90" cy="90" r="87" />
              </svg>
              <span class="pomodoro-time" id="pomo-time">25:00</span>
              <span class="pomodoro-label" id="pomo-label">Deep Focus</span>
            </div>
            <div class="pomodoro-presets" id="pomo-presets">
              <button class="pomodoro-preset" data-minutes="15">15m</button>
              <button class="pomodoro-preset active" data-minutes="25">25m</button>
              <button class="pomodoro-preset" data-minutes="45">45m</button>
              <button class="pomodoro-preset" data-minutes="60">60m</button>
            </div>
            <div class="pomodoro-actions">
              <button class="btn btn-primary" id="pomo-start">▶ Start</button>
              <button class="btn btn-ghost" id="pomo-reset">↻</button>
            </div>
          </div>
        </div>

        <!-- AI Study Buddy -->
        <div class="card animate-in stagger-5" id="ai-buddy-card">
          <div class="ai-buddy">
            <div class="ai-buddy-header">
              <div class="ai-avatar">🤖</div>
              <div>
                <strong style="font-size: 1rem;">AI Study Buddy</strong>
                <div class="ai-status">Online</div>
              </div>
            </div>
            <div class="ai-messages" id="ai-messages">
              <div class="ai-message bot">
                Hey ${user?.name || 'there'}! Ready to dive into your studies today? How can I help you?
              </div>
            </div>
            <div class="ai-suggestions" id="ai-suggestions">
              <button class="ai-suggestion" data-msg="Explain study tips">Study Tips</button>
              <button class="ai-suggestion" data-msg="Quiz me on my subjects">Quiz Me</button>
              <button class="ai-suggestion" data-msg="Summarize my schedule">My Schedule</button>
            </div>
            <div class="ai-input-row" style="margin-top: var(--space-md);">
              <input type="text" placeholder="Ask anything..." id="ai-input" />
              <button id="ai-send">▶</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ── Live Clock ──
  const clockEl = $('#live-clock');
  if (clockEl) {
    setInterval(() => {
      clockEl.textContent = getCurrentTime();
    }, 1000);
  }

  // ── Load Stats ──
  try {
    const coursesData = await api.courses.getAll();
    const subjectCount = coursesData.courses?.length || 0;
    const statSubjects = $('#stat-subjects');
    if (statSubjects) statSubjects.textContent = `(${subjectCount})`;

    // Focus days (simulated based on account age)
    const createdAt = new Date(user?.createdAt || Date.now());
    const daysSinceCreation = Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / 86400000));
    const focusDays = Math.min(daysSinceCreation, 7);
    const focusCount = $('#focus-count');
    if (focusCount) focusCount.textContent = focusDays;
    const remaining = $('#remaining-days');
    if (remaining) remaining.textContent = Math.max(0, 7 - focusDays);
    const weekProgress = $('#week-progress');
    if (weekProgress) weekProgress.style.width = `${(focusDays / 7) * 100}%`;
  } catch (e) {
    // Silently handle - stats show defaults
  }

  // ── Task Manager ──
  initTaskManager();

  // ── Pomodoro Timer ──
  initPomodoro();

  // ── AI Study Buddy ──
  initAIBuddy(user);
}

/**
 * Task Manager with localStorage persistence
 */
function initTaskManager() {
  const taskList = $('#task-list');
  const addBtn = $('#btn-add-task');
  if (!taskList || !addBtn) return;

  // Load tasks from localStorage
  let tasks = JSON.parse(localStorage.getItem('st_tasks') || '[]');

  const renderTasks = () => {
    const activeTasks = tasks.filter(t => !t.completed);
    const completedCount = tasks.filter(t => t.completed).length;

    taskList.innerHTML = activeTasks.length === 0
      ? '<div style="text-align:center; padding: 20px; color: var(--text-tertiary); font-size: 0.85rem;">No tasks yet. Click + to add one.</div>'
      : '';

    activeTasks.forEach(task => {
      const item = createElement('div', { className: 'task-item' });
      const checkbox = createElement('div', {
        className: 'task-checkbox',
        onClick: () => {
          task.completed = true;
          saveTasks();
          renderTasks();
          showToast('Task completed! 🎉', 'success');
        }
      });
      const text = createElement('span', { className: 'task-text' }, task.text);
      const deleteBtn = createElement('button', {
        className: 'course-action-btn',
        style: { opacity: '0.5' },
        onClick: (e) => {
          e.stopPropagation();
          tasks = tasks.filter(t => t.id !== task.id);
          saveTasks();
          renderTasks();
        },
        innerHTML: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      });
      item.append(checkbox, text, deleteBtn);
      taskList.appendChild(item);
    });

    // Update completed area
    const completedArea = $('#task-completed-area');
    if (completedArea) {
      completedArea.innerHTML = completedCount > 0
        ? `<div style="font-size:1.5rem;margin-bottom:4px;">✅</div><span>${completedCount} task${completedCount > 1 ? 's' : ''} completed</span>`
        : '<div style="font-size:1.5rem;margin-bottom:4px;">☑️</div><span>No recent completed tasks</span>';
    }

    // Update stat
    const statTasks = $('#stat-tasks');
    if (statTasks) statTasks.textContent = `${completedCount}/${tasks.length}`;
  };

  const saveTasks = () => {
    localStorage.setItem('st_tasks', JSON.stringify(tasks));
  };

  addBtn.addEventListener('click', () => {
    const text = prompt('Enter task:');
    if (text && text.trim()) {
      tasks.push({ id: Date.now(), text: text.trim(), completed: false });
      saveTasks();
      renderTasks();
    }
  });

  renderTasks();
}

/**
 * Pomodoro Timer — demonstrates setInterval, event handling
 */
function initPomodoro() {
  let duration = 25 * 60; // seconds
  let remaining = duration;
  let intervalId = null;
  let isRunning = false;
  const circumference = 2 * Math.PI * 87; // circle radius=87

  const timeEl = $('#pomo-time');
  const progressEl = $('#pomo-progress');
  const labelEl = $('#pomo-label');
  const startBtn = $('#pomo-start');
  const resetBtn = $('#pomo-reset');

  if (!timeEl || !progressEl) return;

  progressEl.style.strokeDasharray = circumference;
  progressEl.style.strokeDashoffset = 0;

  const updateDisplay = () => {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    timeEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const offset = circumference * (1 - remaining / duration);
    progressEl.style.strokeDashoffset = offset;
  };

  const start = () => {
    if (isRunning) {
      clearInterval(intervalId);
      isRunning = false;
      startBtn.textContent = '▶ Start';
      return;
    }

    isRunning = true;
    startBtn.textContent = '⏸ Pause';
    labelEl.textContent = 'Deep Focus';

    intervalId = setInterval(() => {
      remaining--;
      updateDisplay();

      if (remaining <= 0) {
        clearInterval(intervalId);
        isRunning = false;
        startBtn.textContent = '▶ Start';
        labelEl.textContent = 'Complete! 🎉';
        showToast('Pomodoro session complete! Take a break. 🎉', 'success');
      }
    }, 1000);
  };

  const reset = () => {
    clearInterval(intervalId);
    isRunning = false;
    remaining = duration;
    startBtn.textContent = '▶ Start';
    labelEl.textContent = 'Deep Focus';
    updateDisplay();
  };

  startBtn?.addEventListener('click', start);
  resetBtn?.addEventListener('click', reset);

  // Preset buttons
  const presets = document.querySelectorAll('.pomodoro-preset');
  presets.forEach(btn => {
    btn.addEventListener('click', () => {
      presets.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      duration = parseInt(btn.dataset.minutes) * 60;
      remaining = duration;
      clearInterval(intervalId);
      isRunning = false;
      startBtn.textContent = '▶ Start';
      labelEl.textContent = 'Deep Focus';
      updateDisplay();
    });
  });

  updateDisplay();
}

/**
 * AI Study Buddy — interactive chat using Gemini API
 */
function initAIBuddy(user) {
  const messagesEl = $('#ai-messages');
  const inputEl = $('#ai-input');
  const sendBtn = $('#ai-send');
  const suggestionsEl = $('#ai-suggestions');

  if (!messagesEl || !inputEl) return;

  const addMessage = (text, isBot = true, isTyping = false) => {
    const msg = createElement('div', {
      className: `ai-message ${isBot ? 'bot' : 'user'}`,
      style: isBot ? {} : { alignSelf: 'flex-end', background: 'var(--accent-primary)', color: 'white' }
    });
    if (isTyping) {
      msg.id = 'ai-typing-indicator';
      msg.innerHTML = '<span class="btn-loader" style="width: 14px; height: 14px; border-width: 2px; border-color: var(--text-tertiary); border-top-color: var(--accent-primary);"></span> <em>Thinking...</em>';
    } else {
      msg.innerHTML = text.replace(/\n/g, '<br/>'); // basic line break support
    }
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return msg;
  };

  const getResponse = async (input) => {
    const typingMsg = addMessage('', true, true);
    try {
      const response = await api.chat.sendMessage(input);
      typingMsg.remove();
      addMessage(response.text || 'I could not generate a response.', true);
    } catch (err) {
      typingMsg.remove();
      addMessage(`Oops! Error: ${err.message}`, true);
    }
  };

  const handleSend = () => {
    const text = inputEl.value.trim();
    if (!text) return;

    addMessage(text, false);
    inputEl.value = '';

    getResponse(text);
  };

  sendBtn?.addEventListener('click', handleSend);
  inputEl?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  // Suggestion buttons
  suggestionsEl?.querySelectorAll('.ai-suggestion').forEach(btn => {
    btn.addEventListener('click', () => {
      const msg = btn.dataset.msg;
      addMessage(msg, false);
      getResponse(msg);
    });
  });
}
