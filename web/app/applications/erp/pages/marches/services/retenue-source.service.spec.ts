import { TestBed } from '@angular/core/testing';

import type { Marche } from '../models';
import { RetenueSourceService } from './retenue-source.service';

/**
 * Unit tests — Retenue à la source 5 % travaux fournis à l'État.
 * Référence : art. 158 CGI Maroc (MOA = personne morale de droit public).
 */
describe('RetenueSourceService — RAS 5 % marchés publics', () => {
  let service: RetenueSourceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RetenueSourceService);
  });

  it('estApplicable : marché PUBLIC + taux > 0 → applicable', () => {
    const m: Pick<Marche, 'nature' | 'retenueSourceTaux'> = { nature: 'PUBLIC', retenueSourceTaux: 5 };
    expect(service.estApplicable(m)).toBe(true);
  });

  it('estApplicable : marché PRIVE_GRAND_COMPTE → non applicable même avec taux > 0', () => {
    const m: Pick<Marche, 'nature' | 'retenueSourceTaux'> = { nature: 'PRIVE_GRAND_COMPTE', retenueSourceTaux: 5 };
    expect(service.estApplicable(m)).toBe(false);
  });

  it('estApplicable : marché PUBLIC mais taux = 0 → non applicable', () => {
    const m: Pick<Marche, 'nature' | 'retenueSourceTaux'> = { nature: 'PUBLIC', retenueSourceTaux: 0 };
    expect(service.estApplicable(m)).toBe(false);
  });

  it('calculer : 100 000 HT × 5 % par défaut → 5 000 MAD', () => {
    expect(service.calculer(100_000)).toBe(5_000);
    expect(service.calculer(100_000, 5)).toBe(5_000);
  });

  it('calculer : 0 HT → 0, taux personnalisé respecté, arrondi à l\'unité', () => {
    expect(service.calculer(0)).toBe(0);
    expect(service.calculer(50_000, 10)).toBe(5_000);
    expect(service.calculer(1_234, 5)).toBe(Math.round(1_234 * 0.05));
  });
});
