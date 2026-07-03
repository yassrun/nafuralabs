import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';
import { NC_TYPE_KEYS, type NonConformiteType } from '@applications/erp/shell/i18n-labels';

export function buildNcFields(t: TranslateService): DetailFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  const types: NonConformiteType[] = ['SECURITE', 'QUALITE', 'ENVIRONNEMENT', 'REGLEMENTAIRE'];
  return [
    { key: 'numero', label: tr('hse.nonConformite.form.fields.numero'), type: 'text', readonly: true },
    { key: 'date', label: tr('hse.nonConformite.form.fields.date'), type: 'date', required: true },
    {
      key: 'type', label: tr('hse.nonConformite.form.fields.type'), type: 'select', required: true,
      options: types.map((v) => ({ value: v, label: tr(NC_TYPE_KEYS[v]) })),
    },
    { key: 'chantierId', label: tr('hse.nonConformite.form.fields.chantier'), type: 'select', lookupKey: 'chantiers' },
    { key: 'zoneChantier', label: tr('hse.nonConformite.form.fields.zoneChantier'), type: 'text' },
    { key: 'description', label: tr('hse.nonConformite.form.fields.description'), type: 'textarea', required: true },
    { key: 'causesRacines', label: tr('hse.nonConformite.form.fields.causesRacines'), type: 'textarea' },
    { key: 'actionCorrective', label: tr('hse.nonConformite.form.fields.actionCorrective'), type: 'textarea' },
    { key: 'actionPreventive', label: tr('hse.nonConformite.form.fields.actionPreventive'), type: 'textarea' },
    { key: 'verificationEfficacite', label: tr('hse.nonConformite.form.fields.verificationEfficacite'), type: 'textarea' },
    { key: 'dateVerificationEfficacite', label: tr('hse.nonConformite.form.fields.dateVerificationEfficacite'), type: 'date' },
    { key: 'sourceInspectionNumero', label: tr('hse.nonConformite.form.fields.sourceInspectionNumero'), type: 'text' },
    { key: 'responsableNom', label: tr('hse.nonConformite.form.fields.responsableNom'), type: 'text' },
    { key: 'dateEcheance', label: tr('hse.nonConformite.form.fields.dateEcheance'), type: 'date' },
    { key: 'notes', label: tr('hse.nonConformite.form.fields.notes'), type: 'textarea' },
  ];
}
