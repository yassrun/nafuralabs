import { Injectable } from '@angular/core';
import type { Marche, MarcheNature } from '../models';

const PUBLIC_NATURES: MarcheNature[] = ['PUBLIC'];

@Injectable({ providedIn: 'root' })
export class RetenueSourceService {
  /**
   * Retenue à la source 5% sur travaux fournis à l'État (art. 158 CGI Maroc).
   * Conditions : MOA = personne morale de droit public.
   */
  estApplicable(marche: Pick<Marche, 'nature' | 'retenueSourceTaux'>): boolean {
    return PUBLIC_NATURES.includes(marche.nature) && marche.retenueSourceTaux > 0;
  }

  calculer(montantHt: number, taux = 5): number {
    return Math.round(montantHt * taux / 100);
  }
}
