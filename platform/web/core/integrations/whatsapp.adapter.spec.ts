import { TestBed } from '@angular/core/testing';

import { PRODUCT_WHATSAPP_TEMPLATES } from '../application/product-shell.tokens';
import { WhatsAppNotificationAdapter } from './whatsapp.adapter';

const TEST_TEMPLATES = {
  APPROBATION_DEMANDE: {
    category: 'UTILITY' as const,
    bodyFr:
      'Bonjour {{nom}}, une demande d approbation {{type}} {{reference}} pour {{montant}} MAD attend votre validation.',
    requiredVars: ['nom', 'type', 'reference', 'montant'],
  },
  RELANCE_FACTURE_J15: {
    category: 'UTILITY' as const,
    bodyFr: 'Facture {{reference}}',
    requiredVars: ['client', 'reference', 'montant', 'echeance'],
  },
  POINTAGE_RAPPEL: {
    category: 'UTILITY' as const,
    bodyFr: 'Pointage {{date}} avant {{deadline}}',
    requiredVars: ['date', 'deadline'],
  },
};

describe('WhatsAppNotificationAdapter', () => {
  let svc: WhatsAppNotificationAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: PRODUCT_WHATSAPP_TEMPLATES, useValue: TEST_TEMPLATES }],
    });
    svc = TestBed.inject(WhatsAppNotificationAdapter);
  });

  it('liste les templates fournis par le produit', () => {
    expect(svc.listTemplates().length).toBe(3);
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
