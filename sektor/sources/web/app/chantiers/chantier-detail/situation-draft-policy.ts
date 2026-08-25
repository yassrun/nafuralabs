import type { Chantier } from '../models';
import type { Marche } from '../../marches/models';

type SituationChantier = Pick<
  Chantier,
  'id' | 'marcheReference' | 'budgetHt' | 'cautionGarantie'
>;

type SituationMarche = Pick<Marche, 'id' | 'numero' | 'montantTotalHt' | 'retenueGarantieTaux'>;

export interface ActiveSituationReference {
  id: string;
  numero: string;
  montantHt: number;
  labelKey: string;
  hintKey: string;
}

export function resolveActiveSituationReference(
  chantier: SituationChantier | undefined,
  marche: SituationMarche | undefined,
): ActiveSituationReference | null {
  if (marche) {
    return {
      id: marche.id,
      numero: marche.numero,
      montantHt: marche.montantTotalHt,
      labelKey: 'chantiers.chantier.detail.labels.marche',
      hintKey: 'chantiers.chantier.detail.situations.hint',
    };
  }
  const reference = chantier?.marcheReference?.trim();
  if (chantier?.id && reference) {
    return {
      id: `vente-ref:${chantier.id}`,
      numero: reference,
      montantHt: chantier.budgetHt,
      labelKey: 'chantiers.chantier.detail.labels.referenceVente',
      hintKey: 'chantiers.chantier.detail.situations.hintSansMarche',
    };
  }
  return null;
}

export function resolveRetenueGarantiePercent(
  chantier: Pick<Chantier, 'cautionGarantie'>,
  marche: Pick<Marche, 'retenueGarantieTaux'> | undefined,
): number {
  return chantier.cautionGarantie ?? marche?.retenueGarantieTaux ?? 7;
}
