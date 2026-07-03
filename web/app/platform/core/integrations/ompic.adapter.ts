import { Injectable, inject, signal } from '@angular/core';

import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';

import {
  nowIso,
  type IntegrationAuthConfig,
  type IntegrationCallResult,
  type IntegrationMode,
} from './integration.types';

/**
 * Adaptateur OMPIC — autocomplete tiers via ICE/IF/RC (M-INT-07).
 *
 * Cas d'usage : à la création d'un client / fournisseur / MOA, l'utilisateur
 * saisit l'ICE → bouton « Vérifier OMPIC » → l'adapter renvoie la raison
 * sociale, IF, RC et la forme juridique pour pré-remplir le formulaire.
 *
 * Source : Office Marocain Propriété Industrielle et Commerciale.
 */

export interface OmpicTiersData {
  raisonSociale: string;
  ice: string;
  ifNum?: string;
  rcNumero?: string;
  rcVille?: string;
  formeJuridique?: string;
  adresse?: string;
  ville?: string;
  /** Confiance source — utilisée pour info user. */
  confiance: 'CERTIFIEE' | 'PROBABLE' | 'INCONNUE';
}

/** Seed démo — 5 entreprises connues utilisées dans les autres mocks. */
const SEED_OMPIC: OmpicTiersData[] = [
  {
    raisonSociale: 'Nafura BTP SARL',
    ice: '002345678901234',
    ifNum: '87654321',
    rcNumero: '715869',
    rcVille: 'Casablanca',
    formeJuridique: 'SARL',
    adresse: 'Boulevard Mohammed VI, Casablanca',
    ville: 'Casablanca',
    confiance: 'CERTIFIEE',
  },
  {
    raisonSociale: 'Ministère Équipement & Eau',
    ice: '000000000000001',
    rcNumero: '—',
    rcVille: 'Rabat',
    formeJuridique: 'ADMINISTRATION_PUBLIQUE',
    adresse: 'Boulevard Hassan II, Rabat',
    ville: 'Rabat',
    confiance: 'CERTIFIEE',
  },
  {
    raisonSociale: 'OCP Group SA',
    ice: '000000000000002',
    ifNum: '00000001',
    rcNumero: '40327',
    rcVille: 'Casablanca',
    formeJuridique: 'SA',
    adresse: '2-4 Rue Al Abtal, Hay Erraha, Casablanca',
    ville: 'Casablanca',
    confiance: 'CERTIFIEE',
  },
  {
    raisonSociale: 'Holmarcom Holding',
    ice: '000000000000003',
    ifNum: '00000003',
    rcNumero: '52701',
    rcVille: 'Casablanca',
    formeJuridique: 'SA',
    adresse: 'Bd Anoual, Casablanca',
    ville: 'Casablanca',
    confiance: 'PROBABLE',
  },
  {
    raisonSociale: 'Cimar SA',
    ice: '000000000000004',
    ifNum: '00000004',
    rcNumero: '20351',
    rcVille: 'Casablanca',
    formeJuridique: 'SA',
    adresse: 'Aïn Sebaâ, Casablanca',
    ville: 'Casablanca',
    confiance: 'PROBABLE',
  },
];

@Injectable({ providedIn: 'root' })
export class OmpicAdapter {
  private readonly audit = inject(ErpAuditService);

  readonly mode = signal<IntegrationMode>('MOCK');
  readonly auth = signal<IntegrationAuthConfig>({
    baseUrl: 'https://api.ompic.ma/v1/entreprises',
  });

  setMode(mode: IntegrationMode, auth?: IntegrationAuthConfig): void {
    this.mode.set(mode);
    if (auth) this.auth.set(auth);
  }

  /** Recherche par ICE (format 15 chiffres). */
  async rechercherParIce(ice: string): Promise<IntegrationCallResult<OmpicTiersData>> {
    const cleaned = ice.replace(/\s/g, '');
    if (this.mode() === 'PROD') {
      return {
        status: 'EN_ATTENTE',
        message: 'Mode PROD non encore branché — API OMPIC à publier.',
        timestamp: nowIso(),
        mode: 'PROD',
      };
    }
    await delay(120);
    const found = SEED_OMPIC.find((e) => e.ice === cleaned);
    if (!found) {
      this.audit.log(
        'EXPORT',
        'OMPIC',
        cleaned,
        `OMPIC ICE ${cleaned}`,
        'OMPIC — ICE introuvable (mock)',
      );
      return {
        status: 'ECHEC',
        errorCode: 'OMPIC-404',
        message: `Aucune entreprise trouvée pour ICE ${cleaned} (mock).`,
        timestamp: nowIso(),
        mode: 'MOCK',
      };
    }
    this.audit.log(
      'EXPORT',
      'OMPIC',
      cleaned,
      `OMPIC ICE ${cleaned}`,
      `OMPIC — ${found.raisonSociale} (mock)`,
    );
    return {
      status: 'SUCCES',
      message: `Entreprise trouvée : ${found.raisonSociale}.`,
      data: found,
      timestamp: nowIso(),
      mode: 'MOCK',
    };
  }

  /** Recherche par raison sociale partielle (autocomplete UI). */
  async rechercherParNom(query: string): Promise<IntegrationCallResult<OmpicTiersData[]>> {
    if (this.mode() === 'PROD') {
      return {
        status: 'EN_ATTENTE',
        message: 'Mode PROD non encore branché.',
        timestamp: nowIso(),
        mode: 'PROD',
      };
    }
    await delay(80);
    const q = query.trim().toLowerCase();
    const matches = q.length === 0
      ? []
      : SEED_OMPIC.filter((e) => e.raisonSociale.toLowerCase().includes(q));
    return {
      status: 'SUCCES',
      data: matches,
      // @i18n-exempt — mock integration response (admin sandbox), covered by Wave D2.
      message: `${matches.length} résultat(s) pour « ${query} » (mock).`,
      timestamp: nowIso(),
      mode: 'MOCK',
    };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
