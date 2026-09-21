import { compactHistoriquePrix } from './historique-prix.util';
import type { HistoriquePrixComposantLigne } from '../services/dossier-etude-api.service';

function ligne(
  partial: Partial<HistoriquePrixComposantLigne> & Pick<HistoriquePrixComposantLigne, 'fournisseur' | 'prixUnitaire'>,
): HistoriquePrixComposantLigne {
  return {
    kind: 'CONSULTATION',
    sourcePrix: 'CONSULTE',
    dateSource: '2026-09-18',
    ...partial,
  };
}

describe('compactHistoriquePrix', () => {
  it('fusionne les devis dupliqués du même partenaire', () => {
    const groupes = compactHistoriquePrix([
      ligne({ fournisseur: 'lafarge', prixUnitaire: 790, sourceRefId: 'a' }),
      ligne({ fournisseur: 'betonmar', prixUnitaire: 790, sourceRefId: 'b' }),
      ligne({ fournisseur: 'betonmar', prixUnitaire: 790, sourceRefId: 'c' }),
    ]);
    expect(groupes).toHaveLength(2);
    expect(groupes.map((g) => g.partenaire)).toEqual(['lafarge', 'betonmar']);
    expect(groupes.find((g) => g.partenaire === 'betonmar')?.count).toBe(1);
  });

  it('garde un achat devant les consultations du même partenaire', () => {
    const groupes = compactHistoriquePrix([
      ligne({
        fournisseur: 'Lafarge',
        prixUnitaire: 790,
        kind: 'CONSULTATION',
        dateSource: '2026-09-18',
      }),
      ligne({
        fournisseur: 'Lafarge',
        prixUnitaire: 820,
        kind: 'ACHATS',
        detail: 'FACTURE',
        sourcePrix: 'HISTORIQUE',
        dateSource: '2026-03-12',
      }),
    ]);
    expect(groupes).toHaveLength(1);
    expect(groupes[0].ligne.kind).toBe('ACHATS');
    expect(groupes[0].ligne.prixUnitaire).toBe(820);
    expect(groupes[0].count).toBe(2);
    expect(groupes[0].minPu).toBe(790);
    expect(groupes[0].maxPu).toBe(820);
  });
});
