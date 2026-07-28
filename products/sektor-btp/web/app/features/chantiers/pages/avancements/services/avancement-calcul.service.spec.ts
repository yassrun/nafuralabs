import { AvancementCalculService } from './avancement-calcul.service';

describe('AvancementCalculService', () => {
  let svc: AvancementCalculService;

  beforeEach(() => {
    svc = new AvancementCalculService();
  });

  it('calcule nouveau cumul et pourcentage', () => {
    const lot = { quantite: 100, cumulQuantite: 10, avancementPercent: 10, unite: 'm3' };
    const r = svc.buildRow(lot, 5);
    expect(r.nouveauCumul).toBe(15);
    expect(r.newPercent).toBe(15);
    expect(r.deltaPercent).toBe(5);
  });

  it('signale dépassement de quantité', () => {
    const lot = { quantite: 100, cumulQuantite: 90, avancementPercent: 90, unite: 'm3' };
    const r = svc.buildRow(lot, 20);
    expect(r.warningKey).toBe('cumulExceeds');
  });
});
