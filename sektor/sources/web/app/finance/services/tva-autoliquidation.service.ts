import { Injectable, inject } from '@angular/core';

import { FiscalSettingsService } from '../../shell/fiscal-settings.service';

export type TvaFacturationMode = 'NORMAL' | 'AUTOLIQUIDATION';

/**
 * TVA autoliquidation (Maroc) — cas démo aligné sur l’option « Autoliquidation TVA »
 * des paramètres fiscaux (`FiscalSettingsService`).
 *
 * Règles démo (MA, B2B grossier) :
 * - **B2B résident assujetti** (`prestataireNonResidentMaroc === false`) : toujours TVA classique sur facture.
 * - **Non-résident** + option autoliquidation active : TVA en autoliquidation ; net fournisseur = HT moins éventuelle
 *   **retenue TVA** (paramètre `retenueTvaSurAutoliquidationTaux` dans `FiscalSettingsService`, % de la TVA autoliq).
 * - **Auto-entrepreneur résident** : même logique d’autoliquidation côté acheteur (démo), avec retenue spécifique sur FF.
 * - `forceTvaClassique` : désactive l’autoliquidation (ex. convention, choix documentaire — démo).
 */
export interface TvaAutoliquidationResult {
  mode: TvaFacturationMode;
  /** Montant à payer au fournisseur (TTC classique, ou HT − retenue TVA en autoliquidation). */
  netAPayerFournisseur: number;
  /** TVA portée sur la facture fournisseur (0 en autoliquidation). */
  tvaSurFacture: number;
  /** TVA à intégrer en autoliquidation (déclaration entreprise), 0 si mode normal. */
  tvaAutoliquidationDeclaree: number;
  /** Retenue sur TVA autoliquidée (MAD), 0 si non applicable. */
  retenueTvaMontant: number;
  libelle: string;
}

@Injectable({ providedIn: 'root' })
export class TvaAutoliquidationService {
  private readonly fiscal = inject(FiscalSettingsService);

  /**
   * @param montantHt Montant HT de la prestation
   * @param tvaTauxPercent Taux TVA (ex. 20)
   * @param prestataireNonResidentMaroc Si true, l’autoliquidation peut s’appliquer si l’option société est active
   */
  compute(
    montantHt: number,
    tvaTauxPercent: number,
    prestataireNonResidentMaroc: boolean,
    options?: { forceTvaClassique?: boolean; prestataireAutoEntrepreneur?: boolean },
  ): TvaAutoliquidationResult {
    const tva = Math.round((montantHt * tvaTauxPercent) / 100);
    const settings = this.fiscal.settings();
    const autoliqEligible =
      settings.autoliquidationTvaActivee &&
      (prestataireNonResidentMaroc || !!options?.prestataireAutoEntrepreneur) &&
      tvaTauxPercent > 0 &&
      !options?.forceTvaClassique;

    if (!autoliqEligible) {
      return {
        mode: 'NORMAL',
        netAPayerFournisseur: montantHt + tva,
        tvaSurFacture: tva,
        tvaAutoliquidationDeclaree: 0,
        retenueTvaMontant: 0,
        libelle: options?.forceTvaClassique
          ? 'TVA classique (autoliquidation désactivée sur ce fournisseur / document).'
          : 'TVA classique sur facture fournisseur (B2B résident ou option autoliquidation inactive).',
      };
    }

    const pctRet = Math.max(0, Math.min(100, settings.retenueTvaSurAutoliquidationTaux ?? 0));
    const retenueTvaMontant = Math.round(((tva * pctRet) / 100) * 100) / 100;
    const netFournisseur = Math.round((montantHt - retenueTvaMontant) * 100) / 100;

    return {
      mode: 'AUTOLIQUIDATION',
      netAPayerFournisseur: netFournisseur,
      tvaSurFacture: 0,
      tvaAutoliquidationDeclaree: tva,
      retenueTvaMontant,
      libelle:
        pctRet > 0
          ? `Autoliquidation TVA (démo) : TVA déclarée ${tva} MAD ; retenue ${pctRet}% → ${retenueTvaMontant} MAD retenu sur paiement ; net fournisseur ${netFournisseur} MAD (HT − retenue).`
          : 'Autoliquidation TVA (démo) : paiement fournisseur = HT ; TVA due/déductible = même montant (neutre trésorerie). Réf. CGI — cas sous-traitance non-résident.',
    };
  }
}
