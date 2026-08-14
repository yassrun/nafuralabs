import { computeProchainSeuil, countMaintenancesDueThisWeek } from './maintenance.service';

describe('MaintenanceService (pure)', () => {
  it('computeProchainSeuil adds threshold to last reading', () => {
    expect(computeProchainSeuil('HEURES', 200, 250)).toBe(450);
    expect(computeProchainSeuil('KILOMETRES', 5000, 5000)).toBe(10000);
    expect(computeProchainSeuil('CALENDAIRE', 0, 90)).toBe(90);
  });

  it('countMaintenancesDueThisWeek counts ISO dates in current week', () => {
    const monday = new Date('2026-05-11T10:00:00');
    const plans = [
      { prochaineEcheanceIso: '2026-05-12' },
      { prochaineEcheanceIso: '2026-05-18' },
      { prochaineEcheanceIso: '2026-06-01' },
    ];
    expect(countMaintenancesDueThisWeek(plans, monday)).toBe(1);
  });
});
