import { TestBed } from '@angular/core/testing';

import { VirementRemiseXmlService } from './virement-remise-xml.service';

describe('VirementRemiseXmlService', () => {
  let svc: VirementRemiseXmlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(VirementRemiseXmlService);
  });

  it('SEPA contient montants et IBAN', () => {
    const xml = svc.buildBatch('SEPA', '2026-05-01', [
      {
        id: '1',
        beneficiaire: 'ACME',
        rib: 'MA123456789012345678901234',
        montant: 1500.5,
        motif: 'Facture',
      },
    ]);
    expect(xml).toContain('CstmrCdtTrfInitn');
    expect(xml).toContain('1500.50');
    expect(xml).toContain('MA123456789012345678901234');
  });

  it('AWB stub contient banque AWB', () => {
    const xml = svc.buildBatch('AWB', '2026-05-01', [
      { id: '1', beneficiaire: 'X', rib: 'MA00', montant: 100, motif: 'm' },
    ]);
    expect(xml).toContain('banque="AWB"');
  });
});
