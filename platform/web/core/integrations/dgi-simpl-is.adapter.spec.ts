import { TestBed } from '@angular/core/testing';

import { DgiSimplIsAdapter, type SimplIsDeclarationInput } from './dgi-simpl-is.adapter';

describe('DgiSimplIsAdapter', () => {
  let svc: DgiSimplIsAdapter;

  const baseInput: SimplIsDeclarationInput = {
    contribuable: { raisonSociale: 'Nafura BTP SARL', ice: '002345678901234', ifNum: '87654321' },
    periode: '2026-05',
    ventes: [
      { id: 'v1', numero: 'FM-2026-00001', client: 'OCP', ice: '111', ht: 1000, tvaTaux: 20, tva: 200, ttc: 1200 },
      { id: 'v2', numero: 'FM-2026-00002', client: 'ONEE', ice: '222', ht: 500, tvaTaux: 14, tva: 70, ttc: 570 },
    ],
    achats: [
      { id: 'a1', numero: 'FF-2026-001', fournisseur: 'Cimar', iceFournisseur: '333', ht: 400, tvaTaux: 20, tva: 80, ttc: 480 },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(DgiSimplIsAdapter);
  });

  it('calcule totaux ventes + TVA déductible depuis achats', () => {
    const t = svc.computeTotaux(baseInput);
    expect(t.htVentes).toBe(1500);
    expect(t.tvaCollectee).toBe(270);
    expect(t.tvaDeductible).toBe(80);
    expect(t.tvaNette).toBe(190);
  });

  it('génère un XML conforme avec annexes ventes/achats + récap', () => {
    const xml = svc.buildXml(baseInput);
    expect(xml).toContain('<DeclarationTVA xmlns="urn:dgi.gov.ma:simpl-is:1.0">');
    expect(xml).toContain('<IF>87654321</IF>');
    expect(xml).toContain('<ICE>002345678901234</ICE>');
    expect(xml).toContain('<Periode>2026-05</Periode>');
    expect(xml).toContain('<AnnexeVentes>');
    expect(xml).toContain('<AnnexeAchats>');
    expect(xml).toContain('<TVANetteAPayer>190.00</TVANetteAPayer>');
  });

  it('mode mock simule un succès avec numéro de télédéclaration', async () => {
    svc.setMode('MOCK');
    const res = await svc.submit(baseInput);
    expect(res.status).toBe('SUCCES');
    expect(res.mode).toBe('MOCK');
    expect(res.accuse).toMatch(/^SIMPL-IS-/);
    expect(res.data?.tvaNetteAPayer).toBe(190);
  });

  it('mode mock peut simuler un échec', async () => {
    svc.setMode('MOCK');
    const res = await svc.submit(baseInput, { simulateFailure: true });
    expect(res.status).toBe('ECHEC');
    expect(res.errorCode).toBe('DGI-MOCK-500');
  });

  it('mode PROD renvoie EN_ATTENTE tant que non branché', async () => {
    svc.setMode('PROD', { token: 'TBD' });
    const res = await svc.submit(baseInput);
    expect(res.status).toBe('EN_ATTENTE');
    expect(res.mode).toBe('PROD');
  });
});
