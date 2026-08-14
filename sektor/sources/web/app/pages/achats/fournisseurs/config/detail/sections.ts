import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';

export function buildFournisseurSections(t: TranslateService): DetailSectionConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'identite',
      title: tr('achats.fournisseur.form.sections.identite'),
      icon: 'building',
      fields: ['raisonSociale', 'ice', 'rc', 'patente', 'adresse', 'ville', 'pays'],
      columns: 2,
    },
    {
      id: 'contact',
      title: tr('achats.fournisseur.form.sections.contact'),
      icon: 'user',
      fields: ['contactPrincipalNom', 'contactPrincipalTel', 'contactPrincipalEmail'],
      columns: 3,
    },
    {
      id: 'conditions',
      title: tr('achats.fournisseur.form.sections.conditions'),
      icon: 'credit-card',
      fields: ['conditionsPaiementParDefaut', 'modeReglementParDefaut', 'delaiLivraisonMoyen', 'rib', 'banque'],
      columns: 2,
    },
    {
      id: 'classification',
      title: tr('achats.fournisseur.form.sections.classification'),
      icon: 'tag',
      fields: ['categories', 'notation', 'isActive'],
      columns: 1,
    },
    {
      id: 'notes',
      title: tr('achats.fournisseur.form.sections.notes'),
      icon: 'file-text',
      fields: ['notes'],
      columns: 1,
    },
  ];
}
