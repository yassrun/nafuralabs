import { Injectable } from '@angular/core';

export interface AvancementLotQuantities {
  quantite: number;
  cumulQuantite: number;
  avancementPercent: number;
  unite: string;
}

/**
 * Calculs purs pour saisie d'avancement physique (cumuls, %, alertes).
 */
@Injectable({ providedIn: 'root' })
export class AvancementCalculService {
  round(value: number): number {
    return Math.round(value * 10) / 10;
  }

  buildRow(
    lot: AvancementLotQuantities,
    quantitePeriode: number | null,
  ): {
    lastCumul: number;
    nouveauCumul: number;
    previousPercent: number;
    newPercent: number;
    deltaPercent: number;
    warningKey?: 'cumulExceeds' | 'highPeriodEntry';
    warningParams?: Record<string, string | number>;
  } {
    const lastCumul = lot.cumulQuantite;
    const nouveauCumul =
      quantitePeriode != null ? this.round(lastCumul + quantitePeriode) : lastCumul;
    const previousPercent = lot.avancementPercent;
    const newPercent =
      lot.quantite > 0 ? this.round(Math.min(100, (nouveauCumul / lot.quantite) * 100)) : 0;
    const deltaPercent = this.round(newPercent - previousPercent);
    let warningKey: 'cumulExceeds' | 'highPeriodEntry' | undefined;
    let warningParams: Record<string, string | number> | undefined;
    if (quantitePeriode != null && nouveauCumul > lot.quantite) {
      warningKey = 'cumulExceeds';
      warningParams = { quantite: lot.quantite, unite: lot.unite };
    } else if (quantitePeriode != null && quantitePeriode > lot.quantite * 0.3) {
      warningKey = 'highPeriodEntry';
    }
    return { lastCumul, nouveauCumul, previousPercent, newPercent, deltaPercent, warningKey, warningParams };
  }
}
