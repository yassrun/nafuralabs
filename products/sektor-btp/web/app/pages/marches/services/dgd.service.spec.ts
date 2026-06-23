import { DgdService } from './dgd.service';

describe('DgdService', () => {
  let svc: DgdService;

  beforeEach(() => {
    svc = new DgdService();
  });

  it('calcule DGD net = cumul TTC − RG + reprises − pénalités + K', () => {
    const net = svc.computeMontantNetAPayer({
      cumulSituationsTtc: 10_000_000,
      cumulRetenueGarantie: 700_000,
      cumulRevisionK: 120_000,
      cumulPenalites: 50_000,
      reprisesRG: 200_000,
    });
    expect(net).toBe(9_570_000);
  });

  it('arrondit à 2 décimales', () => {
    const net = svc.computeMontantNetAPayer({
      cumulSituationsTtc: 100.125,
      cumulRetenueGarantie: 7.011,
      cumulRevisionK: 0,
      cumulPenalites: 0,
      reprisesRG: 0,
    });
    expect(net).toBe(93.11);
  });
});
