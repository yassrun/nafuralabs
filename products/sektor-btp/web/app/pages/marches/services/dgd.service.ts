import { Injectable } from '@angular/core';

import type { DGD } from '../models';

/**
 * Calcul DGD (Task 07 M-MAR-02) — formule alignée sur `07-marches.md` :
 * net à payer = cumul situations TTC − RG + reprises RG − pénalités + révision K.
 */
@Injectable({ providedIn: 'root' })
export class DgdService {
  computeMontantNetAPayer(input: {
    cumulSituationsTtc: number;
    cumulRetenueGarantie: number;
    cumulRevisionK: number;
    cumulPenalites: number;
    reprisesRG: number;
  }): number {
    const {
      cumulSituationsTtc,
      cumulRetenueGarantie,
      cumulRevisionK,
      cumulPenalites,
      reprisesRG,
    } = input;
    const raw =
      cumulSituationsTtc -
      cumulRetenueGarantie +
      reprisesRG -
      cumulPenalites +
      cumulRevisionK;
    return Math.round(raw * 100) / 100;
  }

  withComputedNet(dgd: Omit<DGD, 'montantNetAPayer'>): DGD {
    return {
      ...dgd,
      montantNetAPayer: this.computeMontantNetAPayer({
        cumulSituationsTtc: dgd.cumulSituationsTtc,
        cumulRetenueGarantie: dgd.cumulRetenueGarantie,
        cumulRevisionK: dgd.cumulRevisionK,
        cumulPenalites: dgd.cumulPenalites,
        reprisesRG: dgd.reprisesRG,
      }),
    };
  }
}
