import { Injectable, inject, signal } from '@angular/core';

import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';

import {
  buildMockAccuse,
  nowIso,
  type IntegrationAuthConfig,
  type IntegrationCallResult,
  type IntegrationMode,
} from './integration.types';

/**
 * Adaptateur CNSS DAT — Déclaration accident du travail (M-INT-03).
 *
 * Workflow : incident type AT/MP créé côté HSE → adapter génère XML DAT →
 * envoi API CNSS → réception accusé dans les 48 h légales.
 *
 * Coord : §10 M-HSE-11 + §09 M-RH-09 (lien employé blessé).
 */

export interface CnssDatVictime {
  matriculeCnss: string;
  nom: string;
  fonction?: string;
}

export interface CnssDatEmployeur {
  raisonSociale: string;
  numeroAffiliation: string;
  ice: string;
}

export type CnssDatType = 'AT_TRAVAIL' | 'AT_TRAJET' | 'MP';

export interface CnssDatDeclarationInput {
  employeur: CnssDatEmployeur;
  victime: CnssDatVictime;
  /** Type d'accident — AT_TRAVAIL / AT_TRAJET / MP (maladie pro). */
  type: CnssDatType;
  dateAccident: string; // ISO
  heureAccident?: string;
  lieu: string;
  chantierId?: string;
  chantierCode?: string;
  description: string;
  graviteJoursArret?: number;
  /** Référence interne (numéro incident HSE) — sert de pièce d'origine. */
  referenceInterne: string;
}

export interface CnssDatAccuse {
  numeroDossierDa: string;
  dateEnvoi: string;
  dateLimiteLegale: string; // 48 h après l'accident
  conforme48h: boolean;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

@Injectable({ providedIn: 'root' })
export class CnssDatAdapter {
  private readonly audit = inject(ErpAuditService);

  readonly mode = signal<IntegrationMode>('MOCK');
  readonly auth = signal<IntegrationAuthConfig>({
    baseUrl: 'https://api.damancom.cnss.ma/dat',
  });

  setMode(mode: IntegrationMode, auth?: IntegrationAuthConfig): void {
    this.mode.set(mode);
    if (auth) this.auth.set(auth);
  }

  /** Date limite légale CNSS = 48 h après l'accident (jours calendaires). */
  computeDateLimite(input: CnssDatDeclarationInput): Date {
    const isoStart = input.heureAccident
      ? `${input.dateAccident}T${input.heureAccident}:00`
      : `${input.dateAccident}T08:00:00`;
    return new Date(new Date(isoStart).getTime() + 48 * 60 * 60 * 1000);
  }

  /** Vérifie si l'envoi se fait dans la fenêtre légale 48 h. */
  isConforme48h(input: CnssDatDeclarationInput, nowOverride?: Date): boolean {
    const now = nowOverride ?? new Date();
    return now.getTime() <= this.computeDateLimite(input).getTime();
  }

  /** XML DAT conforme schéma CNSS. */
  buildXml(input: CnssDatDeclarationInput): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<DeclarationDAT xmlns="urn:cnss.ma:dat:1.0">
  <Employeur>
    <NumeroAffiliation>${escapeXml(input.employeur.numeroAffiliation)}</NumeroAffiliation>
    <ICE>${escapeXml(input.employeur.ice)}</ICE>
    <RaisonSociale>${escapeXml(input.employeur.raisonSociale)}</RaisonSociale>
  </Employeur>
  <Victime>
    <MatriculeCNSS>${escapeXml(input.victime.matriculeCnss)}</MatriculeCNSS>
    <NomPrenom>${escapeXml(input.victime.nom)}</NomPrenom>
    <Fonction>${escapeXml(input.victime.fonction ?? '')}</Fonction>
  </Victime>
  <Accident>
    <Type>${input.type}</Type>
    <DateAccident>${escapeXml(input.dateAccident)}</DateAccident>
    <HeureAccident>${escapeXml(input.heureAccident ?? '')}</HeureAccident>
    <Lieu>${escapeXml(input.lieu)}</Lieu>
    <ChantierCode>${escapeXml(input.chantierCode ?? '')}</ChantierCode>
    <Description>${escapeXml(input.description)}</Description>
    <JoursArret>${input.graviteJoursArret ?? 0}</JoursArret>
    <ReferenceInterne>${escapeXml(input.referenceInterne)}</ReferenceInterne>
  </Accident>
</DeclarationDAT>`;
  }

  /**
   * Soumet la DAT à la CNSS.
   * MOCK : accusé local + flag conforme 48h.
   * PROD : POST XML + auth affilié (à brancher).
   */
  async submitDat(
    input: CnssDatDeclarationInput,
    options?: { simulateFailure?: boolean; nowOverride?: Date },
  ): Promise<IntegrationCallResult<CnssDatAccuse>> {
    const dateLimite = this.computeDateLimite(input);
    const conforme = this.isConforme48h(input, options?.nowOverride);
    if (this.mode() === 'PROD') {
      return {
        status: 'EN_ATTENTE',
        message: 'Mode PROD non encore branché — fournir compte CNSS DAT + certificat.',
        timestamp: nowIso(),
        mode: 'PROD',
      };
    }
    await delay(120);
    if (options?.simulateFailure) {
      this.audit.log(
        'EXPORT',
        'CNSS_DAT',
        input.referenceInterne,
        input.victime.matriculeCnss,
        'API CNSS DAT — échec simulé (mock)',
      );
      return {
        status: 'ECHEC',
        errorCode: 'CNSS-DAT-MOCK-500',
        message: 'Erreur simulée — service CNSS indisponible.',
        timestamp: nowIso(),
        mode: 'MOCK',
      };
    }
    const accuse: CnssDatAccuse = {
      numeroDossierDa: buildMockAccuse(input.type === 'MP' ? 'CNSS-MP' : 'CNSS-DA'),
      dateEnvoi: nowIso(),
      dateLimiteLegale: dateLimite.toISOString(),
      conforme48h: conforme,
    };
    this.audit.log(
      'EXPORT',
      'CNSS_DAT',
      input.referenceInterne,
      input.victime.matriculeCnss,
      `API CNSS DAT — accusé ${accuse.numeroDossierDa} (mock, conforme48h=${conforme})`,
    );
    return {
      status: 'SUCCES',
      accuse: accuse.numeroDossierDa,
      message: conforme
        ? 'Déclaration DAT enregistrée dans le délai légal 48 h (mock).'
        : 'Déclaration DAT enregistrée HORS délai légal 48 h (mock).',
      data: accuse,
      timestamp: nowIso(),
      mode: 'MOCK',
    };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
