/**
 * Authentication State Manager
 */

import { Api } from './api.js';

export const Auth = {
  USER_KEY: 'dms_auth_user',

  getUser() {
    try {
      const data = localStorage.getItem(this.USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.USER_KEY);
    }
  },

  isAuthenticated() {
    return this.getUser() !== null && Api.getToken() !== null;
  },

  async login(email, password) {
    const res = await Api.post('/auth/login', { email, password });
    if (res.success && res.data.user) {
      this.setUser(res.data.user);
      Api.setToken(res.data.token);
      return res.data.user;
    }
    throw new Error(res.message || 'Login failed.');
  },

  async checkSession() {
    try {
      const res = await Api.get('/auth/me');
      if (res.success && res.data.user) {
        this.setUser(res.data.user);
        return res.data.user;
      }
    } catch (e) {
      this.setUser(null);
      Api.setToken(null);
    }
    return null;
  },

  async logout() {
    try {
      await Api.post('/auth/logout');
    } catch {}
    this.setUser(null);
    Api.setToken(null);
    window.location.hash = '';
    window.location.reload();
  }
};
