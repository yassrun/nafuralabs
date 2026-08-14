import { DpuService } from './dpu.service';

describe('DpuService', () => {
  const service = new DpuService();

  it('calcule prix vente = déboursé × (1 + FG + marge)', () => {
    expect(service.computePrixVenteHt(1000, 8, 7)).toBe(1150);
    expect(service.computePrixVenteHt(0, 10, 10)).toBe(0);
  });

  it('agrège déboursé sec depuis composants DPU', () => {
    const comps = service.recomputeTotals([
      {
        id: '1',
        type: 'MATIERE',
        articleOuPosteId: 'a',
        libelle: 'a',
        referenceType: 'LIBRE',
        quantite: 2,
        unite: 'm³',
        prixUnitaire: 100,
        total: 0,
      },
    ]);
    expect(service.computeDeboursSec(comps)).toBe(200);
  });
});
