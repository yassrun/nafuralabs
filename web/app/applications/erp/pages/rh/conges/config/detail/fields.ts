import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';

export function buildCongeFields(t: TranslateService): DetailFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    { key: 'numero', label: tr('rh.conge.fields.numero'), type: 'text', readonly: true },
    { key: 'employeId', label: tr('rh.conge.fieldsRequired.employeId'), type: 'select', lookupKey: 'employes', required: true },
    {
      key: 'type', label: tr('rh.conge.fieldsRequired.type'), type: 'select', required: true,
      options: [
        { value: 'ANNUEL', label: tr('rh.conge.types.ANNUEL') },
        { value: 'MALADIE', label: tr('rh.conge.types.MALADIE') },
        { value: 'MATERNITE', label: tr('rh.conge.types.MATERNITE') },
        { value: 'SANS_SOLDE', label: tr('rh.conge.types.SANS_SOLDE') },
        { value: 'EXCEPTIONNEL', label: tr('rh.conge.types.EXCEPTIONNEL') },
      ],
    },
    { key: 'dateDebut', label: tr('rh.conge.fieldsRequired.dateDebut'), type: 'date', required: true },
    { key: 'dateFin', label: tr('rh.conge.fieldsRequired.dateFin'), type: 'date', required: true },
    { key: 'nombreJours', label: tr('rh.conge.fields.nombreJours'), type: 'number' },
    { key: 'motif', label: tr('rh.conge.fields.motif'), type: 'textarea' },
    { key: 'notes', label: tr('rh.conge.fields.notes'), type: 'textarea' },
    { key: 'motifRefus', label: tr('rh.conge.fields.motifRefus'), type: 'textarea', readonly: true },
  ];
}
