import { Injectable } from '@angular/core';

export type ModePaiement = 'VIREMENT' | 'CHEQUE' | 'ESPECES' | 'AUTRE';

@Injectable({ providedIn: 'root' })
export class TimbreFiscalService {
  /**
   * Timbre fiscal : 0.25% si paiement espèces > 10 000 MAD.
   * Plafonné à 100 MAD par facture.
   */
  calculer(montantTtc: number, modePaiement: ModePaiement): number {
    if (modePaiement !== 'ESPECES') return 0;
    if (montantTtc <= 10000) return 0;
    return Math.min(100, Math.round(montantTtc * 0.0025));
  }
}
