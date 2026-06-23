import { HseKpiService } from './hse-kpi.service';

describe('HseKpiService', () => {
  const svc = new HseKpiService();

  it('computes TF1 = AT avec arrêt × 1e6 / heures', () => {
    expect(svc.tf1(2, 1_000_000)).toBe(2);
    expect(svc.tf1(1, 500_000)).toBe(2);
    expect(svc.tf1(0, 1_000_000)).toBe(0);
    expect(svc.tf1(3, 0)).toBe(0);
  });
});
