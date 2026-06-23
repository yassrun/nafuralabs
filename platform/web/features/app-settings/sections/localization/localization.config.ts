export const DATE_FORMAT_OPTIONS = [
  'YYYY-MM-DD',
  'DD/MM/YYYY',
  'MM/DD/YYYY',
] as const;

export const NUMBER_FORMAT_OPTIONS = ['#,##0.00', '#.##0,00'] as const;

/** Locale value and display label (from I18N_CONFIG available locales) */
export const LOCALE_OPTIONS: { value: string; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' },
];

/** Currency code and display label with symbol */
export const CURRENCY_OPTIONS: { value: string; label: string }[] = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'MAD', label: 'Moroccan Dirham (MAD)' },
  { value: 'GBP', label: 'British Pound (£)' },
];

const SAMPLE_NUMBER = 1234.56;

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

/**
 * Format a sample number using pattern (# = digit, , or . as separators).
 * #,##0.00 -> 1,234.56; #.##0,00 -> 1.234,56
 */
export function formatNumberPreview(pattern: string): string {
  const num = SAMPLE_NUMBER;
  const parts = num.toFixed(2).split('.');
  const intPart = parts[0];
  const decPart = parts[1];

  if (pattern.includes(',') && pattern.lastIndexOf(',') > pattern.lastIndexOf('.')) {
    // European: #.##0,00
    const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${intFormatted},${decPart}`;
  }
  // US: #,##0.00
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${intFormatted}.${decPart}`;
}
