/**
 * Tests for the theme utility functions (S-13).
 * These are pure-logic tests; they do not depend on a browser environment.
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  type Theme,
  THEME_STORAGE_KEY,
  resolveTheme,
  getStoredTheme,
  setStoredTheme,
} from './theme';

// ---------------------------------------------------------------------------
// resolveTheme — pure function, no mocking needed
// ---------------------------------------------------------------------------

describe('resolveTheme', () => {
  it('returns "dark" when stored value is "dark", regardless of system', () => {
    expect(resolveTheme('dark', false)).toBe<Theme>('dark');
    expect(resolveTheme('dark', true)).toBe<Theme>('dark');
  });

  it('returns "light" when stored value is "light", regardless of system', () => {
    expect(resolveTheme('light', false)).toBe<Theme>('light');
    expect(resolveTheme('light', true)).toBe<Theme>('light');
  });

  it('falls back to system preference when stored value is null', () => {
    expect(resolveTheme(null, true)).toBe<Theme>('dark');
    expect(resolveTheme(null, false)).toBe<Theme>('light');
  });

  it('falls back to system preference when stored value is undefined', () => {
    expect(resolveTheme(undefined, true)).toBe<Theme>('dark');
    expect(resolveTheme(undefined, false)).toBe<Theme>('light');
  });

  it('falls back to system preference when stored value is an unrecognised string', () => {
    expect(resolveTheme('auto', true)).toBe<Theme>('dark');
    expect(resolveTheme('system', false)).toBe<Theme>('light');
    expect(resolveTheme('', false)).toBe<Theme>('light');
  });
});

// ---------------------------------------------------------------------------
// getStoredTheme / setStoredTheme — require a localStorage stub
// ---------------------------------------------------------------------------

describe('getStoredTheme / setStoredTheme', () => {
  // Build a minimal localStorage mock
  let store: Record<string, string> = {};

  const localStorageMock = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };

  beforeEach(() => {
    store = {};
    vi.clearAllMocks();
    // Provide window.localStorage on the global object (jsdom / happy-dom)
    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: localStorageMock },
      writable: true,
      configurable: true,
    });
  });

  it('getStoredTheme returns null when nothing is stored', () => {
    expect(getStoredTheme()).toBeNull();
  });

  it('setStoredTheme saves the theme and getStoredTheme retrieves it', () => {
    const saved = setStoredTheme('dark');
    expect(saved).toBe(true);
    expect(getStoredTheme()).toBe('dark');
  });

  it('setStoredTheme can overwrite a previous choice', () => {
    setStoredTheme('dark');
    setStoredTheme('light');
    expect(getStoredTheme()).toBe('light');
  });

  it('setStoredTheme uses the correct storage key', () => {
    setStoredTheme('dark');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dark');
  });

  it('getStoredTheme returns null when localStorage throws', () => {
    localStorageMock.getItem.mockImplementationOnce(() => {
      throw new Error('SecurityError: storage blocked');
    });
    expect(getStoredTheme()).toBeNull();
  });

  it('setStoredTheme returns false when localStorage throws', () => {
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('QuotaExceededError');
    });
    const result = setStoredTheme('light');
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Acceptance criteria cross-checks (S-13)
// ---------------------------------------------------------------------------

describe('S-13 acceptance criteria', () => {
  it('AC-1: system dark -> resolves to dark when no stored choice', () => {
    expect(resolveTheme(null, true)).toBe('dark');
  });

  it('AC-1: system light -> resolves to light when no stored choice', () => {
    expect(resolveTheme(null, false)).toBe('light');
  });

  it('AC-3: stored choice wins over system preference', () => {
    // User chose light but system is dark
    expect(resolveTheme('light', true)).toBe('light');
    // User chose dark but system is light
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('AC-4 (storage blocked): resolveTheme still works with null stored value', () => {
    // When getStoredTheme returns null (blocked storage), resolveTheme still works
    expect(resolveTheme(null, false)).toBe('light');
    expect(resolveTheme(null, true)).toBe('dark');
  });
});

// ---------------------------------------------------------------------------
// Static checks for CSS theme icon visibility rules
// ---------------------------------------------------------------------------

describe('Theme icon CSS visibility rules (static)', () => {
  const cssPath = path.resolve(__dirname, '../app/globals.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  it('does not have an overriding .theme-toggle svg display rule', () => {
    expect(css).not.toMatch(/\.theme-toggle\s+svg\s*\{[^}]*display:\s*block/);
  });

  it('hides sun icon and shows moon icon under :root[data-theme="light"]', () => {
    expect(css).toMatch(/:root\[data-theme="light"\]\s+\.theme-icon-sun\s*\{\s*display:\s*none;\s*\}/);
    expect(css).toMatch(/:root\[data-theme="light"\]\s+\.theme-icon-moon\s*\{\s*display:\s*block;\s*\}/);
  });

  it('shows sun icon and hides moon icon under :root[data-theme="dark"]', () => {
    expect(css).toMatch(/:root\[data-theme="dark"\]\s+\.theme-icon-sun\s*\{\s*display:\s*block;\s*\}/);
    expect(css).toMatch(/:root\[data-theme="dark"\]\s+\.theme-icon-moon\s*\{\s*display:\s*none;\s*\}/);
  });

  it('handles :root:not([data-theme]) in prefers-color-scheme media queries', () => {
    expect(css).toMatch(/:root:not\(\[data-theme\]\)\s+\.theme-icon-sun\s*\{\s*display:\s*block;\s*\}/);
    expect(css).toMatch(/:root:not\(\[data-theme\]\)\s+\.theme-icon-moon\s*\{\s*display:\s*none;\s*\}/);
  });
});
