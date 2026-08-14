export const THEME_OPTIONS = [
  { labelKey: 'userSettings.preferences.theme.light', value: 'light' },
  { labelKey: 'userSettings.preferences.theme.dark', value: 'dark' },
  { labelKey: 'userSettings.preferences.theme.system', value: 'system' },
] as const;

export const DATE_FORMAT_OPTIONS = [
  'YYYY-MM-DD',
  'DD/MM/YYYY',
  'MM/DD/YYYY',
] as const;

/** Locale value and display label (aligned with I18N_CONFIG). */
export const PREFERENCES_LOCALE_OPTIONS: { value: string; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' },
];

/**
 * Format today's date using a pattern (YYYY, MM, DD placeholders).
 */
export function formatDatePreview(pattern: string): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return pattern
    .replace('YYYY', String(y))
    .replace('MM', m)
    .replace('DD', d);
}
