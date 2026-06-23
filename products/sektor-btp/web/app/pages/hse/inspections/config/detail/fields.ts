import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';

export function buildInspectionFields(t: TranslateService): DetailFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    { key: 'numero', label: tr('hse.inspection.form.fields.numero'), type: 'text', readonly: true },
    { key: 'dateInspection', label: tr('hse.inspection.form.fields.date'), type: 'date', required: true },
    { key: 'chantierId', label: tr('hse.inspection.form.fields.chantier'), type: 'select', lookupKey: 'chantiers' },
    { key: 'inspecteurNom', label: tr('hse.inspection.form.fields.inspecteur'), type: 'text', required: true },
    { key: 'thematique', label: tr('hse.inspection.form.fields.thematique'), type: 'text', required: true },
    { key: 'nbObservations', label: tr('hse.inspection.form.fields.nbObservations'), type: 'number' },
    { key: 'nbNonConformites', label: tr('hse.inspection.form.fields.nbNonConformites'), type: 'number' },
    { key: 'noteGlobale', label: tr('hse.inspection.form.fields.noteGlobale'), type: 'number' },
    { key: 'observations', label: tr('hse.inspection.form.fields.observations'), type: 'textarea' },
    { key: 'notes', label: tr('hse.inspection.form.fields.notes'), type: 'textarea' },
  ];
}
