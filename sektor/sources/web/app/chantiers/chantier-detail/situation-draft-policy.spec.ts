import {
  resolveActiveSituationReference,
  resolveRetenueGarantiePercent,
} from './situation-draft-policy';

describe('situation draft policy', () => {
  it('utilise la référence de vente active quand aucun marché n’existe', () => {
    const reference = resolveActiveSituationReference(
      {
        id: 'chantier-1',
        marcheReference: '  DEV-2026-042  ',
        budgetHt: 850_000,
        cautionGarantie: 5,
      },
      undefined,
    );

    expect(reference).toEqual({
      id: 'vente-ref:chantier-1',
      numero: 'DEV-2026-042',
      montantHt: 850_000,
      labelKey: 'chantiers.chantier.detail.labels.referenceVente',
      hintKey: 'chantiers.chantier.detail.situations.hintSansMarche',
    });
  });

  it('résout le taux de retenue sans exiger de marché', () => {
    expect(resolveRetenueGarantiePercent({ cautionGarantie: 5 }, undefined)).toBe(5);
    expect(resolveRetenueGarantiePercent({ cautionGarantie: undefined }, undefined)).toBe(7);
    expect(
      resolveRetenueGarantiePercent(
        { cautionGarantie: undefined },
        { retenueGarantieTaux: 6.5 },
      ),
    ).toBe(6.5);
  });
});
