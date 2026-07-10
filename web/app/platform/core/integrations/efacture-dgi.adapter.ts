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
 * Adaptateur e-facture DGI — transmission API DGI (M-INT-05).
 *
 * Obligatoire CA > 50M MAD à partir de 2026-2027.
 * Coord : §08 M-FIN-06 (`EfactureService` calcule QR + hash côté finance).
 *
 * Ici on se contente d'encapsuler l'envoi de la facture (avec son hash, QR,
 * signature) à l'API DGI. Le calcul du QR/hash reste côté finance pour
 * découpler.
 */

export interface EfactureTransmissionPayload {
  /** Numéro facture interne (FM-2026-00003). */
  numeroFacture: string;
  /** ICE du contribuable émetteur. */
  iceEmetteur: string;
  /** ICE du client (si entreprise). */
  iceClient?: string;
  /** Hash signé canon SHA-256 de la facture. */
  hashEfacture: string;
  /** Données QR code DGI-like. */
  qrCodeData: string;
  /** Cert ID de signature. */
  signatureCertId: string;
  /** Totaux HT/TVA/TTC. */
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  /** PDF base64 ou URL archive. */
  pdfArchiveUrl: string;
}

export interface EfactureAccuse {
  numeroDgi: string;
  dateReception: string;
  qrCodeData: string;
  archiveDgiUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class EfactureDgiAdapter {
  private readonly audit = inject(ErpAuditService);

  readonly mode = signal<IntegrationMode>('MOCK');
  readonly auth = signal<IntegrationAuthConfig>({
    baseUrl: 'https://api-dgi.gov.ma/efacture/v1',
  });

  setMode(mode: IntegrationMode, auth?: IntegrationAuthConfig): void {
    this.mode.set(mode);
    if (auth) this.auth.set(auth);
  }

  /**
   * Transmet une facture à l'API e-facture DGI.
   * MOCK : retourne un numéro DGI fictif + écho QR.
   * PROD : POST JSON signé (à brancher quand API publiée).
   */
  async transmettre(
    payload: EfactureTransmissionPayload,
    options?: { simulateFailure?: boolean },
  ): Promise<IntegrationCallResult<EfactureAccuse>> {
    if (this.mode() === 'PROD') {
      return {
        status: 'EN_ATTENTE',
        message: 'Mode PROD non encore branché — API e-facture DGI à publier.',
        timestamp: nowIso(),
        mode: 'PROD',
      };
    }
    await delay(100);
    if (options?.simulateFailure) {
      this.audit.log(
        'EXPORT',
        'EFACTURE_DGI',
        payload.numeroFacture,
        payload.iceEmetteur,
        'API e-facture — échec simulé (mock)',
      );
      return {
        status: 'ECHEC',
        errorCode: 'DGI-EFAC-MOCK-500',
        message: 'Erreur simulée — service e-facture DGI indisponible.',
        timestamp: nowIso(),
        mode: 'MOCK',
      };
    }
    const accuse: EfactureAccuse = {
      numeroDgi: buildMockAccuse('EFAC-DGI'),
      dateReception: nowIso(),
      qrCodeData: payload.qrCodeData,
      archiveDgiUrl: `/archives/dgi/${payload.numeroFacture}.pdf`,
    };
    this.audit.log(
      'EXPORT',
      'EFACTURE_DGI',
      payload.numeroFacture,
      payload.iceEmetteur,
      `e-facture transmise — réf DGI ${accuse.numeroDgi} (mock)`,
    );
    return {
      status: 'SUCCES',
      accuse: accuse.numeroDgi,
      message: 'Facture transmise à la DGI (mock).',
      data: accuse,
      timestamp: nowIso(),
      mode: 'MOCK',
    };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
