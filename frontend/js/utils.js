/**
 * ═══════════════════════════════════════════════
 *  SmartTable AI — Utility Functions
 *  DOM helpers, formatters, toast system
 * ═══════════════════════════════════════════════
 */

/**
 * Create DOM element with attributes and children
 * Uses object manipulation for clean element creation
 */
export function createElement(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);

  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(el.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      const event = key.slice(2).toLowerCase();
      el.addEventListener(event, value);
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dk, dv]) => {
        el.dataset[dk] = dv;
      });
    } else if (key === 'innerHTML') {
      el.innerHTML = value;
    } else {
      el.setAttribute(key, value);
    }
  });

  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  });

  return el;
}

/**
 * Query shorthand
 */
export const $ = (selector, parent = document) => parent.querySelector(selector);
export const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

/**
 * Toast notification system — uses event loop for auto-dismiss
 */
export function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = createElement('div', { className: `toast toast-${type}` },
    createElement('span', {}, message)
  );

  container.appendChild(toast);

  // Demonstrate async behavior / event loop
  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Format time from "HH:MM" (24h) to "h:MM AM/PM"
 */
export function formatTime(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Format date nicely
 */
export function formatDate(date) {
  const d = new Date(date);
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Get current time as "HH:MM"
 */
export function getCurrentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

/**
 * Debounce function — demonstrates closures and scope
 */
export function debounce(fn, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle function
 */
export function throttle(fn, limit = 300) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Get user initials from name
 */
export function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/**
 * Generate a random ID
 */
export function randomId() {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Color mappings for course types
 */
export const COURSE_COLORS = [
  '#3B5BF7', '#8B5CF6', '#EC4899', '#10B981',
  '#F59E0B', '#EF4444', '#06B6D4', '#6366F1',
  '#14B8A6', '#F97316', '#8B5CF6', '#84CC16'
];

/**
 * Day names mapping
 */
export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
export const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };
export const DAY_FULL = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' };

/**
 * Time slots for the timetable grid (7:00 to 21:00)
 */
export const TIME_SLOTS = [];
for (let h = 7; h <= 20; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
}

/**
 * Show/hide modal
 */
export function showModal(contentHTML) {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  if (!overlay || !content) return;

  content.innerHTML = contentHTML;
  overlay.style.display = 'flex';

  // Close on overlay click
  overlay.onclick = (e) => {
    if (e.target === overlay) hideModal();
  };

  // Close on Escape
  const handler = (e) => {
    if (e.key === 'Escape') {
      hideModal();
      document.removeEventListener('keydown', handler);
    }
  };
  document.addEventListener('keydown', handler);
}

export function hideModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.style.display = 'none';
}

/**
 * Smooth stagger animation for elements
 */
export function animateElements(container, selector = '.animate-in') {
  const elements = container.querySelectorAll(selector);
  elements.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.animationDelay = `${i * 0.05}s`;
    requestAnimationFrame(() => {
      el.style.opacity = '';
    });
  });
}
