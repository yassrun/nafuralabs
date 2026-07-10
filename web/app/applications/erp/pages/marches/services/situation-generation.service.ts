import { Injectable } from '@angular/core';

export interface SituationDraftLigneLot {
  lotCode: string;
  designation: string;
  avancementPercent: number;
  montantHtPeriode: number;
}

export interface SituationDraftBrouillon {
  marcheId: string;
  marcheNumero: string;
  chantierId: string;
  chantierCode: string;
  /** Montant HT facturable sur la période (delta depuis dernier cumul physique) */
  travauxPeriodeHt: number;
  revisionKHt: number;
  penalitesHt: number;
  retenueGarantiePercent: number;
  /** Estimé sur (travaux + K − pénalités) */
  retenueGarantieMontantHt: number;
  netHt: number;
  tvaTaux: number;
  tvaMontantHt: number;
  netTtc: number;
  lignesLots: SituationDraftLigneLot[];
}

/**
 * Génération brouillon situation depuis avancements physiques (Task 07 M-MAR-05, mock).
 */
@Injectable({ providedIn: 'root' })
export class SituationGenerationService {
  /**
   * Travaux HT période = max(0, montant marché × avancement% − cumul situations déjà facturé HT).
   */
  computeTravauxPeriodeHt(input: {
    montantMarcheHt: number;
    avancementPercent: number;
    cumulSituationsFactureHt: number;
  }): number {
    const cible = (input.montantMarcheHt * input.avancementPercent) / 100;
    const delta = cible - input.cumulSituationsFactureHt;
    return Math.max(0, Math.round(delta * 100) / 100);
  }

  /**
   * Ventile le montant période sur les lots proportionnellement à leur avancement.
   */
  buildLignesFromLots(
    lots: Array<{ code: string; designation: string; avancementPercent: number }>,
    travauxPeriodeHt: number,
  ): SituationDraftLigneLot[] {
    if (!lots.length || travauxPeriodeHt <= 0) {
      return [];
    }
    const sumW = lots.reduce((s, l) => s + Math.max(0, l.avancementPercent), 0);
    if (sumW <= 0) {
      return lots.map((l) => ({
        lotCode: l.code,
        designation: l.designation,
        avancementPercent: l.avancementPercent,
        montantHtPeriode: 0,
      }));
    }
    return lots.map((l) => {
      const w = Math.max(0, l.avancementPercent);
      const montantHtPeriode = Math.round(((travauxPeriodeHt * w) / sumW) * 100) / 100;
      return {
        lotCode: l.code,
        designation: l.designation,
        avancementPercent: l.avancementPercent,
        montantHtPeriode,
      };
    });
  }

  buildDraft(input: {
    marcheId: string;
    marcheNumero: string;
    chantierId: string;
    chantierCode: string;
    montantMarcheHt: number;
    avancementPercent: number;
    cumulSituationsFactureHt: number;
    revisionKHt: number;
    penalitesHt: number;
    retenueGarantiePercent: number;
    tvaTaux: number;
    lots: Array<{ code: string; designation: string; avancementPercent: number }>;
  }): SituationDraftBrouillon {
    const travauxPeriodeHt = this.computeTravauxPeriodeHt({
      montantMarcheHt: input.montantMarcheHt,
      avancementPercent: input.avancementPercent,
      cumulSituationsFactureHt: input.cumulSituationsFactureHt,
    });
    const base = travauxPeriodeHt + input.revisionKHt - input.penalitesHt;
    const rg = Math.round((Math.max(0, base) * input.retenueGarantiePercent) / 100);
    const netHt = Math.max(0, base - rg);
    const tvaMontantHt = Math.round((netHt * input.tvaTaux) / 100);
    const netTtc = netHt + tvaMontantHt;

    return {
      marcheId: input.marcheId,
      marcheNumero: input.marcheNumero,
      chantierId: input.chantierId,
      chantierCode: input.chantierCode,
      travauxPeriodeHt,
      revisionKHt: input.revisionKHt,
      penalitesHt: input.penalitesHt,
      retenueGarantiePercent: input.retenueGarantiePercent,
      retenueGarantieMontantHt: rg,
      netHt,
      tvaTaux: input.tvaTaux,
      tvaMontantHt,
      netTtc,
      lignesLots: this.buildLignesFromLots(input.lots, travauxPeriodeHt),
    };
  }
}
