import { TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import adminFr from '@platform/platform/host/i18n/fr.json';

/** Minimal FR strings for sandbox admin lab + existing helpers. */
export const SANDBOX_FR = {
  ...adminFr,
  Filters: 'Filtres',
  Clear: 'Effacer',
  Apply: 'Appliquer',
  'No filters yet': 'Aucun filtre',
  'Add filter': 'Ajouter un filtre',
  'Add filter group': 'Ajouter un groupe',
  Group: 'Groupe',
  All: 'Tous',
  Yes: 'Oui',
  No: 'Non',
  'Remove filter': 'Retirer le filtre',
  shared: {
    filters: {
      reset: 'Réinitialiser',
      resetTitle: 'Réinitialiser les filtres',
      resetTooltip: 'Effacer les filtres actifs',
    },
  },
} as const;

export class SandboxTranslateLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, unknown>> {
    return of(SANDBOX_FR as unknown as Record<string, unknown>);
  }
}
