import { TestBed } from '@angular/core/testing';

import { RecouvrementService } from './recouvrement.service';
import type { FactureClient } from '@applications/erp/ventes/models';

describe('RecouvrementService', () => {
  let svc: RecouvrementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(RecouvrementService);
  });

  it('niveau maximal si facture > 45 jours retard', () => {
    expect(svc.niveauFromRetard(50)).toBe(4);
  });

  it('expose les factures impayées en retard', () => {
    const f: FactureClient = {
      id: 'x',
      numero: 'FC-X',
      type: 'SITUATION',
      clientId: 'c1',
      dateEmission: '2026-01-01',
      dateEcheance: '2026-01-05',
      totalHt: 1000,
      retenueGarantieMontant: 0,
      netAPayerHt: 1000,
      tvaTaux: 20,
      totalTva: 200,
      netAPayerTtc: 1200,
      cumulEncaisseTtc: 0,
      resteTtc: 1200,
      status: 'EMISE',
      lignes: [],
      encaissements: [],
    };
    const rows = svc.buildSuivis([f], '2026-05-01');
    expect(rows.length).toBe(1);
    expect(rows[0].joursRetard).toBeGreaterThan(0);
  });
});
