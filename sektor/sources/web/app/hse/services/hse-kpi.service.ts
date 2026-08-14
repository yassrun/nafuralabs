import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HseKpiService {
  /**
   * TF1 — accidents du travail avec arrêt × 1 000 000 / heures travaillées.
   * @param accidentsAvecArret Nombre d'AT avec arrêt sur la période
   * @param heuresTravailTotal Heures travaillées (chantier ou entreprise)
   */
  tf1(accidentsAvecArret: number, heuresTravailTotal: number): number {
    if (heuresTravailTotal <= 0 || accidentsAvecArret <= 0) return 0;
    return (accidentsAvecArret * 1_000_000) / heuresTravailTotal;
  }
}
