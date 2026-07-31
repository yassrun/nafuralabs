import { Injectable, inject, signal } from '@angular/core';

import {
  PRODUCT_WHATSAPP_TEMPLATES,
  type WhatsAppTemplateDef,
} from '../application/product-shell.tokens';
import { INTEGRATION_AUDIT_PORT } from './audit.port';

import {
  buildMockAccuse,
  nowIso,
  type IntegrationAuthConfig,
  type IntegrationCallResult,
  type IntegrationMode,
  type NotificationChannelAdapter,
} from './integration.types';

export type { WhatsAppTemplateDef };

/**
 * Adaptateur WhatsApp Business — notifications.
 * Templates métier fournis par le produit via `PRODUCT_WHATSAPP_TEMPLATES`.
 */

@Injectable({ providedIn: 'root' })
export class WhatsAppNotificationAdapter implements NotificationChannelAdapter {
  private readonly audit = inject(INTEGRATION_AUDIT_PORT);
  private readonly templates = inject(PRODUCT_WHATSAPP_TEMPLATES);

  readonly mode = signal<IntegrationMode>('MOCK');
  readonly auth = signal<IntegrationAuthConfig>({
    baseUrl: 'https://graph.facebook.com/v19.0/{{phone_number_id}}/messages',
  });

  setMode(mode: IntegrationMode, auth?: IntegrationAuthConfig): void {
    this.mode.set(mode);
    if (auth) this.auth.set(auth);
  }

  listTemplates(): Array<{ key: string; def: WhatsAppTemplateDef }> {
    return Object.keys(this.templates).map((k) => ({ key: k, def: this.templates[k] }));
  }

  validate(template: string, variables: Record<string, string>): string[] {
    const def = this.templates[template];
    if (!def) return [`Template inconnu : ${template}`];
    const missing = def.requiredVars.filter((v) => !variables[v] || variables[v].trim() === '');
    return missing.length === 0 ? [] : missing.map((m) => `Variable manquante : ${m}`);
  }

  renderMessage(template: string, variables: Record<string, string>): string {
    const def = this.templates[template];
    if (!def) return '';
    return def.bodyFr.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
  }

  async envoyerNotification(
    destinataire: string,
    template: string,
    variables: Record<string, string>,
  ): Promise<IntegrationCallResult> {
    const errors = this.validate(template, variables);
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
    const body = this.renderMessage(template, variables);
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
