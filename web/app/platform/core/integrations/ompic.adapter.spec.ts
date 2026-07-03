import { TestBed } from '@angular/core/testing';

import { OmpicAdapter } from './ompic.adapter';

describe('OmpicAdapter', () => {
  let svc: OmpicAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(OmpicAdapter);
  });

  it('rechercherParIce trouve Nafura BTP SARL pour ICE 002345678901234 (mock)', async () => {
    const res = await svc.rechercherParIce('002345678901234');
    expect(res.status).toBe('SUCCES');
    expect(res.data?.raisonSociale).toBe('Nafura BTP SARL');
    expect(res.data?.formeJuridique).toBe('SARL');
  });

  it('rechercherParIce renvoie ECHEC pour ICE inconnu', async () => {
    const res = await svc.rechercherParIce('999999999999999');
    expect(res.status).toBe('ECHEC');
    expect(res.errorCode).toBe('OMPIC-404');
  });

  it('rechercherParNom filtre les seeds par sous-chaîne', async () => {
    const res = await svc.rechercherParNom('Nafura');
    expect(res.status).toBe('SUCCES');
    expect(res.data?.length).toBe(1);
    expect(res.data?.[0].raisonSociale).toContain('Nafura');
  });

  it('rechercherParNom requête vide renvoie liste vide', async () => {
    const res = await svc.rechercherParNom('   ');
    expect(res.status).toBe('SUCCES');
    expect(res.data?.length).toBe(0);
  });

  it('mode PROD renvoie EN_ATTENTE tant que non branché', async () => {
    svc.setMode('PROD');
    const res = await svc.rechercherParIce('002345678901234');
    expect(res.status).toBe('EN_ATTENTE');
  });
});
