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
 * Adaptateur DGI SIMPL-IS — télédéclaration TVA mensuelle (M-INT-01).
 *
 * État Round 1 : écran XML mensuel TVA OK.
 * Round 2 : ajout d'un adaptateur stable prêt à brancher en prod.
 *
 * Endpoint placeholder : https://api-dgi.gov.ma/simpl-is/declarations
 * Auth : certificat client + token.
 * Format : XML conforme schéma DGI (annexes ventes / achats + récap TVA).
 */

/** Détail société contribuable utilisé pour générer la déclaration. */
export interface SimplIsContribuable {
  raisonSociale: string;
  ice: string;
  ifNum: string;
}

/** Annexe ventes (TVA collectée). */
export interface SimplIsVenteAnnexe {
  id: string;
  numero: string;
  client: string;
  ice?: string;
  ht: number;
  tvaTaux: number;
  tva: number;
  ttc: number;
}

/** Annexe achats (TVA déductible). */
export interface SimplIsAchatAnnexe {
  id: string;
  numero: string;
  fournisseur: string;
  iceFournisseur?: string;
  ht: number;
  tvaTaux: number;
  tva: number;
  ttc: number;
}

/** Données complètes nécessaires pour bâtir + soumettre la déclaration. */
export interface SimplIsDeclarationInput {
  contribuable: SimplIsContribuable;
  periode: string; // "YYYY-MM"
  ventes: SimplIsVenteAnnexe[];
  achats?: SimplIsAchatAnnexe[];
  /** TVA déductible si calcul externe (sinon dérivée des achats). */
  tvaDeductibleOverride?: number;
}

/** Payload retourné par l'API DGI (réel ou mock). */
export interface SimplIsAccuse {
  numeroTeledeclaration: string;
  dateReception: string;
  hashDocument?: string;
  tvaNetteAPayer: number;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

@Injectable({ providedIn: 'root' })
export class DgiSimplIsAdapter {
  private readonly audit = inject(ErpAuditService);

  /** Mode courant (par défaut MOCK pour démo / dev). */
  readonly mode = signal<IntegrationMode>('MOCK');
  /** Config auth (token + certificat) — vide en mock. */
  readonly auth = signal<IntegrationAuthConfig>({
    baseUrl: 'https://api-dgi.gov.ma/simpl-is/declarations',
  });

  /** Bascule mode (PROD nécessite token + certificat). */
  setMode(mode: IntegrationMode, auth?: IntegrationAuthConfig): void {
    this.mode.set(mode);
    if (auth) this.auth.set(auth);
  }

  /** Calcul totaux ventes + TVA déductible (helper réutilisable). */
  computeTotaux(input: SimplIsDeclarationInput): {
    htVentes: number;
    tvaCollectee: number;
    tvaDeductible: number;
    tvaNette: number;
  } {
    const htVentes = input.ventes.reduce((s, v) => s + v.ht, 0);
    const tvaCollectee = input.ventes.reduce((s, v) => s + v.tva, 0);
    const tvaDeductible =
      input.tvaDeductibleOverride ??
      (input.achats?.reduce((s, a) => s + a.tva, 0) ?? Math.round(tvaCollectee * 0.25 * 100) / 100);
    return {
      htVentes: round2(htVentes),
      tvaCollectee: round2(tvaCollectee),
      tvaDeductible: round2(tvaDeductible),
      tvaNette: round2(tvaCollectee - tvaDeductible),
    };
  }

