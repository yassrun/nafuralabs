import { TestBed } from '@angular/core/testing';

import { EfactureDgiAdapter, type EfactureTransmissionPayload } from './efacture-dgi.adapter';

describe('EfactureDgiAdapter', () => {
  let svc: EfactureDgiAdapter;

  const payload: EfactureTransmissionPayload = {
    numeroFacture: 'FM-2026-00003',
    iceEmetteur: '002345678901234',
    iceClient: '000000000000002',
    hashEfacture: 'sha256-mock-abcdef',
    qrCodeData: 'NAFURA-EFACTURE|N:FM-2026-00003|HT:100000.00|TTC:120000.00',
    signatureCertId: 'CERT-DGI-MOCK-2026',
    totalHt: 100000,
    totalTva: 20000,
    totalTtc: 120000,
    pdfArchiveUrl: '/archives/factures/FM-2026-00003.pdf',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(EfactureDgiAdapter);
  });

  it('mode mock transmet la facture et renvoie une référence DGI', async () => {
    const res = await svc.transmettre(payload);
    expect(res.status).toBe('SUCCES');
    expect(res.accuse).toMatch(/^EFAC-DGI-/);
    expect(res.data?.qrCodeData).toBe(payload.qrCodeData);
  });

  it('mode mock peut simuler un échec', async () => {
    const res = await svc.transmettre(payload, { simulateFailure: true });
    expect(res.status).toBe('ECHEC');
    expect(res.errorCode).toBe('DGI-EFAC-MOCK-500');
  });

  it('mode PROD renvoie EN_ATTENTE tant que non branché', async () => {
    svc.setMode('PROD');
    const res = await svc.transmettre(payload);
    expect(res.status).toBe('EN_ATTENTE');
  });
});
