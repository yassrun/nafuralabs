import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';
import { GRAVITE_KEYS, INCIDENT_TYPE_KEYS, type IncidentGravite, type IncidentType } from '@applications/erp/shell/i18n-labels';

export function buildIncidentFields(t: TranslateService): DetailFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  const types: IncidentType[] = ['AT_TRAVAIL', 'AT_TRAJET', 'PRESQUE_ACCIDENT', 'DOMMAGE_MATERIEL', 'MP', 'AUTRE'];
  const gravites: IncidentGravite[] = ['SANS_ARRET', 'AVEC_ARRET', 'GRAVE', 'MORTEL'];
  return [
    { key: 'numero', label: tr('hse.incident.form.fields.numero'), type: 'text', readonly: true },
    { key: 'date', label: tr('hse.incident.form.fields.date'), type: 'date', required: true },
    { key: 'heure', label: tr('hse.incident.form.fields.heure'), type: 'text' },
    { key: 'lieu', label: tr('hse.incident.form.fields.lieu'), type: 'text', required: true },
    { key: 'chantierId', label: tr('hse.incident.form.fields.chantier'), type: 'select', lookupKey: 'chantiers' },
    {
      key: 'typeIncident', label: tr('hse.incident.form.fields.typeIncident'), type: 'select',
      options: types.map((v) => ({ value: v, label: tr(INCIDENT_TYPE_KEYS[v]) })),
    },
    {
      key: 'gravite', label: tr('hse.incident.form.fields.gravite'), type: 'select', required: true,
      options: gravites.map((v) => ({ value: v, label: tr(GRAVITE_KEYS[v]) })),
    },
    { key: 'description', label: tr('hse.incident.form.fields.description'), type: 'textarea', required: true },
    { key: 'victimeNom', label: tr('hse.incident.form.fields.victimeNom'), type: 'text' },
    { key: 'cnssMatriculeVictime', label: tr('hse.incident.form.fields.cnssMatriculeVictime'), type: 'text' },
    { key: 'joursArret', label: tr('hse.incident.form.fields.joursArret'), type: 'number' },
    { key: 'planAction', label: tr('hse.incident.form.fields.planAction'), type: 'textarea' },
    { key: 'causes', label: tr('hse.incident.form.fields.causes'), type: 'textarea' },
    { key: 'actionsImmedites', label: tr('hse.incident.form.fields.actionsImmediates'), type: 'textarea' },
    { key: 'cnssReferenceDeclaration', label: tr('hse.incident.form.fields.cnssReferenceDeclaration'), type: 'text', readonly: true },
    { key: 'cnssDateDeclaration', label: tr('hse.incident.form.fields.cnssDateDeclaration'), type: 'date', readonly: true },
    { key: 'notes', label: tr('hse.incident.form.fields.notes'), type: 'textarea' },
  ];
}
