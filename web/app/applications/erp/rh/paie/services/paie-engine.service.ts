import { Injectable } from '@angular/core';
import { BAREME_PAIE_MA_2026 as B } from './bareme-paie-2026';

export interface PaieInput {
  salaireBase: number;
  primes?: number;
  heuresSupMontant?: number;
  estCadre?: boolean;
  cimrTauxSalarial?: number;      // % cadre (3–6), default 3
  cimrTauxEmployeur?: number;     // % employeur, default 6
  personnesACharge?: number;      // déductions familiales
  retenuesExceptionnelles?: number;
  avantagesNature?: number;
}

export interface PaieResultat {
  // Brut
  salaireBrut: number;

  // Cotisations salariales
  cnss: number;
  amo: number;
  cimr: number;
  totalCotisationsSalariales: number;

  // Abattements
  fraisPro: number;
  chargesFamiliales: number;

  // Net imposable + IGR
  salaireNetImposable: number;
  igr: number;

  // Net à payer
  salaireNetAPayer: number;

  // Charges patronales
  cnssEmpl: number;
  amoEmpl: number;
  cimrEmpl: number;
  tfp: number;
  totalChargesPatronales: number;

  // Coût total entreprise
  coutTotal: number;
}

function round2(n: number): number { return Math.round(n * 100) / 100; }

@Injectable({ providedIn: 'root' })
export class PaieEngineService {
  /**
   * Calcule la fiche de paie mensuelle complète selon le barème MA 2026.
   * Corrige F-17 : CNSS correctement plafonnée, CIMR inclus, IGR barème mensuel 2026.
   */
  calculerFiche(input: PaieInput): PaieResultat {
    const brut = round2(
      input.salaireBase +
      (input.primes ?? 0) +
      (input.heuresSupMontant ?? 0) +
      (input.avantagesNature ?? 0),
    );

    // ── Cotisations salariales ─────────────────────────────────────────────
    // CNSS : plafonnée à 6 000 MAD/mois
    const cnss = round2(Math.min(brut, B.CNSS.prestationsSocialesPlafond) * B.CNSS.prestationsSocialesSalarialPercent / 100);
    // AMO : sans plafond
    const amo = round2(brut * B.AMO.salarialPercent / 100);
    // CIMR : si cadre, sinon 0
    const cimrTaux = input.estCadre ? (input.cimrTauxSalarial ?? B.CIMR.salarialPercentMin) : 0;
    const cimr = round2(brut * cimrTaux / 100);

    const totalCotisationsSalariales = round2(cnss + amo + cimr);

    // ── Abattements ────────────────────────────────────────────────────────
    const fraisPro = round2(Math.min(brut * B.FRAIS_PROFESSIONNELS.pourcentage / 100, B.FRAIS_PROFESSIONNELS.plafondMensuel));
    const nbPersonnes = Math.min(input.personnesACharge ?? 0, B.CHARGES_FAMILIALES.plafondPersonnes);
    const chargesFamiliales = round2(nbPersonnes * B.CHARGES_FAMILIALES.parPersonneACharge);

    // ── Net imposable ─────────────────────────────────────────────────────
    const salaireNetImposable = round2(brut - totalCotisationsSalariales - fraisPro);
    const baseIgr = Math.max(0, salaireNetImposable - chargesFamiliales);

    // ── IGR (barème mensuel 2026) ─────────────────────────────────────────
    const igr = round2(this.calculerIGR(baseIgr));

    // ── Net à payer ───────────────────────────────────────────────────────
    const salaireNetAPayer = round2(brut - totalCotisationsSalariales - igr - (input.retenuesExceptionnelles ?? 0));

    // ── Charges patronales ─────────────────────────────────────────────────
    const cnssEmpl = round2(Math.min(brut, B.CNSS.cnssEmployeurPlafond) * (B.CNSS.prestationsFamilialesEmployeurPercent + B.CNSS.assuranceAccidentTravailEmployeurPercent) / 100);
    const amoEmpl = round2(brut * B.AMO.employeurPercent / 100);
    const cimrEmplTaux = input.estCadre ? (input.cimrTauxEmployeur ?? B.CIMR.employeurPercentDefault) : 0;
    const cimrEmpl = round2(brut * cimrEmplTaux / 100);
    const tfp = round2(brut * B.TFP.employeurPercent / 100);
    const totalChargesPatronales = round2(cnssEmpl + amoEmpl + cimrEmpl + tfp);

    const coutTotal = round2(brut + totalChargesPatronales);

    return {
      salaireBrut: brut,
      cnss, amo, cimr, totalCotisationsSalariales,
      fraisPro, chargesFamiliales,
      salaireNetImposable, igr,
      salaireNetAPayer,
      cnssEmpl, amoEmpl, cimrEmpl, tfp, totalChargesPatronales,
      coutTotal,
    };
  }

  calculerIGR(baseImposable: number): number {
    if (baseImposable <= 0) return 0;
    for (const tranche of B.IGR_2026_MENSUEL) {
      if (baseImposable <= tranche.trancheJusquA) {
        return Math.max(0, baseImposable * tranche.taux / 100 - tranche.abattement);
      }
    }
    return 0;
  }
}
