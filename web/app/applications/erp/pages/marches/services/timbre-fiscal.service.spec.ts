import { TestBed } from '@angular/core/testing';

import { TimbreFiscalService } from './timbre-fiscal.service';

/**
 * Unit tests — Timbre fiscal MA (0,25 % paiement espèces > 10 000 MAD, plafond 100 MAD).
 * Référence : art. 252 CGI Maroc.
 */
describe('TimbreFiscalService — droit de timbre paiements espèces', () => {
  let service: TimbreFiscalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimbreFiscalService);
  });

  it('mode VIREMENT / CHEQUE / AUTRE : aucun timbre quel que soit le montant', () => {
    expect(service.calculer(50_000, 'VIREMENT')).toBe(0);
    expect(service.calculer(1_000_000, 'CHEQUE')).toBe(0);
    expect(service.calculer(99_999, 'AUTRE')).toBe(0);
  });

  it('mode ESPECES, montant ≤ 10 000 MAD : pas de timbre (seuil exclu)', () => {
    expect(service.calculer(10_000, 'ESPECES')).toBe(0);
    expect(service.calculer(5_000, 'ESPECES')).toBe(0);
    expect(service.calculer(0, 'ESPECES')).toBe(0);
  });

  it('mode ESPECES, montant > 10 000 MAD : 0,25 % arrondi à l\'unité', () => {
    expect(service.calculer(20_000, 'ESPECES')).toBe(50);
    expect(service.calculer(12_000, 'ESPECES')).toBe(30);
  });

  it('mode ESPECES, plafond 100 MAD respecté pour gros montants', () => {
    expect(service.calculer(50_000, 'ESPECES')).toBe(100);
    expect(service.calculer(1_000_000, 'ESPECES')).toBe(100);
  });

  it('mode ESPECES : transition à 40 000 MAD (0,25 % = 100, plafond atteint)', () => {
    expect(service.calculer(40_000, 'ESPECES')).toBe(100);
    expect(service.calculer(30_000, 'ESPECES')).toBe(75);
  });
});
