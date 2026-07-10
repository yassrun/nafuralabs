/**
 * Theme service: applies branding primary color to platform CSS variables.
 * Holds current branding for shell (logo, display name). Updated on app init and after save.
 */

import { Injectable, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

const DEFAULT_PRIMARY = '#1b3fae';

/** Minimal branding shape used by shell and settings (same as API). */
export interface TenantBranding {
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  tenantDisplayName: string | null;
}

/**
 * Parse hex color to RGB (0–255). Supports #rgb and #rrggbb.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.replace(/^#/, '').match(/^([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return null;
  let r: number, g: number, b: number;
  if (match[1].length === 3) {
    r = parseInt(match[1][0] + match[1][0], 16);
    g = parseInt(match[1][1] + match[1][1], 16);
    b = parseInt(match[1][2] + match[1][2], 16);
  } else {
    r = parseInt(match[1].slice(0, 2), 16);
    g = parseInt(match[1].slice(2, 4), 16);
    b = parseInt(match[1].slice(4, 6), 16);
  }
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, h + 1 / 3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1 / 3);
  }
  return { r: r * 255, g: g * 255, b: b * 255 };
}

function hueToRgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

/**
 * Lighten a hex color by a percentage (0–100). HSL-based.
 */
export function lighten(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l = Math.min(100, hsl.l + percent);
  const out = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(out.r, out.g, out.b);
}

/**
 * Darken a hex color by a percentage (0–100). HSL-based.
 */
export function darken(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l = Math.max(0, hsl.l - percent);
  const out = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(out.r, out.g, out.b);
}

/**
 * Relative luminance (0–1) for WCAG.
 */
function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Return white or black for text on the given background (WCAG AA).
 */
export function contrastText(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#ffffff';
  const L = luminance(rgb.r, rgb.g, rgb.b);
  return L > 0.179 ? '#000000' : '#ffffff';
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly title = inject(Title);
  private readonly document = inject(DOCUMENT);

  readonly defaultPrimary = DEFAULT_PRIMARY;

  /** Current branding (logo, display name, primary color). Set on shell init and after settings save. */
  readonly branding = signal<TenantBranding | null>(null);

  /**
   * Update branding and apply primary color. Call after fetch on init and after save in settings.
   */
  setBranding(b: TenantBranding | null): void {
    this.branding.set(b);
    this.applyPrimaryColor(b?.primaryColor ?? null);
    this.applyDocumentChrome(b);
  }

  /**
   * Met à jour l’onglet du navigateur et le favicon (Task 15.1).
   */
  applyDocumentChrome(b: TenantBranding | null): void {
    const base = 'Sektor';
    const name = b?.tenantDisplayName?.trim();
    this.title.setTitle(name ? `${base} — ${name}` : base);
    const link = this.document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) return;
    const fv = b?.faviconUrl?.trim();
    if (!fv) {
      link.href = '/favicon.ico';
      return;
    }
    try {
      link.href = new URL(fv, this.document.defaultView?.location?.href ?? 'http://localhost').href;
    } catch {
      link.href = '/favicon.ico';
    }
  }

  /**
   * Apply primary color to document CSS variables.
   * Called on app init and after saving branding.
   */
  applyPrimaryColor(hex: string | null): void {
    const color = hex && /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(hex) ? hex : DEFAULT_PRIMARY;
    const root = document.documentElement;
    root.style.setProperty('--nf-color-primary', color);
    root.style.setProperty('--nf-color-primary-light', lighten(color, 15));
    root.style.setProperty('--nf-color-primary-dark', darken(color, 15));
    root.style.setProperty('--nf-color-primary-contrast', contrastText(color));
  }
}
