import type { ContrePartie } from '../models';
import type { Partner } from '@applications/erp/shared/services/partners-api.service';

export function partnerToContrePartie(
  partner: Partner,
  type: 'CLIENT' | 'FOURNISSEUR',
): ContrePartie {
  return {
    id: partner.id,
    type,
    name: partner.raisonSociale,
    ice: partner.ice,
  };
}
