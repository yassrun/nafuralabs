import { inject, signal } from '@angular/core';

import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';

import {
  buildMockAccuse,
  nowIso,
  type IntegrationCallResult,
  type IntegrationMode,
} from '../integration.types';

import type {
  BanqueAdapter,
  EcritureBancaire,
  SoldeCompte,
  VirementBancaire,
  VirementBatchResult,
} from './banque.adapter';

/**
 * Classe de base pour les adaptateurs banques marocaines.
 * Fournit XML mock, simulation relevé, audit log.
 *
 * Format XML reste différencié (chaque banque a sa convention :
 * AWB Open Banking JSON, CIH OpenAPI REST, autres SFTP/XML).
 */
export abstract class BanqueAdapterBase implements BanqueAdapter {
  protected readonly audit = inject(ErpAuditService);

  abstract readonly code: string;
  abstract readonly nom: string;
  /** Convention bancaire de batch (utile pour le format XML). */
  protected abstract readonly batchFormat: 'XML' | 'JSON' | 'TXT' | 'SFTP';

  private readonly _mode = signal<IntegrationMode>('MOCK');

  mode = (): IntegrationMode => this._mode();

  setMode(mode: IntegrationMode): void {
    this._mode.set(mode);
  }

  async envoyerVirementBatch(
    virements: VirementBancaire[],
    dateExecution: string,
  ): Promise<IntegrationCallResult<VirementBatchResult>> {
    if (this._mode() === 'PROD') {
      return {
        status: 'EN_ATTENTE',
        message: `Mode PROD ${this.code} non encore branché — fournir OAuth/SFTP.`,
        timestamp: nowIso(),
        mode: 'PROD',
      };
    }
    await delay(80);
    const xml = this.buildVirementBatchXml(virements, dateExecution);
    const accuse = buildMockAccuse(`${this.code}-VIR`);
    const result: VirementBatchResult = {
      accuse,
      xml,
      nbVirements: virements.length,
      montantTotal: round2(virements.reduce((s, v) => s + v.montant, 0)),
    };
    // @i18n-exempt — internal audit log entry, persisted FR; covered by Wave D2.
    this.audit.log(
      'EXPORT',
      `BANQUE_${this.code}`,
      dateExecution,
      `Remise ${this.code} ${dateExecution}`,
      `${virements.length} virement(s) — accusé ${accuse} (mock)`,
    );
    return {
      status: 'SUCCES',
      accuse,
      // @i18n-exempt — mock integration response (admin sandbox), covered by Wave D2.
      message: `Batch ${virements.length} virement(s) accepté par ${this.nom} (mock).`,
      data: result,
      timestamp: nowIso(),
      mode: 'MOCK',
    };
  }

  async recupererReleveBancaire(
    compte: string,
    dateDebut: string,
    dateFin: string,
  ): Promise<IntegrationCallResult<EcritureBancaire[]>> {
    if (this._mode() === 'PROD') {
      return {
        status: 'EN_ATTENTE',
        message: `Mode PROD ${this.code} non encore branché.`,
        timestamp: nowIso(),
        mode: 'PROD',
      };
    }
    await delay(80);
    const ecritures: EcritureBancaire[] = this.buildMockReleve(compte, dateDebut, dateFin);
    return {
      status: 'SUCCES',
      data: ecritures,
      message: `Relevé ${this.code} ${dateDebut}→${dateFin} (mock).`,
      timestamp: nowIso(),
      mode: 'MOCK',
    };
  }

  async recupererSoldes(
    comptes: string[],
  ): Promise<IntegrationCallResult<SoldeCompte[]>> {
    if (this._mode() === 'PROD') {
      return {
        status: 'EN_ATTENTE',
        message: `Mode PROD ${this.code} non encore branché.`,
        timestamp: nowIso(),
        mode: 'PROD',
      };
    }
    await delay(40);
    const soldes: SoldeCompte[] = comptes.map((c, i) => ({
      compte: c,
      solde: round2(100000 + i * 12345.67),
      devise: 'MAD',
      dateValeur: new Date().toISOString().slice(0, 10),
    }));
    return {
      status: 'SUCCES',
      data: soldes,
      message: `Soldes ${this.code} (mock).`,
      timestamp: nowIso(),
      mode: 'MOCK',
    };
  }

  /** XML virement batch (override par banque si format spécifique). */
  protected buildVirementBatchXml(
    virements: VirementBancaire[],
    dateExecution: string,
  ): string {
    const lignes = virements
      .map(
        (v) =>
          `  <Virement ref="${escapeXml(v.id)}" montant="${v.montant.toFixed(2)}" beneficiaire="${escapeXml(v.beneficiaire)}" rib="${escapeXml(v.rib)}" motif="${escapeXml(v.motif)}"/>`,
      )
      .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>
<RemiseVirements banque="${this.code}" format="${this.batchFormat}" dateExecution="${dateExecution}" xmlns="https://nafura.ma/integrations/banques">
${lignes}
</RemiseVirements>`;
  }

  /** Relevé mock — 3 écritures typées pour démo. */
  protected buildMockReleve(
    compte: string,
    dateDebut: string,
    _dateFin: string,
  ): EcritureBancaire[] {
    const base = new Date(dateDebut).getTime();
    return [
      {
        date: new Date(base).toISOString().slice(0, 10),
        libelle: 'VIR. RECU FACTURE FM-2026-00002',
        reference: 'VIR-IN-0001',
        credit: 250000,
        solde: 1250000,
        bankRef: `${this.code}-${compte}-0001`,
      },
      {
        date: new Date(base + 86400 * 1000).toISOString().slice(0, 10),
        libelle: 'VIR. EMIS PAIE 04/2026',
        reference: 'VIR-OUT-0044',
        debit: 412800,
        solde: 837200,
        bankRef: `${this.code}-${compte}-0044`,
      },
      {
        date: new Date(base + 2 * 86400 * 1000).toISOString().slice(0, 10),
        libelle: 'FRAIS BANCAIRES MENSUELS',
        reference: 'FB-04-2026',
        debit: 350,
        solde: 836850,
        bankRef: `${this.code}-${compte}-FB04`,
      },
    ];
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
