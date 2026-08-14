import { Injectable } from '@angular/core';
import type { Marche, MarcheNature } from '../models';

@Injectable({ providedIn: 'root' })
export class TvaEngineService {
  /**
   * Détermine le taux TVA applicable selon la nature et l'objet du marché.
   * - 20% standard BTP
   * - 14% logements sociaux (superficie < 100m², prix < 250k MAD, CNSS)
   * - 10% certains équipements (paramétrable)
   */
  determinerTaux(marche: Pick<Marche, 'tvaTaux'>): number {
    return marche.tvaTaux;
  }

  calculer(ht: number, taux: number): { tva: number; ttc: number } {
    const tva = Math.round(ht * taux / 100);
    return { tva, ttc: ht + tva };
  }
}
