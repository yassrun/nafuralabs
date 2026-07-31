import { Pipe, PipeTransform } from '@angular/core';

/**
 * PluralFr — French pluralization helper (legacy).
 *
 * @deprecated Phase 4.1 (Wave D1) — Use ngx-translate ICU MessageFormat instead.
 *
 * Migration path: declare a single ICU key in your module's i18n pack and
 * resolve it via `TranslateService.instant` (TS) or the `translate` pipe (HTML).
 *
 * @example
 * // ❌ Legacy (do not introduce new usages)
 * {{ count | pluralFr:'item' }}
 *
 * // ✅ ICU MessageFormat — JSON (FR):
 * //   "entities.list.count": "{count, plural, =0 {Aucun élément} one {1 élément} other {# éléments}}"
 * // ✅ ICU MessageFormat — JSON (EN):
 * //   "entities.list.count": "{count, plural, =0 {No item} one {1 item} other {# items}}"
 * // ✅ HTML
 * {{ 'entities.list.count' | translate:{ count: items.length } }}
 * // ✅ TS
 * this.translate.instant('entities.list.count', { count: items.length });
 *
 * The pipe is preserved (no breaking removal) but flagged: no new usage should
 * appear in this codebase. `npm run i18n:check` and the ICU spec guard the
 * convention. See `web/docs/specs/i18n-roadmap/00-PROGRESS.md` — Phase 4.1.
 */
@Pipe({ name: 'pluralFr', standalone: true, pure: true })
export class PluralFrPipe implements PipeTransform {
  transform(count: number, singular: string, plural?: string): string {
    const pluralForm = plural ?? singular + 's';
    return `${count} ${count <= 1 ? singular : pluralForm}`;
  }
}
