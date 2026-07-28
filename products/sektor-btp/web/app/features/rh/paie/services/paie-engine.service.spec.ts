import { TestBed } from '@angular/core/testing';

import { BAREME_PAIE_MA_2026 as B } from './bareme-paie-2026';
import { PaieEngineService } from './paie-engine.service';

/**
 * Unit tests — Moteur de paie marocain 2026 (CNSS / AMO / CIMR / IGR / TFP).
 *
 * Constantes utilisées (cf. bareme-paie-2026.ts) :
 *  - CNSS salarial 4,48 %, plafond 6 000 MAD
 *  - AMO salarial 2,26 % (sans plafond)
 *  - CIMR salarial mini 3 % / employeur 6 % (cadres uniquement)
 *  - Frais pros 35 % plafonnés à 35 000 / 12 ≈ 2 916,67 MAD
 *  - IGR mensuel 2026 : 0 / 10 / 20 / 30 / 34 / 38 %
 *  - Charges familiales : 30 MAD × min(personnesACharge, 6)
 *  - Patronal : CNSS 7,43 %, AMO 4,11 %, TFP 1,6 %
 *
 * Toutes les valeurs attendues sont précalculées à la main puis vérifiées
 * via toBeCloseTo(value, 2) pour rester déterministes face aux arrondis IEEE-754.
 */