  /** Construit le XML SIMPL-IS conforme schéma DGI (annexes + récap). */
  buildXml(input: SimplIsDeclarationInput): string {
    const t = this.computeTotaux(input);
    const ventesXml = input.ventes
      .map(
        (v) => `    <Vente>
      <NumeroFacture>${escapeXml(v.numero)}</NumeroFacture>
      <Client>${escapeXml(v.client)}</Client>
      <IceClient>${escapeXml(v.ice ?? '')}</IceClient>
      <MontantHT>${v.ht.toFixed(2)}</MontantHT>
      <TauxTVA>${v.tvaTaux}</TauxTVA>
      <TVACollectee>${v.tva.toFixed(2)}</TVACollectee>
      <TTC>${v.ttc.toFixed(2)}</TTC>
    </Vente>`,
      )
      .join('\n');
    const achatsXml = (input.achats ?? [])
      .map(
        (a) => `    <Achat>
      <NumeroFacture>${escapeXml(a.numero)}</NumeroFacture>
      <Fournisseur>${escapeXml(a.fournisseur)}</Fournisseur>
      <IceFournisseur>${escapeXml(a.iceFournisseur ?? '')}</IceFournisseur>
      <MontantHT>${a.ht.toFixed(2)}</MontantHT>
      <TauxTVA>${a.tvaTaux}</TauxTVA>
      <TVADeductible>${a.tva.toFixed(2)}</TVADeductible>
      <TTC>${a.ttc.toFixed(2)}</TTC>
    </Achat>`,
      )
      .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>
<DeclarationTVA xmlns="urn:dgi.gov.ma:simpl-is:1.0">
  <Contribuable>
    <IF>${escapeXml(input.contribuable.ifNum)}</IF>
    <ICE>${escapeXml(input.contribuable.ice)}</ICE>
    <RaisonSociale>${escapeXml(input.contribuable.raisonSociale)}</RaisonSociale>
    <Periode>${escapeXml(input.periode)}</Periode>
  </Contribuable>
  <AnnexeVentes>
${ventesXml}
  </AnnexeVentes>
  <AnnexeAchats>
${achatsXml}
  </AnnexeAchats>
  <Recapitulatif>
    <TotalHTVentes>${t.htVentes.toFixed(2)}</TotalHTVentes>
    <TVACollectee>${t.tvaCollectee.toFixed(2)}</TVACollectee>
    <TVADeductible>${t.tvaDeductible.toFixed(2)}</TVADeductible>
    <TVANetteAPayer>${t.tvaNette.toFixed(2)}</TVANetteAPayer>
  </Recapitulatif>
</DeclarationTVA>`;
  }

  /**
   * Soumet la déclaration à la DGI.
   * MOCK : retourne un accusé local après ~ms simulés.
   * PROD : POST XML + certificat client (à brancher quand identifiants disponibles).
   */
  async submit(
    input: SimplIsDeclarationInput,
    options?: { simulateFailure?: boolean },
  ): Promise<IntegrationCallResult<SimplIsAccuse>> {
    const xml = this.buildXml(input);
    const totaux = this.computeTotaux(input);
    if (this.mode() === 'PROD') {
      return this.submitProd(xml, totaux);
    }
    return this.submitMock(input, totaux, options?.simulateFailure ?? false);
  }

  private async submitMock(
    input: SimplIsDeclarationInput,
    totaux: { tvaNette: number },
    simulateFailure: boolean,
  ): Promise<IntegrationCallResult<SimplIsAccuse>> {
    await delay(120);
    if (simulateFailure) {
      this.audit.log(
        'EXPORT',
        'SIMPL_IS',
        input.periode,
        input.contribuable.ifNum,
        'API SIMPL-IS — échec simulé (mock)',
      );
      return {
        status: 'ECHEC',
        errorCode: 'DGI-MOCK-500',
        message: 'Erreur simulée — service DGI indisponible.',
        timestamp: nowIso(),
        mode: 'MOCK',
      };
    }
    const accuse: SimplIsAccuse = {
      numeroTeledeclaration: buildMockAccuse('SIMPL-IS'),
      dateReception: nowIso(),
      tvaNetteAPayer: totaux.tvaNette,
    };
    this.audit.log(
      'EXPORT',
      'SIMPL_IS',
      input.periode,
      input.contribuable.ifNum,
      `API SIMPL-IS — accusé ${accuse.numeroTeledeclaration} (mock)`,
    );
    return {
      status: 'SUCCES',
      accuse: accuse.numeroTeledeclaration,
      message: 'Déclaration TVA acceptée (mock).',
      data: accuse,
      timestamp: nowIso(),
      mode: 'MOCK',
    };
  }

  private async submitProd(
    _xml: string,
    _totaux: { tvaNette: number },
  ): Promise<IntegrationCallResult<SimplIsAccuse>> {
    // Branchement réel à faire quand certificat + token DGI disponibles.
    // POST `${this.auth().baseUrl}` avec body = _xml et headers Auth Bearer.
    return {
      status: 'EN_ATTENTE',
      message: 'Mode PROD non encore branché — fournir certificat client + token DGI.',
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
