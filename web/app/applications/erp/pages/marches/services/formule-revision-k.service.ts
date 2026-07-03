import { Injectable } from '@angular/core';

import type { FormuleRevisionK } from '../models';

/**
 * Coefficient K pour révisions de prix marchés (indices BTP / MO).
 */
@Injectable({ providedIn: 'root' })
export class FormuleRevisionKService {
  /**
   * @returns K arrondi à 4 décimales, ou NaN si un indice requis est absent.
   */
  calculerK(formule: FormuleRevisionK, indicesMois: Map<string, number>): number {
    let k = formule.termeFixe;
    for (const t of formule.termesVariables) {
      const courant = indicesMois.get(t.indiceCode);
      if (!courant) return NaN;
      k += t.coefficient * (courant / t.indiceBaseValeur);
    }
    return Math.round(k * 10000) / 10000;
  }
}
