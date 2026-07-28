import { TestBed } from '@angular/core/testing';

import { CnssDatAdapter, type CnssDatDeclarationInput } from './cnss-dat.adapter';

describe('CnssDatAdapter', () => {
  let svc: CnssDatAdapter;

  const baseInput: CnssDatDeclarationInput = {
    employeur: { raisonSociale: 'Nafura BTP SARL', numeroAffiliation: '1234567', ice: '002345678901234' },
    victime: { matriculeCnss: 'CNSS-9988', nom: 'Younes ALAMI', fonction: 'Ouvrier coffreur' },
    type: 'AT_TRAVAIL',
    dateAccident: '2026-05-12',
    heureAccident: '10:30',
    lieu: 'Chantier CH-2025-001 - Zone B',
    chantierCode: 'CH-2025-001',
    description: 'Chute de niveau, fracture ouverte tibia.',
    graviteJoursArret: 45,
    referenceInterne: 'INC-2026-0042',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(CnssDatAdapter);
  });

  it('calcule la date limite légale à +48h après l accident', () => {
    const d = svc.computeDateLimite(baseInput);
    expect(d.getTime()).toBe(new Date('2026-05-14T10:30:00').getTime());
  });

  it('considère conforme un envoi dans les 48h', () => {
    const now = new Date('2026-05-13T08:00:00');
    expect(svc.isConforme48h(baseInput, now)).toBe(true);
  });

  it('considère non-conforme un envoi après 48h', () => {
    const now = new Date('2026-05-15T08:00:00');
    expect(svc.isConforme48h(baseInput, now)).toBe(false);
  });

  it('XML DAT contient employeur, victime, accident et référence interne', () => {
    const xml = svc.buildXml(baseInput);
    expect(xml).toContain('<DeclarationDAT xmlns="urn:cnss.ma:dat:1.0">');
    expect(xml).toContain('<NumeroAffiliation>1234567</NumeroAffiliation>');
    expect(xml).toContain('<MatriculeCNSS>CNSS-9988</MatriculeCNSS>');
    expect(xml).toContain('<Type>AT_TRAVAIL</Type>');
    expect(xml).toContain('<JoursArret>45</JoursArret>');
    expect(xml).toContain('<ReferenceInterne>INC-2026-0042</ReferenceInterne>');
  });

  it('mode mock succès retourne accusé DA + flag conforme48h', async () => {
    const res = await svc.submitDat(baseInput, { nowOverride: new Date('2026-05-13T08:00:00') });
    expect(res.status).toBe('SUCCES');
    expect(res.data?.numeroDossierDa).toMatch(/^CNSS-DA-/);
    expect(res.data?.conforme48h).toBe(true);
  });

  it('mode mock détecte hors délai 48h', async () => {
    const res = await svc.submitDat(baseInput, { nowOverride: new Date('2026-05-20T08:00:00') });
    expect(res.status).toBe('SUCCES');
    expect(res.data?.conforme48h).toBe(false);
    expect(res.message).toContain('HORS délai');
  });

  it('MP utilise préfixe accusé CNSS-MP', async () => {
    const res = await svc.submitDat({ ...baseInput, type: 'MP' });
    expect(res.status).toBe('SUCCES');
    expect(res.data?.numeroDossierDa).toMatch(/^CNSS-MP-/);
  });
});
