import { Injectable } from '@angular/core';

import type { FactureClient } from '@applications/erp/ventes/models';

export interface EfacturePayload {
  hashEfacture: string;
  qrCodeData: string;
  signatureCertId: string;
  signatureDate: string;
  archiveElectroniqueUrl: string;
  efactureTransmiseDgi: boolean;
  efactureNumeroDgi?: string;
}

/**
 * Mock conforme démo : hash SHA-256 simulé sur canon JSON minimal + QR data DGI-like.
 * Production : brancher certificat fiscal + API DGI (Task 16).
 */
@Injectable({ providedIn: 'root' })
export class EfactureService {
  buildPayload(facture: FactureClient): EfacturePayload {
    const canon = this.canonicalJson(facture);
    const hashEfacture = this.mockSha256Hex(canon);
    const qrCodeData = this.buildQrPayload(facture, hashEfacture);
    const signatureDate = new Date().toISOString();
    return {
      hashEfacture,
      qrCodeData,
      signatureCertId: 'CERT-DGI-MOCK-2026',
      signatureDate,
      archiveElectroniqueUrl: `/archives/factures/${facture.id}.pdf`,
      efactureTransmiseDgi: false,
      efactureNumeroDgi: undefined,
    };
  }

  canonicalJson(f: FactureClient): string {
    return JSON.stringify({
      id: f.id,
      numero: f.numero,
      clientId: f.clientId,
      dateEmission: f.dateEmission,
      netAPayerTtc: f.netAPayerTtc,
      totalHt: f.totalHt,
      tvaTaux: f.tvaTaux,
    });
  }

  buildQrPayload(facture: FactureClient, hashHex: string): string {
    return [
      'NAFURA-EFACTURE',
      `N:${facture.numero}`,
      `ICE:${facture.clientId}`,
      `HT:${facture.totalHt.toFixed(2)}`,
      `TTC:${facture.netAPayerTtc.toFixed(2)}`,
      `H:${hashHex}`,
    ].join('|');
  }

  /** Déterministe pour les tests (non cryptographique). */
  mockSha256Hex(input: string): string {
    let h = 2166136261;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const hex = (h >>> 0).toString(16).padStart(8, '0');
    return `sha256-mock-${hex.repeat(8).slice(0, 64)}`;
  }
}
