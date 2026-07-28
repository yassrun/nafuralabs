import type { TranslateService } from '@ngx-translate/core';

import type { DetailSectionConfig } from '@lib/anatomy/types';

export function buildEmployeSections(t: TranslateService): DetailSectionConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      id: 'identite',
      title: tr('rh.employe.sections.identite'),
      icon: 'user',
      fields: ['nom', 'prenom', 'cin', 'cnss', 'dateNaissance', 'telephone', 'email', 'adresse', 'ville'],
      columns: 3,
    },
    {
      id: 'contrat',
      title: tr('rh.employe.sections.contrat'),
      icon: 'file-text',
      fields: ['matricule', 'typeContrat', 'categorie', 'poste', 'departement', 'dateEmbauche', 'dateFinContrat', 'statut'],
      columns: 3,
    },
    {
      id: 'remuneration',
      title: tr('rh.employe.sections.remuneration'),
      icon: 'banknote',
      fields: ['salaireBase', 'indemniteRepresentation', 'indemniteTransport', 'banque', 'rib'],
      columns: 3,
    },
    {
      id: 'notes',
      title: tr('rh.employe.sections.notes'),
      icon: 'file',
      fields: ['notes'],
      columns: 1,
    },
  ];
}
