import { TestBed } from '@angular/core/testing';

import { TvaEngineService } from './tva-engine.service';

/**
 * Unit tests — Moteur TVA marchés (taux MA : 20 / 14 / 10).
 * Référence : Code Général des Impôts Maroc, art. 99.
 */
describe('TvaEngineService — taux & calcul TTC', () => {
  let service: TvaEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TvaEngineService);
  });

  it('determinerTaux : retourne le taux porté par le marché (20 % BTP standard)', () => {
    expect(service.determinerTaux({ tvaTaux: 20 })).toBe(20);
    expect(service.determinerTaux({ tvaTaux: 14 })).toBe(14);
    expect(service.determinerTaux({ tvaTaux: 10 })).toBe(10);
  });

  it('calculer : 100 000 HT × 20 % → 20 000 TVA / 120 000 TTC', () => {
    const r = service.calculer(100_000, 20);
    expect(r.tva).toBe(20_000);
    expect(r.ttc).toBe(120_000);
  });

  it('calculer : 250 000 HT × 14 % (logement social) → 35 000 TVA / 285 000 TTC', () => {
    const r = service.calculer(250_000, 14);
    expect(r.tva).toBe(35_000);
    expect(r.ttc).toBe(285_000);
  });

  it('calculer : montant zéro ou taux zéro → TVA = 0 et TTC = HT', () => {
    expect(service.calculer(0, 20)).toEqual({ tva: 0, ttc: 0 });
    expect(service.calculer(50_000, 0)).toEqual({ tva: 0, ttc: 50_000 });
  });

  it('calculer : arrondit à l\'unité (Math.round) — 1 234 HT × 20 % → 247 TVA', () => {
    const r = service.calculer(1234, 20);
    expect(r.tva).toBe(247);
    expect(r.ttc).toBe(1234 + 247);
  });
});
