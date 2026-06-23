import { TestBed } from '@angular/core/testing';

import { WhatsAppNotificationAdapter } from './whatsapp.adapter';

describe('WhatsAppNotificationAdapter', () => {
  let svc: WhatsAppNotificationAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(WhatsAppNotificationAdapter);
  });

  it('liste 8 templates pré-validés', () => {
    expect(svc.listTemplates().length).toBe(8);
  });

  it('validate retourne erreurs si variables manquantes', () => {
    const errs = svc.validate('APPROBATION_DEMANDE', { nom: 'Karim' });
    expect(errs.length).toBeGreaterThan(0);
    expect(errs.join(' ')).toContain('type');
  });

  it('renderMessage interpole les variables FR', () => {
    const msg = svc.renderMessage('APPROBATION_DEMANDE', {
      nom: 'Karim',
      type: 'BC',
      reference: 'BC-2026-00007',
      montant: '420000',
    });
    expect(msg).toContain('Karim');
    expect(msg).toContain('BC-2026-00007');
    expect(msg).toContain('420000');
  });

  it('envoyerNotification mock envoie + retourne ticket', async () => {
    const res = await svc.envoyerNotification('+212600000000', 'APPROBATION_DEMANDE', {
      nom: 'Karim',
      type: 'BC',
      reference: 'BC-2026-00007',
      montant: '420000',
    });
    expect(res.status).toBe('SUCCES');
    expect(res.accuse).toMatch(/^WA-/);
  });

  it('envoyerNotification retourne ECHEC validation si variable manquante', async () => {
    const res = await svc.envoyerNotification('+212600000000', 'RELANCE_FACTURE_J15', {
      client: 'ACME',
      reference: 'FM-001',
    });
    expect(res.status).toBe('ECHEC');
    expect(res.errorCode).toBe('WHATSAPP-VALIDATION');
  });

  it('mode PROD renvoie EN_ATTENTE tant que non branché', async () => {
    svc.setMode('PROD');
    const res = await svc.envoyerNotification('+212600000000', 'POINTAGE_RAPPEL', {
      date: '2026-05-13',
      deadline: '20:00',
    });
    expect(res.status).toBe('EN_ATTENTE');
  });
});
