import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';

export function buildPaieFields(t: TranslateService): DetailFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    { key: 'numero', label: tr('rh.paie.bulletin.fields.numero'), type: 'text', readonly: true },
    { key: 'employeId', label: tr('rh.paie.bulletin.fields.employeId'), type: 'select', lookupKey: 'employes' },
    { key: 'mois', label: tr('rh.paie.bulletin.fields.mois'), type: 'text' },
    { key: 'salaireBase', label: tr('rh.paie.bulletin.fields.salaireBase'), type: 'money-ma' },
    { key: 'indemniteRepresentation', label: tr('rh.paie.bulletin.fields.indemniteRepresentation'), type: 'money-ma' },
    { key: 'indemniteTransport', label: tr('rh.paie.bulletin.fields.indemniteTransport'), type: 'money-ma' },
    { key: 'montantHeuresSup', label: tr('rh.paie.bulletin.fields.heuresSup'), type: 'money-ma' },
    { key: 'notes', label: tr('rh.paie.bulletin.fields.notes'), type: 'textarea' },
    { key: 'salaireBrut', label: tr('rh.paie.bulletin.fields.salaireBrut'), type: 'money-ma', readonly: true },
    { key: 'cotisationCNSS', label: tr('rh.paie.bulletin.fields.cnss'), type: 'money-ma', readonly: true },
    { key: 'cotisationAMO', label: tr('rh.paie.bulletin.fields.amo'), type: 'money-ma', readonly: true },
    { key: 'totalRetenues', label: tr('rh.paie.bulletin.fields.totalRetenues'), type: 'money-ma', readonly: true },
    { key: 'salaireNetImposable', label: tr('rh.paie.bulletin.fields.netImposable'), type: 'money-ma', readonly: true },
    { key: 'igr', label: tr('rh.paie.bulletin.fields.igr'), type: 'money-ma', readonly: true },
    { key: 'salaireNetAPayer', label: tr('rh.paie.bulletin.fields.netAPayer'), type: 'money-ma', readonly: true },
  ];
}
