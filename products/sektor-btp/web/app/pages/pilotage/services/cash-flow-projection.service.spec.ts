import {
  DEFAULT_CASHFLOW_SEUIL_ALERTE_MAD,
  projectCashFlowMonths,
  buildMoisLabelFr,
} from './cash-flow-projection.service';

describe('projectCashFlowMonths', () => {
  const ref = new Date('2026-05-09T12:00:00');

  it('produit horizonMonths lignes', () => {
    const rows = projectCashFlowMonths({
      factures: [],
      chantiers: [],
      referenceDate: ref,
      horizonMonths: 6,
      soldeInitialMad: 10_000_000,
      seuilAlerteMad: DEFAULT_CASHFLOW_SEUIL_ALERTE_MAD,
    });
    expect(rows.length).toBe(6);
    expect(rows[0].mois).toBe('2026-05');
    expect(rows[5].mois).toBe('2026-10');
  });

  it('cumule le solde mensuel', () => {
    const rows = projectCashFlowMonths({
      factures: [],
      chantiers: [],
      referenceDate: ref,
      horizonMonths: 2,
      soldeInitialMad: 1_000_000,
      masseSalarialeNetteMensuelle: 0,
      chargesSocialesPatronalesMensuelle: 0,
      traitesMensuellesBase: 0,
    });
    expect(rows[0].soldeMensuel).toBe(rows[0].encaissementsPrevus - rows[0].decaissementsPrevus);
    expect(rows[1].soldeCumule).toBe(rows[0].soldeCumule + rows[1].soldeMensuel);
  });

  it('marque alerte si solde cumulé sous seuil', () => {
    const rows = projectCashFlowMonths({
      factures: [],
      chantiers: [],
      referenceDate: ref,
      horizonMonths: 12,
      soldeInitialMad: 100_000,
      seuilAlerteMad: 5_000_000,
    });
    expect(rows.some((r) => r.alerte)).toBe(true);
  });
});

describe('buildMoisLabelFr', () => {
  it('formate mois français', () => {
    expect(buildMoisLabelFr(2026, 5)).toBe('Mai 2026');
  });
});

describe('projectCashFlowMonths — dynamique (M-PIL-05)', () => {
  const ref = new Date('2026-05-09T12:00:00');

  it('projection variable selon échéances situations', () => {
    const rows = projectCashFlowMonths({
      factures: [
        { dateEcheance: '2026-05-31', netAPayer: 5_000_000, status: 'EMISE' },
        { dateEcheance: '2026-06-30', netAPayer: 2_000_000, status: 'ACCEPTEE' },
        { dateEcheance: '2026-08-15', netAPayer: 9_000_000, status: 'ENVOYEE_MOA' },
      ],
      chantiers: [{ status: 'EN_COURS', budgetHt: 40_000_000, avancementPercent: 40 }],
      referenceDate: ref,
      horizonMonths: 6,
      soldeInitialMad: 10_000_000,
      masseSalarialeNetteMensuelle: 100_000,
      chargesSocialesPatronalesMensuelle: 50_000,
      traitesMensuellesBase: 20_000,
      facturesFourn: [
        { dateEcheance: '2026-07-10', resteARegler: 1_200_000, status: 'VALIDEE' },
      ],
    });
    const enc = rows.map((r) => r.encaissementsPrevus);
    expect(new Set(enc).size).toBeGreaterThan(1);
    expect(rows[0].detail.encaissementsSituations).toBeGreaterThan(0);
    expect(rows.find((r) => r.mois === '2026-07')!.detail.decaissementsFacturesFournisseur).toBeGreaterThan(0);
  });

  it('décaissements salaires et charges présents chaque mois', () => {
    const rows = projectCashFlowMonths({
      factures: [],
      chantiers: [],
      referenceDate: ref,
      horizonMonths: 4,
      masseSalarialeNetteMensuelle: 400_000,
      chargesSocialesPatronalesMensuelle: 250_000,
      traitesMensuellesBase: 100_000,
    });
    for (const r of rows) {
      expect(r.detail.decaissementsMasseSalariale).toBeGreaterThan(0);
      expect(r.detail.decaissementsChargesSociales).toBeGreaterThan(0);
    }
  });
});