describe('PaieEngineService — barème MA 2026', () => {
  let service: PaieEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaieEngineService);
  });

  it('cas standard : 8 000 MAD brut, non-cadre, 0 personne à charge', () => {
    const r = service.calculerFiche({ salaireBase: 8000 });

    expect(r.salaireBrut).toBeCloseTo(8000, 2);
    expect(r.cnss).toBeCloseTo(268.8, 2);
    expect(r.amo).toBeCloseTo(180.8, 2);
    expect(r.cimr).toBe(0);
    expect(r.totalCotisationsSalariales).toBeCloseTo(449.6, 2);

    expect(r.fraisPro).toBeCloseTo(2800, 2);
    expect(r.chargesFamiliales).toBe(0);
    expect(r.salaireNetImposable).toBeCloseTo(4750.4, 2);

    expect(r.igr).toBeCloseTo(283.41, 2);
    expect(r.salaireNetAPayer).toBeCloseTo(7266.99, 2);

    expect(r.cnssEmpl).toBeCloseTo(445.8, 2);
    expect(r.amoEmpl).toBeCloseTo(328.8, 2);
    expect(r.cimrEmpl).toBe(0);
    expect(r.tfp).toBeCloseTo(128, 2);
    expect(r.totalChargesPatronales).toBeCloseTo(902.6, 2);
    expect(r.coutTotal).toBeCloseTo(8902.6, 2);
  });

  it('cas plafond CNSS exact : 6 000 MAD brut → CNSS = plafond × 4,48 %', () => {
    const r = service.calculerFiche({ salaireBase: 6000 });

    expect(r.salaireBrut).toBeCloseTo(6000, 2);
    expect(r.cnss).toBeCloseTo(B.CNSS.prestationsSocialesPlafond * B.CNSS.prestationsSocialesSalarialPercent / 100, 2);
    expect(r.amo).toBeCloseTo(135.6, 2);
    expect(r.fraisPro).toBeCloseTo(2100, 2);
    expect(r.salaireNetImposable).toBeCloseTo(3495.6, 2);
    expect(r.igr).toBeCloseTo(99.56, 2);
    expect(r.salaireNetAPayer).toBeCloseTo(5496.04, 2);
    expect(r.cnssEmpl).toBeCloseTo(445.8, 2);
  });

  it('cas haut salaire > plafond CNSS : 30 000 MAD brut → CNSS plafonnée', () => {
    const r = service.calculerFiche({ salaireBase: 30000 });

    expect(r.cnss).toBeCloseTo(268.8, 2);
    expect(r.amo).toBeCloseTo(678, 2);
    expect(r.fraisPro).toBeCloseTo(2916.67, 2);
    expect(r.salaireNetImposable).toBeCloseTo(26136.53, 2);
    expect(r.igr).toBeCloseTo(7898.55, 2);
    expect(r.cnssEmpl).toBeCloseTo(445.8, 2);
    expect(r.tfp).toBeCloseTo(480, 2);
  });

  it('cas cadre CIMR : 12 000 MAD brut, cadre, taux salarial 3 % / employeur 6 %', () => {
    const r = service.calculerFiche({ salaireBase: 12000, estCadre: true });

    expect(r.cimr).toBeCloseTo(360, 2);
    expect(r.cimrEmpl).toBeCloseTo(720, 2);
    expect(r.totalCotisationsSalariales).toBeCloseTo(900, 2);
    expect(r.fraisPro).toBeCloseTo(2916.67, 2);
    expect(r.salaireNetImposable).toBeCloseTo(8183.33, 2);
    expect(r.igr).toBeCloseTo(1349, 2);
    expect(r.salaireNetAPayer).toBeCloseTo(9751, 2);
    expect(r.totalChargesPatronales).toBeCloseTo(1851, 2);
  });

  it('cas zéro : salaireBase 0 → toutes les composantes nulles', () => {
    const r = service.calculerFiche({ salaireBase: 0 });

    expect(r.salaireBrut).toBe(0);
    expect(r.cnss).toBe(0);
    expect(r.amo).toBe(0);
    expect(r.cimr).toBe(0);
    expect(r.totalCotisationsSalariales).toBe(0);
    expect(r.fraisPro).toBe(0);
    expect(r.salaireNetImposable).toBe(0);
    expect(r.igr).toBe(0);
    expect(r.salaireNetAPayer).toBe(0);
    expect(r.cnssEmpl).toBe(0);
    expect(r.amoEmpl).toBe(0);
    expect(r.tfp).toBe(0);
    expect(r.totalChargesPatronales).toBe(0);
    expect(r.coutTotal).toBe(0);
  });

  it('charges familiales : personnesACharge plafonné à 6 (même si saisie = 10)', () => {
    const r = service.calculerFiche({ salaireBase: 15000, personnesACharge: 10 });

    expect(r.chargesFamiliales).toBe(6 * B.CHARGES_FAMILIALES.parPersonneACharge);
    expect(r.chargesFamiliales).toBe(180);
  });

  it('primes + heures sup + avantages en nature s\'agrègent au brut', () => {
    const r = service.calculerFiche({
      salaireBase: 5000,
      primes: 1000,
      heuresSupMontant: 500,
      avantagesNature: 500,
    });

    expect(r.salaireBrut).toBeCloseTo(7000, 2);
    expect(r.amo).toBeCloseTo(7000 * B.AMO.salarialPercent / 100, 2);
    expect(r.cnss).toBeCloseTo(Math.min(7000, B.CNSS.prestationsSocialesPlafond) * B.CNSS.prestationsSocialesSalarialPercent / 100, 2);
  });

  it('calculerIGR : barème mensuel 2026 — bornes de tranches', () => {
    expect(service.calculerIGR(0)).toBe(0);
    expect(service.calculerIGR(-500)).toBe(0);
    expect(service.calculerIGR(2500)).toBe(0);
    expect(service.calculerIGR(3000)).toBeCloseTo(3000 * 0.10 - 250, 2);
    expect(service.calculerIGR(5000)).toBeCloseTo(5000 * 0.20 - 666.67, 2);
    expect(service.calculerIGR(10000)).toBeCloseTo(10000 * 0.34 - 1433.33, 2);
    expect(service.calculerIGR(50000)).toBeCloseTo(50000 * 0.38 - 2033.33, 2);
  });

  it('corrige F-17 : brut 34 500 MAD cadre CIMR 6 % — cotisations > 3 000 MAD, IGR aligné barème 2026', () => {
    const r = service.calculerFiche({
      salaireBase: 34_500,
      estCadre: true,
      personnesACharge: 3,
      cimrTauxSalarial: 6,
    });
    expect(r.salaireBrut).toBe(34_500);
    expect(r.cnss + r.amo + r.cimr).toBeGreaterThan(3_000);
    expect(r.totalCotisationsSalariales).toBeCloseTo(r.cnss + r.amo + r.cimr, 2);
    const baseIgr = Math.max(0, r.salaireNetImposable - r.chargesFamiliales);
    expect(r.igr).toBeCloseTo(service.calculerIGR(baseIgr), 2);
    expect(r.igr).toBeGreaterThan(8_000);
    expect(r.igr).toBeLessThan(9_500);
  });

  it('retenues exceptionnelles diminuent le net à payer', () => {
    const sans = service.calculerFiche({ salaireBase: 8000 });
    const avec = service.calculerFiche({ salaireBase: 8000, retenuesExceptionnelles: 1000 });
    expect(avec.salaireNetAPayer).toBeCloseTo(sans.salaireNetAPayer - 1000, 2);
  });
});
