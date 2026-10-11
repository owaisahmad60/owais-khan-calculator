/**
 * Pure theme resolution and storage utilities for S-13 Light and Dark Theme.
 * Does not depend on React.
 */

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'emi_calc_theme';

/**
 * Pure decision logic: resolves the effective theme based on stored value and device preference.
 *
 * Rules:
 * - A valid stored choice ('light' or 'dark') takes precedence over device preference.
 * - If stored value is missing (null/undefined) or invalid, falls back to device preference.
 * - If device preference is dark (true), returns 'dark', otherwise 'light'.
 */
export function resolveTheme(
  storedValue: string | null | undefined,
  systemPrefersDark: boolean
): Theme {
  if (storedValue === 'dark') {
    return 'dark';
  }
  if (storedValue === 'light') {
    return 'light';
  }
  return systemPrefersDark ? 'dark' : 'light';
}

/**
 * Safely reads stored theme from localStorage.
 * Returns null if window is undefined, localStorage is unavailable, or access is blocked.
 */
export function getStoredTheme(): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(THEME_STORAGE_KEY);
    }
  } catch {
    // Storage access blocked or quota exceeded
  }
  return null;
}

/**
 * Safely saves theme choice to localStorage.
 * Fails gracefully without throwing if storage access is blocked.
 */
export function setStoredTheme(theme: Theme): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
      return true;
    }
  } catch {
    // Storage access blocked or quota exceeded
  }
  return false;
}
