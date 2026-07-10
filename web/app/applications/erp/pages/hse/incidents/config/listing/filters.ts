import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';
import {
  GRAVITE_KEYS,
  INCIDENT_STATUS_KEYS,
  INCIDENT_TYPE_KEYS,
  type IncidentGravite,
  type IncidentStatus,
  type IncidentType,
} from '@applications/erp/shell/i18n-labels';

export function buildIncidentFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  const types: IncidentType[] = ['AT_TRAVAIL', 'AT_TRAJET', 'PRESQUE_ACCIDENT', 'DOMMAGE_MATERIEL', 'MP', 'AUTRE'];
  const statuses: IncidentStatus[] = ['DECLARE', 'EN_INVESTIGATION', 'CLOTURE'];
  const gravites: IncidentGravite[] = ['SANS_ARRET', 'AVEC_ARRET', 'GRAVE', 'MORTEL'];
  return [
    {
      key: 'chantierId', label: tr('hse.incident.list.filters.chantier'), type: 'select',
      lookupKey: 'chantiers',
    },
    {
      key: 'typeIncident', label: tr('hse.incident.list.filters.type'), type: 'select',
      options: types.map((v) => ({ value: v, label: tr(INCIDENT_TYPE_KEYS[v]) })),
    },
    {
      key: 'status', label: tr('hse.incident.list.filters.status'), type: 'select',
      options: statuses.map((v) => ({ value: v, label: tr(INCIDENT_STATUS_KEYS[v]) })),
    },
    {
      key: 'gravite', label: tr('hse.incident.list.filters.gravite'), type: 'select',
      options: gravites.map((v) => ({ value: v, label: tr(GRAVITE_KEYS[v]) })),
    },
  ];
}
