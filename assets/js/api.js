/**
 * Centralized AJAX Fetch Client with Interceptors
 */

import { Toast } from './components/toast.js';

export const API_BASE = (typeof window !== 'undefined' && window.__DMS_CONFIG__?.apiBase)
  ? window.__DMS_CONFIG__.apiBase
  : (typeof window !== 'undefined' && (window.location.pathname.startsWith('/DMS') || window.location.pathname.startsWith('/dms')) ? '/DMS/api' : '/api');

export const Api = {
  activeApiBase: null,
  _useFallback: false,

  getToken() {
    return localStorage.getItem('dms_auth_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('dms_auth_token', token);
    } else {
      localStorage.removeItem('dms_auth_token');
    }
  },

  async request(endpoint, options = {}) {
    const base = this.activeApiBase || API_BASE;
    const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Show subtle top loading indicator
    this.showLoading();

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'same-origin'
      });

      this.hideLoading();

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        // If server returned 404 (e.g. Apache AllowOverride / mod_rewrite disabled on live host)
        // and we haven't switched to index.php fallback yet, retry once with direct script entry:
        if (response.status === 404 && !this._useFallback && !url.includes('index.php')) {
          this._useFallback = true;
          const rootPrefix = API_BASE.replace(/\/api\/?$/, '');
          this.activeApiBase = (rootPrefix ? rootPrefix : '') + '/api/index.php';
          const fallbackEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
          return this.request(fallbackEndpoint, options);
        }

        const errorMsg = data?.message || `Request failed with status ${response.status}`;
        
        if (response.status === 401) {
          // Unauthenticated: clear token and notify
          this.setToken(null);
          localStorage.removeItem('dms_auth_user');
          window.dispatchEvent(new CustomEvent('dms:unauthenticated'));
        } else if (response.status === 403) {
          Toast.error(errorMsg || 'Access Denied: You do not have permission for this action.');
        } else {
          Toast.error(errorMsg);
        }

        const err = new Error(errorMsg);
        err.status = response.status;
        err.data = data;
        throw err;
      }

      return data;
    } catch (err) {
      this.hideLoading();
      throw err;
    }
  },

  get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request(url, { method: 'GET' });
  },

  post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  showLoading() {
    let bar = document.getElementById('top-loading-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'top-loading-bar';
      bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;background:var(--primary);width:30%;z-index:99999;transition:width 0.2s ease, opacity 0.2s;';
      document.body.appendChild(bar);
    }
    bar.style.opacity = '1';
    bar.style.width = '70%';
  },

  hideLoading() {
    const bar = document.getElementById('top-loading-bar');
    if (bar) {
      bar.style.width = '100%';
      setTimeout(() => {
        bar.style.opacity = '0';
        setTimeout(() => { bar.style.width = '0%'; }, 200);
      }, 150);
    }
  }
};
