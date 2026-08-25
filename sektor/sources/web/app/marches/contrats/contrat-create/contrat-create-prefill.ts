import type { Chantier } from '../../../chantiers/models';

/** Returns only the contractual date recorded on the chantier. */
export function ordreServicePrefill(chantier: Pick<Chantier, 'dateOrdreService'>): string {
  return chantier.dateOrdreService ?? '';
}
