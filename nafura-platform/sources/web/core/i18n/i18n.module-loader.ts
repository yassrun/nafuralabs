/**
 * I18n Module Loader
 * 
 * Custom loader for lazy-loading translation files by layer.
 * Supports fallback to default language if translation is missing.
 */

import { HttpClient } from '@angular/common/http';
import { TranslateLoader } from '@ngx-translate/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ModuleTranslationConfig {
  moduleId: string;
  path: string;
  optional?: boolean;
}

export interface TranslationLayersConfig {
  core?: ModuleTranslationConfig[];
  features?: ModuleTranslationConfig[];
  domains?: ModuleTranslationConfig[];
  applications?: ModuleTranslationConfig[];
  extras?: ModuleTranslationConfig[];
}

type TranslationLayer = keyof TranslationLayersConfig;

const DEFAULT_LAYER_ORDER: TranslationLayer[] = [
  'core',
  'features',
  'domains',
  'applications',
  'extras',
];

function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = { ...target };
  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = result[key];
    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      result[key] = sourceValue;
    }
  }
  return result;
}

interface LayeredModuleTranslationConfig extends ModuleTranslationConfig {
  layer: TranslationLayer;
}

function isLegacyModuleConfig(
  config: ModuleTranslationConfig[] | TranslationLayersConfig
): config is ModuleTranslationConfig[] {
  return Array.isArray(config);
}

function normalizeLayersConfig(
  config: ModuleTranslationConfig[] | TranslationLayersConfig
): LayeredModuleTranslationConfig[] {
  if (isLegacyModuleConfig(config)) {
    return config.map(module => ({ ...module, layer: 'features' }));
  }

  const normalized: LayeredModuleTranslationConfig[] = [];
  for (const layer of DEFAULT_LAYER_ORDER) {
    const modules = config[layer] ?? [];
    normalized.push(...modules.map(module => ({ ...module, layer })));
  }
  return normalized;
}

/**
 * Custom loader that loads translations per layer with fallback support.
 *
 * Merge precedence:
 * `core -> features -> domains -> applications -> extras`
 * (later layers override previous keys).
 */
export class ModuleTranslateLoader implements TranslateLoader {
  private readonly fallbackLang = 'en';
  private readonly basePath = '/assets/i18n';
  private readonly modules: LayeredModuleTranslationConfig[];

  constructor(
    private http: HttpClient,
    config: ModuleTranslationConfig[] | TranslationLayersConfig
  ) {
    this.modules = normalizeLayersConfig(config);
  }

  getTranslation(lang: string): Observable<Record<string, any>> {
    // Load all configured translation packs in parallel
    const moduleLoads = this.modules.map(module =>
      this.loadModuleTranslation(module, lang).pipe(
        catchError(() => {
          // If current language fails, try fallback
          if (lang !== this.fallbackLang) {
            return this.loadModuleTranslation(module, this.fallbackLang).pipe(
              catchError(() => {
                if (!module.optional) {
                  console.warn(
                    `Missing translation pack [${module.layer}] '${module.path}' for lang '${lang}' and fallback '${this.fallbackLang}'.`
                  );
                }
                return of({});
              })
            );
          }
          if (!module.optional) {
            console.warn(`Missing translation pack [${module.layer}] '${module.path}' for lang '${lang}'.`);
          }
          return of({});
        })
      )
    );

    return forkJoin(moduleLoads).pipe(
      map(translations => {
        // Merge translations into a single object.
        // JSON files are expected to expose namespaced keys (e.g. "docExtractor").
        let merged: Record<string, any> = {};
        translations.forEach(moduleTranslations => {
          if (moduleTranslations && Object.keys(moduleTranslations).length > 0) {
            merged = deepMerge(merged, moduleTranslations);
          }
        });
        return merged;
      }),
      catchError(() => of({}))
    );
  }

  private loadModuleTranslation(
    module: LayeredModuleTranslationConfig,
    lang: string
  ): Observable<Record<string, any>> {
    const url = `${this.basePath}/${module.path}/${lang}.json`;
    return this.http.get<Record<string, any>>(url);
  }
}

/**
 * Factory function to create the module loader.
 */
export function createModuleTranslateLoader(
  http: HttpClient,
  config: ModuleTranslationConfig[] | TranslationLayersConfig
): TranslateLoader {
  return new ModuleTranslateLoader(http, config);
}
