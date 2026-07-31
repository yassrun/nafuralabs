import { InjectionToken } from '@angular/core';

import type { SearchResult } from '../shell/command-palette/command-palette.types';

/** Mirrors onboarding Tour — kept here to avoid circular imports. */
export interface ProductTourStep {
  id: string;
  title: string;
  body: string;
  selector?: string;
  route?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export interface ProductTour {
  id: string;
  name: string;
  steps: ProductTourStep[];
}

export interface ProductShortcutDef {
  keys: string;
  description: string;
  category: 'Navigation' | 'Actions' | 'Interface';
}

export interface WhatsAppTemplateDef {
  category: 'UTILITY' | 'AUTHENTICATION' | 'MARKETING';
  bodyFr: string;
  requiredVars: string[];
}

/** Product onboarding tours (empty in platform; Sektor provides ERP tours). */
export const PRODUCT_ONBOARDING_TOURS = new InjectionToken<ProductTour[]>(
  'PRODUCT_ONBOARDING_TOURS',
  {
    providedIn: 'root',
    factory: () => [],
  },
);

/** URL prefix → tour id for contextual auto-start. */
export const PRODUCT_ROUTE_TOUR_MAP = new InjectionToken<{ prefix: string; tourId: string }[]>(
  'PRODUCT_ROUTE_TOUR_MAP',
  { providedIn: 'root', factory: () => [] },
);

export interface ProductShortcutsConfig {
  shortcuts: ProductShortcutDef[];
  /** Single-letter key after `g` → route */
  gotoMap: Record<string, string>;
}

export const PRODUCT_SHORTCUTS = new InjectionToken<ProductShortcutsConfig>('PRODUCT_SHORTCUTS', {
  providedIn: 'root',
  factory: () => ({
    shortcuts: [
      { keys: 'Ctrl+K / ⌘K / Ctrl+⇧P / Alt+K', description: 'Command palette', category: 'Interface' },
      { keys: '?', description: 'Toggle assistant', category: 'Interface' },
      { keys: 'Ctrl+/', description: 'Keyboard shortcuts help', category: 'Interface' },
      { keys: 'Esc', description: 'Close modal / drawer', category: 'Actions' },
      { keys: 'Ctrl+S', description: 'Save form', category: 'Actions' },
    ],
    gotoMap: {},
  }),
});

/** Extra command-palette “create” actions (product-specific). */
export const PRODUCT_PALETTE_ACTIONS = new InjectionToken<SearchResult[]>(
  'PRODUCT_PALETTE_ACTIONS',
  { providedIn: 'root', factory: () => [] },
);

export interface NotFoundSuggestion {
  route: string;
  label: string;
}

export interface NotFoundPageConfig {
  suggestions: NotFoundSuggestion[];
  footer: string;
}

export const PRODUCT_NOT_FOUND_CONFIG = new InjectionToken<NotFoundPageConfig>(
  'PRODUCT_NOT_FOUND_CONFIG',
  {
    providedIn: 'root',
    factory: () => ({
      suggestions: [],
      footer: 'Nafura',
    }),
  },
);

/** Browser tab base title (e.g. "Sektor"). */
export const PRODUCT_DISPLAY_NAME = new InjectionToken<string>('PRODUCT_DISPLAY_NAME', {
  providedIn: 'root',
  factory: () => 'Nafura',
});

/** First URL segment → AI conversation domain key. */
export const PRODUCT_AI_DOMAIN_BY_SEGMENT = new InjectionToken<Record<string, string>>(
  'PRODUCT_AI_DOMAIN_BY_SEGMENT',
  { providedIn: 'root', factory: () => ({}) },
);

/** WhatsApp message templates keyed by template id. */
export const PRODUCT_WHATSAPP_TEMPLATES = new InjectionToken<
  Record<string, WhatsAppTemplateDef>
>('PRODUCT_WHATSAPP_TEMPLATES', {
  providedIn: 'root',
  factory: () => ({}),
});
