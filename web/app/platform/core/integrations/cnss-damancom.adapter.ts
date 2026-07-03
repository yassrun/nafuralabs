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
 * Adaptateur CNSS DAMANCOM — BAP mensuel (M-INT-02).
 *
 * État Round 1 : écran XML BAP mensuel OK.
 * Round 2 : adaptateur stable prêt à brancher en prod.
 *
 * Portail : https://damancom.cnss.ma (API REST ou SFTP selon convention).
 * Auth : compte affilié + matricule.
 * Format : XML BAP (Bordereau d'Affiliation et de Paiement) mensuel.
 */

export interface DamancomEmployeur {
  raisonSociale: string;
  numeroAffiliation: string;
  ice: string;
  ville?: string;
}

export interface DamancomSalarie {
  matricule: string;
  nomPrenom: string;
  salaireBrut: number;
  cotisationCNSS: number;
  cotisationAMO: number;
  igr: number;
  salaireNetAPayer: number;
}

export interface DamancomBapInput {
  employeur: DamancomEmployeur;
  periode: string; // "YYYY-MM"
  salaries: DamancomSalarie[];
  /** Cotisation patronale totale calculée côté paie. */
  cotisationPatronaleTotale: number;
}

export interface DamancomAccuse {
  numeroBap: string;
  dateReception: string;
  nbSalaries: number;
  totalCotisations: number;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

@Injectable({ providedIn: 'root' })
export class CnssDamancomAdapter {
  private readonly audit = inject(ErpAuditService);

  readonly mode = signal<IntegrationMode>('MOCK');
  readonly auth = signal<IntegrationAuthConfig>({
    baseUrl: 'https://api.damancom.cnss.ma/bap',
  });

  setMode(mode: IntegrationMode, auth?: IntegrationAuthConfig): void {
    this.mode.set(mode);
    if (auth) this.auth.set(auth);
  }

  /** Totaux dérivés des salariés (utilisé partout dans le récap). */
  computeTotaux(input: DamancomBapInput): {
    brut: number;
    cnss: number;
    amo: number;
    igr: number;
    net: number;
    totalCotisations: number;
  } {
    const s = input.salaries;
    const brut = s.reduce((a, x) => a + x.salaireBrut, 0);
    const cnss = s.reduce((a, x) => a + x.cotisationCNSS, 0);
    const amo = s.reduce((a, x) => a + x.cotisationAMO, 0);
    const igr = s.reduce((a, x) => a + x.igr, 0);
    const net = s.reduce((a, x) => a + x.salaireNetAPayer, 0);
    return {
      brut: round2(brut),
      cnss: round2(cnss),
      amo: round2(amo),
      igr: round2(igr),
      net: round2(net),
      totalCotisations: round2(cnss + amo + input.cotisationPatronaleTotale),
    };
  }

  /** Construit le XML BAP conforme schéma DAMANCOM (mensuel). */
  buildXml(input: DamancomBapInput): string {
    const t = this.computeTotaux(input);
    const salariesXml = input.salaries
      .map(
        (s) => `    <Salarie>
      <Matricule>${escapeXml(s.matricule)}</Matricule>
      <NomPrenom>${escapeXml(s.nomPrenom)}</NomPrenom>
      <SalaireBrut>${s.salaireBrut.toFixed(2)}</SalaireBrut>
      <CotisationSalarialeCNSS>${s.cotisationCNSS.toFixed(2)}</CotisationSalarialeCNSS>
      <CotisationSalarialeAMO>${s.cotisationAMO.toFixed(2)}</CotisationSalarialeAMO>
      <IGR>${s.igr.toFixed(2)}</IGR>
      <SalaireNet>${s.salaireNetAPayer.toFixed(2)}</SalaireNet>
    </Salarie>`,
      )
      .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>
<DAMANCOM xmlns="urn:cnss.ma:damancom:bap:1.0">
  <Employeur>
    <NumeroAffiliation>${escapeXml(input.employeur.numeroAffiliation)}</NumeroAffiliation>
    <ICE>${escapeXml(input.employeur.ice)}</ICE>
    <RaisonSociale>${escapeXml(input.employeur.raisonSociale)}</RaisonSociale>
    <Periode>${escapeXml(input.periode)}</Periode>
  </Employeur>
  <Salaries>
${salariesXml}
  </Salaries>
  <Totaux>
    <NbSalaries>${input.salaries.length}</NbSalaries>
    <TotalBrut>${t.brut.toFixed(2)}</TotalBrut>
    <TotalCNSSSalariale>${t.cnss.toFixed(2)}</TotalCNSSSalariale>
    <TotalAMOSalariale>${t.amo.toFixed(2)}</TotalAMOSalariale>
    <TotalCotisationsPatronales>${input.cotisationPatronaleTotale.toFixed(2)}</TotalCotisationsPatronales>
    <TotalCotisations>${t.totalCotisations.toFixed(2)}</TotalCotisations>
    <TotalIGR>${t.igr.toFixed(2)}</TotalIGR>
    <TotalNet>${t.net.toFixed(2)}</TotalNet>
  </Totaux>
</DAMANCOM>`;
  }

  /**
   * Soumet le BAP à DAMANCOM.
   * MOCK : retourne un accusé local.
   * PROD : POST XML BAP + auth affilié (à brancher).
   */
  async submitBap(
    input: DamancomBapInput,
    options?: { simulateFailure?: boolean },
  ): Promise<IntegrationCallResult<DamancomAccuse>> {
    const totaux = this.computeTotaux(input);
    if (this.mode() === 'PROD') {
      return this.submitBapProd(input, totaux);
    }
    return this.submitBapMock(input, totaux, options?.simulateFailure ?? false);
  }

  private async submitBapMock(
    input: DamancomBapInput,
    totaux: { totalCotisations: number },
    simulateFailure: boolean,
  ): Promise<IntegrationCallResult<DamancomAccuse>> {
    await delay(120);
    if (simulateFailure) {
      this.audit.log(
        'EXPORT',
        'DAMANCOM',
        input.periode,
        input.employeur.numeroAffiliation,
        'API DAMANCOM — échec simulé (mock)',
      );
      return {
        status: 'ECHEC',
        errorCode: 'CNSS-MOCK-503',
        message: 'Erreur simulée — DAMANCOM indisponible.',
        timestamp: nowIso(),
        mode: 'MOCK',
      };
    }
    const accuse: DamancomAccuse = {
      numeroBap: buildMockAccuse('BAP'),
      dateReception: nowIso(),
      nbSalaries: input.salaries.length,
      totalCotisations: totaux.totalCotisations,
    };
    this.audit.log(
      'EXPORT',
      'DAMANCOM',
      input.periode,
      input.employeur.numeroAffiliation,
      `API DAMANCOM — accusé ${accuse.numeroBap} (mock)`,
    );
    return {
      status: 'SUCCES',
      accuse: accuse.numeroBap,
      message: 'BAP accepté par DAMANCOM (mock).',
      data: accuse,
      timestamp: nowIso(),
      mode: 'MOCK',
    };
  }

  private async submitBapProd(
    _input: DamancomBapInput,
    _totaux: { totalCotisations: number },
  ): Promise<IntegrationCallResult<DamancomAccuse>> {
    return {
      status: 'EN_ATTENTE',
      message: 'Mode PROD non encore branché — fournir compte DAMANCOM + matricule.',
      timestamp: nowIso(),
      mode: 'PROD',
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
