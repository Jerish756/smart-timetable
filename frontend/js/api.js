/**
 * ═══════════════════════════════════════════════
 *  SmartTable AI — API Service Module
 *  Handles all HTTP requests to the backend
 * ═══════════════════════════════════════════════
 */

const resolveApiBase = () => {
  if (window.__API_BASE__) {
    return window.__API_BASE__.replace(/\/$/, '');
  }

  const { protocol, hostname, port, origin } = window.location;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  // When the frontend is served by a static dev server (for example port 5500),
  // API calls still need to target the Express backend on port 5000.
  if (isLocalhost && port && port !== '5000') {
    return `${protocol}//${hostname}:5000/api`;
  }

  return `${origin}/api`;
};

const API_BASE = resolveApiBase();

/**
 * Core fetch wrapper with auth, error handling, and retries
 * Uses closures to encapsulate the auth token state
 */
const createApiClient = () => {
  // Closure: token is encapsulated here
  let authToken = localStorage.getItem('st_token') || null;

  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  };

  /**
   * Generic request handler with async/await
   */
  const request = async (endpoint, options = {}) => {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.text(); // Read as plain text first
      let jsonData;
      try {
        jsonData = JSON.parse(data); // Attempt to parse JSON
      } catch (e) {
        jsonData = null; // Handle invalid JSON
      }

      if (!response.ok) {
        // Handle 401 - token expired
        if (response.status === 401) {
          authToken = null;
          localStorage.removeItem('st_token');
          localStorage.removeItem('st_user');
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
        
        let errorMessage = `Request failed with status ${response.status}`;
        if (jsonData && jsonData.message) {
          errorMessage = jsonData.message;
        } else if (jsonData && jsonData.errors && Array.isArray(jsonData.errors)) {
          errorMessage = jsonData.errors[0].msg || jsonData.errors[0].message;
        }
        
        throw new Error(errorMessage);
      }

      if (jsonData === null) {
        throw new Error(`The server returned an invalid response (not JSON). Status: ${response.status}`);
      }

      return jsonData;
    } catch (error) {
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to server. Please check your connection.');
      }
      throw error;
    }
  };

  return {
    setToken(token) {
      authToken = token;
      if (token) {
        localStorage.setItem('st_token', token);
      } else {
        localStorage.removeItem('st_token');
      }
    },

    getToken() {
      return authToken;
    },

    // ── Auth Endpoints ──
    auth: {
      async login(email, password) {
        const data = await request('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        return data;
      },

      async register(name, email, password) {
        const data = await request('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        });
        return data;
      },

      async getMe() {
        return request('/auth/me');
      },

      async updatePreferences(preferences) {
        return request('/auth/preferences', {
          method: 'PUT',
          body: JSON.stringify(preferences),
        });
      },

      async updateProfile(profileData) {
        return request('/auth/profile', {
          method: 'PUT',
          body: JSON.stringify(profileData),
        });
      },
    },

    // ── Course Endpoints ──
    courses: {
      async getAll() {
        return request('/courses');
      },

      async get(id) {
        return request(`/courses/${id}`);
      },

      async create(courseData) {
        return request('/courses', {
          method: 'POST',
          body: JSON.stringify(courseData),
        });
      },

      async update(id, courseData) {
        return request(`/courses/${id}`, {
          method: 'PUT',
          body: JSON.stringify(courseData),
        });
      },

      async delete(id) {
        return request(`/courses/${id}`, {
          method: 'DELETE',
        });
      },
    },

    // ── Schedule Endpoints ──
    schedules: {
      async generate(options = {}) {
        return request('/schedules/generate', {
          method: 'POST',
          body: JSON.stringify(options),
        });
      },

      async getAll() {
        return request('/schedules');
      },

      async get(id) {
        return request(`/schedules/${id}`);
      },

      async update(id, scheduleData) {
        return request(`/schedules/${id}`, {
          method: 'PUT',
          body: JSON.stringify(scheduleData),
        });
      },

      async delete(id) {
        return request(`/schedules/${id}`, {
          method: 'DELETE',
        });
      },

      async finalize(id) {
        return request(`/schedules/${id}/finalize`, {
          method: 'PUT',
        });
      },
    },

    // ── Chat Endpoints ──
    chat: {
      async sendMessage(message) {
        return request('/chat', {
          method: 'POST',
          body: JSON.stringify({ message }),
        });
      }
    },

    // ── Health Check ──
    async health() {
      return request('/health');
    },
  };
};

// Singleton API client
const api = createApiClient();

export default api;
