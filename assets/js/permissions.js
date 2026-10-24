/**
 * Client-Side Granular Role & Permission Enforcer
 */

import { Auth } from './auth.js';

export const Permissions = {
  can(moduleSlug, actionSlug) {
    const user = Auth.getUser();
    if (!user) return false;

    if (user.role_slug === 'super_admin') {
      return true;
    }

    const perms = user.permissions || [];
    const checkKey = `${moduleSlug}.${actionSlug}`;

    return perms.includes(checkKey) || perms.includes('*.*');
  },

  canAny(moduleSlug, actionSlugs = []) {
    return actionSlugs.some(act => this.can(moduleSlug, act));
  },

  enforceOrHide(element, moduleSlug, actionSlug) {
    if (!this.can(moduleSlug, actionSlug)) {
      element.style.display = 'none';
    }
  }
};
