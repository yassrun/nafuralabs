import { Injectable, inject, signal } from '@angular/core';

import { INTEGRATION_AUDIT_PORT, NOOP_INTEGRATION_AUDIT } from './audit.port';

import {
  buildMockAccuse,
  nowIso,
  type IntegrationAuthConfig,
  type IntegrationCallResult,
  type IntegrationMode,
  type NotificationChannelAdapter,
} from './integration.types';

/**
 * Adaptateur WhatsApp Business — canal de notification transverse.
 * Les templates métier produit (HSE, chantier, …) appartiennent à l'application hôte.
 */

/** Templates plateforme (génériques). */
export type WhatsAppTemplateKey =
  | 'APPROBATION_DEMANDE'
  | 'APPROBATION_RAPPEL'
  | 'NOTIFICATION_GENERALE';

interface TemplateDef {
  category: 'UTILITY' | 'AUTHENTICATION' | 'MARKETING';
  bodyFr: string;
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
  NOTIFICATION_GENERALE: {
    category: 'UTILITY',
    bodyFr: 'Bonjour {{nom}}, {{message}}',
    requiredVars: ['nom', 'message'],
  },
};

@Injectable({ providedIn: 'root' })
export class WhatsAppNotificationAdapter implements NotificationChannelAdapter {
  private readonly audit = inject(INTEGRATION_AUDIT_PORT, { optional: true }) ?? NOOP_INTEGRATION_AUDIT;

  readonly mode = signal<IntegrationMode>('MOCK');
  readonly auth = signal<IntegrationAuthConfig>({
    baseUrl: 'https://graph.facebook.com/v19.0/{{phone_number_id}}/messages',
  });

  setMode(mode: IntegrationMode, auth?: IntegrationAuthConfig): void {
    this.mode.set(mode);
    if (auth) this.auth.set(auth);
  }

  listTemplates(): Array<{ key: WhatsAppTemplateKey; def: TemplateDef }> {
    return (Object.keys(TEMPLATES) as WhatsAppTemplateKey[]).map((k) => ({ key: k, def: TEMPLATES[k] }));
  }

  validate(template: WhatsAppTemplateKey, variables: Record<string, string>): string[] {
    const def = TEMPLATES[template];
    if (!def) return [`Template inconnu : ${template}`];
    const missing = def.requiredVars.filter((v) => !variables[v] || variables[v].trim() === '');
    return missing.length === 0 ? [] : missing.map((m) => `Variable manquante : ${m}`);
  }

  renderMessage(template: WhatsAppTemplateKey, variables: Record<string, string>): string {
    const def = TEMPLATES[template];
    if (!def) return '';
    return def.bodyFr.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
  }

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
