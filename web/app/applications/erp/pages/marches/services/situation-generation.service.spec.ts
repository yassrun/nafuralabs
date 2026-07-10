import { SituationGenerationService } from './situation-generation.service';

describe('SituationGenerationService', () => {
  let svc: SituationGenerationService;

  beforeEach(() => {
    svc = new SituationGenerationService();
  });

  it('génère brouillon : travaux période = cible avancement − cumul facturé', () => {
    const draft = svc.buildDraft({
      marcheId: 'm1',
      marcheNumero: 'MAR-1',
      chantierId: 'c1',
      chantierCode: 'CH-1',
      montantMarcheHt: 1_000_000,
      avancementPercent: 50,
      cumulSituationsFactureHt: 400_000,
      revisionKHt: 10_000,
      penalitesHt: 5_000,
      retenueGarantiePercent: 7,
      tvaTaux: 20,
      lots: [
        { code: 'L1', designation: 'Lot 1', avancementPercent: 60 },
        { code: 'L2', designation: 'Lot 2', avancementPercent: 40 },
      ],
    });
    expect(draft.travauxPeriodeHt).toBe(100_000);
    expect(draft.netHt).toBeGreaterThan(0);
    expect(draft.lignesLots.length).toBe(2);
    const sumLots = draft.lignesLots.reduce((s, l) => s + l.montantHtPeriode, 0);
    expect(sumLots).toBe(100_000);
  });

  it('computeTravauxPeriodeHt ne descend pas sous zéro', () => {
    expect(
      svc.computeTravauxPeriodeHt({
        montantMarcheHt: 100,
        avancementPercent: 10,
        cumulSituationsFactureHt: 50,
      }),
    ).toBe(0);
  });
});
