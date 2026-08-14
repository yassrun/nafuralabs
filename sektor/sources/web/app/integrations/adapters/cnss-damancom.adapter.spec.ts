import { TestBed } from '@angular/core/testing';

import { CnssDamancomAdapter, type DamancomBapInput } from './cnss-damancom.adapter';

describe('CnssDamancomAdapter', () => {
  let svc: CnssDamancomAdapter;

  const baseInput: DamancomBapInput = {
    employeur: { raisonSociale: 'Nafura BTP SARL', numeroAffiliation: '1234567', ice: '002345678901234' },
    periode: '2026-05',
    salaries: [
      {
        matricule: 'E001',
        nomPrenom: 'Ahmed BENNANI',
        salaireBrut: 12000,
        cotisationCNSS: 268.8,
        cotisationAMO: 271.2,
        igr: 1300,
        salaireNetAPayer: 10160,
      },
      {
        matricule: 'E002',
        nomPrenom: 'Sara TAZI',
        salaireBrut: 8000,
        cotisationCNSS: 268.8,
        cotisationAMO: 180.8,
        igr: 480,
        salaireNetAPayer: 7070.4,
      },
    ],
    cotisationPatronaleTotale: 1500,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(CnssDamancomAdapter);
  });

  it('calcule totaux brut/cnss/amo/igr/net + total cotisations', () => {
    const t = svc.computeTotaux(baseInput);
    expect(t.brut).toBe(20000);
    expect(t.cnss).toBe(537.6);
    expect(t.amo).toBe(452);
    expect(t.igr).toBe(1780);
    expect(t.net).toBe(17230.4);
    expect(t.totalCotisations).toBe(2489.6);
  });

  it('génère XML BAP conforme avec employeur + salariés + totaux', () => {
    const xml = svc.buildXml(baseInput);
    expect(xml).toContain('<DAMANCOM xmlns="urn:cnss.ma:damancom:bap:1.0">');
    expect(xml).toContain('<NumeroAffiliation>1234567</NumeroAffiliation>');
    expect(xml).toContain('<Matricule>E001</Matricule>');
    expect(xml).toContain('<NomPrenom>Ahmed BENNANI</NomPrenom>');
    expect(xml).toContain('<TotalBrut>20000.00</TotalBrut>');
    expect(xml).toContain('<NbSalaries>2</NbSalaries>');
  });

  it('mode mock retourne accusé BAP', async () => {
    const res = await svc.submitBap(baseInput);
    expect(res.status).toBe('SUCCES');
    expect(res.accuse).toMatch(/^BAP-/);
    expect(res.data?.nbSalaries).toBe(2);
  });

  it('mode mock peut simuler un échec', async () => {
    const res = await svc.submitBap(baseInput, { simulateFailure: true });
    expect(res.status).toBe('ECHEC');
    expect(res.errorCode).toBe('CNSS-MOCK-503');
  });

  it('mode PROD renvoie EN_ATTENTE tant que non branché', async () => {
    svc.setMode('PROD');
    const res = await svc.submitBap(baseInput);
    expect(res.status).toBe('EN_ATTENTE');
    expect(res.mode).toBe('PROD');
  });
});
