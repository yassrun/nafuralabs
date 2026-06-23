import { TestBed } from '@angular/core/testing';

import { EfactureService } from './efacture.service';
import type { FactureClient } from '@applications/erp/ventes/models';

describe('EfactureService', () => {
  let svc: EfactureService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(EfactureService);
  });

  it('génère QR data avec hash', () => {
    const f: FactureClient = {
      id: 'id1',
      numero: 'FC-1',
      type: 'SITUATION',
      clientId: 'cli',
      dateEmission: '2026-01-01',
      dateEcheance: '2026-02-01',
      totalHt: 10_000,
      retenueGarantieMontant: 0,
      netAPayerHt: 10_000,
      tvaTaux: 20,
      totalTva: 2000,
      netAPayerTtc: 12_000,
      cumulEncaisseTtc: 0,
      resteTtc: 12_000,
      status: 'EMISE',
      lignes: [],
      encaissements: [],
    };
    const p = svc.buildPayload(f);
    expect(p.qrCodeData).toContain('NAFURA-EFACTURE');
    expect(p.qrCodeData).toContain('H:');
    expect(p.hashEfacture.length).toBeGreaterThan(10);
  });
});
