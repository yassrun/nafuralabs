import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';

export function buildFormationFields(t: TranslateService): DetailFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    { key: 'numero', label: tr('hse.formation.form.fields.numero'), type: 'text', readonly: true },
    { key: 'titre', label: tr('hse.formation.form.fields.titre'), type: 'text', required: true },
    { key: 'dateDebut', label: tr('hse.formation.form.fields.dateDebut'), type: 'date', required: true },
    { key: 'dateFin', label: tr('hse.formation.form.fields.dateFin'), type: 'date' },
    { key: 'dureeHeures', label: tr('hse.formation.form.fields.dureeHeures'), type: 'number', required: true },
    { key: 'formateur', label: tr('hse.formation.form.fields.formateur'), type: 'text' },
    { key: 'lieu', label: tr('hse.formation.form.fields.lieu'), type: 'text' },
    { key: 'nbParticipants', label: tr('hse.formation.form.fields.nbParticipants'), type: 'number' },
    { key: 'notes', label: tr('hse.formation.form.fields.notes'), type: 'textarea' },
  ];
}
