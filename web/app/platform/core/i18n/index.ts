/**
 * I18n Module Exports
 */

export { I18nService } from './i18n.service';
export { I18N_CONFIG, getInitialLanguage, saveLanguagePreference, type SupportedLanguage } from './i18n.config';
export { ArabicNumeralsService, ARABIC_NUMERALS_STORAGE_KEY } from './arabic-numerals.service';
export {
  createModuleTranslateLoader,
  ModuleTranslateLoader,
  type ModuleTranslationConfig,
  type TranslationLayersConfig,
} from './i18n.module-loader';
