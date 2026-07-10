/**
 * I18n Configuration
 * 
 * Central configuration for internationalization.
 * Defines supported languages, default language, and fallback.
 */

export const I18N_CONFIG = {
  /** Default language (French) */
  defaultLanguage: 'fr',
  
  /** Fallback language if translation is missing */
  fallbackLanguage: 'en',
  
  /** Supported languages */
  supportedLanguages: ['fr', 'en', 'ar'] as const,
  
  /** Language storage key in localStorage */
  storageKey: 'seyrura:language',
} as const;

export type SupportedLanguage = typeof I18N_CONFIG.supportedLanguages[number];

/**
 * Get language from browser or localStorage, with fallback to default.
 */
export function getInitialLanguage(): string {
  // Try localStorage first
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = localStorage.getItem(I18N_CONFIG.storageKey);
    if (stored && I18N_CONFIG.supportedLanguages.includes(stored as SupportedLanguage)) {
      return stored;
    }
  }

  // Try browser language
  if (typeof window !== 'undefined' && window.navigator) {
    const browserLang = window.navigator.language.split('-')[0];
    if (I18N_CONFIG.supportedLanguages.includes(browserLang as SupportedLanguage)) {
      return browserLang;
    }
  }

  // Fallback to default
  return I18N_CONFIG.defaultLanguage;
}

/**
 * Save language preference to localStorage.
 */
export function saveLanguagePreference(lang: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(I18N_CONFIG.storageKey, lang);
  }
}
