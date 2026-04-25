/**
 * ═══════════════════════════════════════════════════════════
 *  SmartTable AI — Main Application Entry Point
 *  Single Page Application router, auth management,
 *  theme handling, and global event coordination
 *
 *  Demonstrates: ES6 modules, closures, event loop,
 *  async/await, DOM manipulation, scope management
 * ═══════════════════════════════════════════════════════════
 */

import api from './api.js';
import { $, $$, showToast, getInitials, debounce } from './utils.js';

// ── Page Module Imports (ES6 Modules) ──
import { renderDashboard } from './pages/dashboard.js';
import { renderGenerate } from './pages/generate.js';
import { renderSchedule } from './pages/schedule.js';
import { renderAnalytics } from './pages/analytics.js';
import { renderSettings } from './pages/settings.js';

/**
 * ═══════════════════════════════════
 *  Application State — using closure
 * ═══════════════════════════════════
 */
const createAppState = () => {
  // Private state (closure)
  let _state = {
    user: null,
    currentPage: 'dashboard',
    isAuthenticated: false,
    isLoading: false,
  };

  return {
    get user() { return _state.user; },
    set user(val) { _state.user = val; },
    get currentPage() { return _state.currentPage; },
    set currentPage(val) { _state.currentPage = val; },
    get isAuthenticated() { return _state.isAuthenticated; },
    set isAuthenticated(val) { _state.isAuthenticated = val; },
    get isLoading() { return _state.isLoading; },
    set isLoading(val) { _state.isLoading = val; },
    toJSON() { return { ..._state }; },
  };
};

const state = createAppState();

/**
 * ═══════════════════════════════════
 *  Page Router Map
 * ═══════════════════════════════════
 */
const PAGE_RENDERERS = {
  dashboard: renderDashboard,
  generate: renderGenerate,
  schedule: renderSchedule,
  analytics: renderAnalytics,
  settings: renderSettings,
};

/**
 * ═══════════════════════════════════
 *  Theme Management
 * ═══════════════════════════════════
 */
