import { Injectable, inject, signal } from '@angular/core';

import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';

import {
  buildMockAccuse,
  nowIso,
  type IntegrationAuthConfig,
  type IntegrationCallResult,
  type IntegrationMode,
  type NotificationChannelAdapter,
} from './integration.types';

/**
 * Adaptateur WhatsApp Business — notifications (M-INT-09).
 *
 * Différenciateur fort sur le marché MA (usage WhatsApp First).
 * Provider Meta Cloud API ou tiers (Twilio, MessageBird).
 *
 * Cas d'usage :
 *  - Approbation à valider (§12 M-APR-07)
 *  - Alerte incident HSE (§10)
 *  - Relance facture en retard (§08 M-FIN-02)
 *  - Notification livraison BC
 */

/** Templates messages validés Meta. */
export type WhatsAppTemplateKey =
  | 'APPROBATION_DEMANDE'
  | 'APPROBATION_RAPPEL'
  | 'INCIDENT_HSE_AT'
  | 'RELANCE_FACTURE_J15'
  | 'RELANCE_FACTURE_J30'
  | 'RELANCE_FACTURE_J45'
  | 'LIVRAISON_BC'
  | 'POINTAGE_RAPPEL';

interface TemplateDef {
  /** Catégorie Meta. */
  category: 'UTILITY' | 'AUTHENTICATION' | 'MARKETING';
  /** Modèle FR (variables `{{key}}`). */
  bodyFr: string;
  /** Variables attendues (lowerCamel). */
  requiredVars: string[];
}

const TEMPLATES: Record<WhatsAppTemplateKey, TemplateDef> = {
  APPROBATION_DEMANDE: {
    category: 'UTILITY',
    bodyFr:
      'Bonjour {{nom}}, une demande d approbation {{type}} {{reference}} pour {{montant}} MAD attend votre validation.',
    requiredVars: ['nom', 'type', 'reference', 'montant'],
  },
  APPROBATION_RAPPEL: {
    category: 'UTILITY',
    bodyFr:
      'Rappel : la demande {{reference}} est en attente de votre validation depuis {{joursOuverture}} jour(s).',
    requiredVars: ['reference', 'joursOuverture'],
  },
  INCIDENT_HSE_AT: {
    category: 'UTILITY',
    bodyFr:
      'Alerte HSE : accident du travail {{reference}} déclaré sur le chantier {{chantier}}. Déclaration CNSS DAT à effectuer avant {{deadline}}.',
    requiredVars: ['reference', 'chantier', 'deadline'],
  },
  RELANCE_FACTURE_J15: {
    category: 'UTILITY',
    bodyFr:
      'Bonjour {{client}}, votre facture {{reference}} de {{montant}} MAD est arrivée à échéance le {{echeance}}. Merci de procéder au règlement.',
    requiredVars: ['client', 'reference', 'montant', 'echeance'],
  },
  RELANCE_FACTURE_J30: {
    category: 'UTILITY',
    bodyFr:
      'Bonjour {{client}}, votre facture {{reference}} ({{montant}} MAD) reste impayée depuis 30 jours. Merci de régulariser sous huitaine.',
    requiredVars: ['client', 'reference', 'montant'],
  },
  RELANCE_FACTURE_J45: {
    category: 'UTILITY',
    bodyFr:
      'Bonjour {{client}}, votre facture {{reference}} ({{montant}} MAD) est en retard de 45 jours. Une mise en demeure va vous être adressée.',
    requiredVars: ['client', 'reference', 'montant'],
  },
  LIVRAISON_BC: {
    category: 'UTILITY',
    bodyFr:
      'Bonjour, la commande {{reference}} sera livrée le {{dateLivraison}} sur le chantier {{chantier}}.',
    requiredVars: ['reference', 'dateLivraison', 'chantier'],
  },
  POINTAGE_RAPPEL: {
    category: 'UTILITY',
    bodyFr:
      'Rappel pointage : merci de saisir votre pointage du {{date}} avant {{deadline}}.',
    requiredVars: ['date', 'deadline'],
  },
};

@Injectable({ providedIn: 'root' })
export class WhatsAppNotificationAdapter implements NotificationChannelAdapter {
  private readonly audit = inject(ErpAuditService);

  readonly mode = signal<IntegrationMode>('MOCK');
  readonly auth = signal<IntegrationAuthConfig>({
    baseUrl: 'https://graph.facebook.com/v19.0/{{phone_number_id}}/messages',
  });

  setMode(mode: IntegrationMode, auth?: IntegrationAuthConfig): void {
    this.mode.set(mode);
    if (auth) this.auth.set(auth);
  }

  /** Liste les templates disponibles (pour UI admin). */
  listTemplates(): Array<{ key: WhatsAppTemplateKey; def: TemplateDef }> {
    return (Object.keys(TEMPLATES) as WhatsAppTemplateKey[]).map((k) => ({ key: k, def: TEMPLATES[k] }));
  }

  /** Validation : toutes les variables requises présentes. */
  validate(template: WhatsAppTemplateKey, variables: Record<string, string>): string[] {
    const def = TEMPLATES[template];
    if (!def) return [`Template inconnu : ${template}`];
    const missing = def.requiredVars.filter((v) => !variables[v] || variables[v].trim() === '');
    return missing.length === 0 ? [] : missing.map((m) => `Variable manquante : ${m}`);
  }

  /** Construit le message final FR (interpolation `{{var}}`). */
  renderMessage(template: WhatsAppTemplateKey, variables: Record<string, string>): string {
    const def = TEMPLATES[template];
    if (!def) return '';
    return def.bodyFr.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
  }

  /**
   * Envoi unitaire — implémente `NotificationChannelAdapter`.
   * MOCK : log audit + accusé local.
   * PROD : POST Meta Cloud API (à brancher).
   */
  async envoyerNotification(
    destinataire: string,
    template: string,
    variables: Record<string, string>,
  ): Promise<IntegrationCallResult> {
    const key = template as WhatsAppTemplateKey;
    const errors = this.validate(key, variables);
    if (errors.length > 0) {
      return {
        status: 'ECHEC',
        errorCode: 'WHATSAPP-VALIDATION',
        message: errors.join(' ; '),
        timestamp: nowIso(),
        mode: this.mode(),
      };
    }
    if (this.mode() === 'PROD') {
      return {
        status: 'EN_ATTENTE',
        message: 'Mode PROD non encore branché — fournir Meta Cloud API token.',
        timestamp: nowIso(),
        mode: 'PROD',
      };
    }
    await delay(60);
    const body = this.renderMessage(key, variables);
    const ticket = buildMockAccuse('WA');
    this.audit.log(
      'EXPORT',
      'WHATSAPP',
      destinataire,
      `${template} → ${destinataire}`,
      `Ticket ${ticket} (mock) — « ${body.slice(0, 80)} »`,
    );
    return {
      status: 'SUCCES',
      accuse: ticket,
      message: 'Message WhatsApp envoyé (mock).',
      data: { phone: destinataire, body },
      timestamp: nowIso(),
      mode: 'MOCK',
    };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
