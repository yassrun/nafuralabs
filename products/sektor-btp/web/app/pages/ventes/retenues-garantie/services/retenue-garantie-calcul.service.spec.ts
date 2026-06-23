import { RetenueGarantieCalculService } from './retenue-garantie-calcul.service';

describe('RetenueGarantieCalculService', () => {
  const ref = new Date('2026-05-08T12:00:00Z');
  let svc: RetenueGarantieCalculService;

  beforeEach(() => {
    svc = new RetenueGarantieCalculService();
  });

  it('retourne null si pas de date', () => {
    expect(svc.delaiRestantJours(undefined, ref)).toBeNull();
  });

  it('calcule le délai en jours', () => {
    expect(svc.delaiRestantJours('2026-05-10', ref)).toBe(2);
    expect(svc.delaiRestantJours('2026-05-06', ref)).toBe(-2);
  });
});