function initTheme() {
  const saved = localStorage.getItem('st_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('st_theme', next);
  showToast(`${next === 'dark' ? '🌙 Dark' : '☀️ Light'} mode activated`, 'success');
}

/**
 * ═══════════════════════════════════
 *  Authentication
 * ═══════════════════════════════════
 */
async function checkAuth() {
  const token = localStorage.getItem('st_token');
  const savedUser = localStorage.getItem('st_user');

  if (token && savedUser) {
    api.setToken(token);
    state.user = JSON.parse(savedUser);
    state.isAuthenticated = true;

    // Verify token is still valid (async)
    try {
      const data = await api.auth.getMe();
      state.user = data.user;
      localStorage.setItem('st_user', JSON.stringify(data.user));
    } catch (e) {
      // Token expired
      logout();
      return false;
    }
    return true;
  }
  return false;
}

function handleLoginSuccess(data) {
  api.setToken(data.token);
  state.user = data.user;
  state.isAuthenticated = true;
  localStorage.setItem('st_token', data.token);
  localStorage.setItem('st_user', JSON.stringify(data.user));

  showUI();
  navigateTo('dashboard');
  showToast(`Welcome back, ${data.user.name}! 🚀`, 'success');
}

function logout() {
  api.setToken(null);
  state.user = null;
  state.isAuthenticated = false;
  localStorage.removeItem('st_token');
  localStorage.removeItem('st_user');

  showAuthPage();
  showToast('Logged out successfully', 'info');
}

/**
 * ═══════════════════════════════════
 *  UI Show/Hide
 * ═══════════════════════════════════
 */
function showUI() {
  const app = $('#app');
  const authPage = $('#auth-page');
  const landingPage = $('#landing-page');
  if (app) app.style.display = 'flex';
  if (authPage) authPage.style.display = 'none';
  if (landingPage) landingPage.style.display = 'none';

  // Update user avatar
  const initials = $('#user-initials');
  if (initials && state.user) {
    initials.textContent = getInitials(state.user.name);
  }
}

function showAuthPage() {
  const app = $('#app');
  const authPage = $('#auth-page');
  const landingPage = $('#landing-page');
  if (app) app.style.display = 'none';
  if (authPage) authPage.style.display = 'block';
  if (landingPage) landingPage.style.display = 'none';
}

function showLandingPage() {
  const app = $('#app');
  const authPage = $('#auth-page');
  const landingPage = $('#landing-page');
  if (app) app.style.display = 'none';
  if (authPage) authPage.style.display = 'none';
  if (landingPage) landingPage.style.display = 'flex';
}

/**
 * ═══════════════════════════════════
 *  SPA Router — Navigate to a page
 * ═══════════════════════════════════
 */
async function navigateTo(page) {
  if (!PAGE_RENDERERS[page]) {
    console.warn(`Unknown page: ${page}`);
    page = 'dashboard';
  }

  state.currentPage = page;

  // Update navigation active states
  $$('.nav-item[data-page]').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
  $$('.topbar-link[data-page]').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  // Close mobile sidebar
  const sidebar = $('#sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');

  // Render page
  const container = $('#page-container');
  if (!container) return;

  // Show loading state
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:400px;">
      <div class="btn-loader" style="width:40px;height:40px;border-width:3px;border-color:var(--border-secondary);border-top-color:var(--accent-primary);"></div>
    </div>
  `;

  try {
    await PAGE_RENDERERS[page](container, state);
  } catch (err) {
    console.error(`Error rendering page ${page}:`, err);
    container.innerHTML = `
      <div class="empty-state">
        <h3>Something went wrong</h3>
        <p>${err.message}</p>
        <button class="btn btn-primary" onclick="location.reload()">Reload</button>
      </div>
    `;
  }
}

/**
 * ═══════════════════════════════════
 *  Event Listeners Setup
 * ═══════════════════════════════════
 */
function setupEventListeners() {
  // ── Auth Forms ──
  const loginForm = $('#login-form');
  const registerForm = $('#register-form');

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#btn-login');
    const errorEl = $('#login-error');
    const email = $('#login-email').value.trim();
    const password = $('#login-password').value;

    btn.querySelector('.btn-text').style.display = 'none';
    btn.querySelector('.btn-loader').style.display = 'inline-block';
    errorEl.style.display = 'none';

    try {
      const data = await api.auth.login(email, password);
      handleLoginSuccess(data);
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
    } finally {
      btn.querySelector('.btn-text').style.display = '';
      btn.querySelector('.btn-loader').style.display = 'none';
    }
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#btn-register');
    const errorEl = $('#register-error');
    const name = $('#register-name').value.trim();
    const email = $('#register-email').value.trim();
    const password = $('#register-password').value;

    btn.querySelector('.btn-text').style.display = 'none';
    btn.querySelector('.btn-loader').style.display = 'inline-block';
    errorEl.style.display = 'none';

    try {
      const data = await api.auth.register(name, email, password);
      handleLoginSuccess(data);
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
    } finally {
      btn.querySelector('.btn-text').style.display = '';
      btn.querySelector('.btn-loader').style.display = 'none';
    }
  });

  // ── Landing Page Buttons ──
  $('#btn-landing-start')?.addEventListener('click', () => {
    showAuthPage();
    $('#tab-register')?.click();
  });
  
  $('#btn-landing-login')?.addEventListener('click', () => {
    showAuthPage();
    $('#tab-login')?.click();
  });
  
  $('#btn-landing-join')?.addEventListener('click', () => {
    showAuthPage();
    $('#tab-register')?.click();
  });

  // ── Auth Tab Switching ──
  $$('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const isLogin = tab.dataset.tab === 'login';
      if (loginForm) loginForm.style.display = isLogin ? 'block' : 'none';
      if (registerForm) registerForm.style.display = isLogin ? 'none' : 'block';
    });
  });

  // ── Sidebar Navigation ──
  $$('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(item.dataset.page);
    });
  });

  // ── Topbar Navigation ──
  $$('.topbar-link[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.dataset.page);
    });
  });

  // ── Theme Toggle ──
  $('#btn-theme-toggle')?.addEventListener('click', toggleTheme);

  // ── Logout ──
  $('#nav-logout')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });
  $('#btn-logout-top')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });

  // ── Mobile Menu ──
  const mobileMenuBtn = $('#mobile-menu-btn');
  const sidebar = $('#sidebar');

  // Create overlay element
  const sidebarOverlay = document.createElement('div');
  sidebarOverlay.className = 'sidebar-overlay';
  document.body.appendChild(sidebarOverlay);

  mobileMenuBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    sidebarOverlay.classList.toggle('active');
  });

  sidebarOverlay.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    sidebarOverlay.classList.remove('active');
  });

  // ── New Study Session Button ──
  $('#btn-new-session')?.addEventListener('click', () => {
    navigateTo('generate');
  });

  // ── Custom Navigate Event ──
  window.addEventListener('navigate', (e) => {
    if (e.detail?.page) {
      navigateTo(e.detail.page);
    }
  });

  // ── Auth Logout Event (from API) ──
  window.addEventListener('auth:logout', () => {
    logout();
  });

  // ── Keyboard Shortcuts ──
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K = Search (placeholder)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      showToast('Search feature coming soon!', 'info');
    }
  });

  // ── Search Button ──
  $('#btn-search')?.addEventListener('click', () => {
    showToast('Search feature coming soon!', 'info');
  });

  // ── Support ──
  $('#nav-support')?.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Support: contact support@smarttable.ai', 'info');
  });
}

/**
 * ═══════════════════════════════════
 *  Application Bootstrap
 * ═══════════════════════════════════
 */
async function init() {
  // Initialize theme
  initTheme();

  // Setup global event listeners
  setupEventListeners();

  // Check authentication
  const isAuth = await checkAuth();

  if (isAuth) {
    showUI();
    navigateTo('dashboard');
  } else {
    showLandingPage();
  }
}

// ── Start the application when DOM is ready ──
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
