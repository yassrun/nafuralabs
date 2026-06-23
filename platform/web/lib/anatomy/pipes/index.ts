/**
 * Barrel pour les pipes du package `@lib/anatomy/pipes`.
 *
 * ============================================================================
 *   Pipes locale-aware (Phase 1.3 / agent B3)
 * ============================================================================
 * Préfère ces wrappers aux pipes Angular natifs (`| date`, `| number`,
 * `| currency`, `| percent`) pour que le format suive la langue runtime
 * (FR / EN / AR) quand l'utilisateur change de langue à chaud.
 *
 * Codemod Wave C : `| date` → `| dateLocalized`, `| number` → `| numberLocalized`,
 * `| currency:'MAD'` → `| currencyLocalized` (MAD est le défaut), `| percent`
 * → `| percentLocalized`.
 */

export { DateLocalizedPipe } from './date-localized.pipe';
export { NumberLocalizedPipe } from './number-localized.pipe';
export { CurrencyLocalizedPipe } from './currency-localized.pipe';
export { PercentLocalizedPipe } from './percent-localized.pipe';
