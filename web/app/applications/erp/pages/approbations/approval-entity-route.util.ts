import type { ApprovalEntityType } from './models';

/** Commandes `Router.navigate` vers la fiche source, ou `null` si non câblé en démo. */
export function approvalEntityRoute(type: ApprovalEntityType, entityId: string): string[] | null {
  switch (type) {
    case 'BC':
      return ['/achats/commandes', entityId];
    case 'DA':
      return ['/achats/demandes', entityId];
    case 'AVN':
      return ['/marches/avenants', entityId];
    case 'CONGE':
      return ['/rh/conges', entityId];
    case 'CONTRAT_ST':
      return ['/achats/contrats', entityId];
    case 'FF':
      return ['/finance/factures-fournisseurs', entityId];
    case 'FACTURE_CLIENT':
      return ['/ventes/factures', entityId];
    case 'AO':
      return ['/achats/appels-offres', entityId];
    case 'SIT':
      return ['/chantiers/situations', entityId];
    case 'PAIE':
      return ['/rh/paie', entityId];
    case 'VIR':
      return ['/finance/virements', entityId];
    case 'OS':
      return ['/marches/os'];
    case 'NOTE_FRAIS':
    default:
      return null;
  }
}
