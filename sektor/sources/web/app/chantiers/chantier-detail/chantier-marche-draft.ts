import type { Chantier } from '../models';
import type { Marche } from '../../marches/models';

/**
 * Builds the contract draft from values explicitly stored on the chantier.
 * Contractual dates must never be inferred from another date.
 */
export function chantierToMarcheDraft(chantier: Chantier): Partial<Marche> {
  return {
    numero: chantier.marcheReference?.trim() || `MAR-${chantier.code}`,
    intitule: chantier.name,
    chantierId: chantier.id,
    chantierCode: chantier.code,
    chantierNom: chantier.name,
    clientId: chantier.clientId,
    clientNom: chantier.clientName ?? '',
    type: 'FORFAIT',
    nature: 'PRIVE_PME',
    montantInitialHt: chantier.budgetHt,
    tvaTaux: chantier.tvaTaux,
    retenueGarantieTaux: 7,
    retenueSourceTaux: 0,
    dateOrdreService: chantier.dateOrdreService,
    status: 'EN_EXECUTION',
  };
}
