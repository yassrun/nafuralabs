import { Injectable } from '@angular/core';

import type { FactureClient } from '@applications/erp/ventes/models';
import type { NiveauRelance, SuiviRecouvrement } from '../models';

function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso).getTime();
  const b = new Date(toIso).getTime();
  return Math.floor((b - a) / 86_400_000);
}

@Injectable({ providedIn: 'root' })
export class RecouvrementService {
  buildSuivis(factures: FactureClient[], todayIso: string): SuiviRecouvrement[] {
    const out: SuiviRecouvrement[] = [];
    for (const f of factures) {
      if (f.status === 'ANNULEE' || f.status === 'BROUILLON') continue;
      if (f.resteTtc <= 0.01) continue;
      const joursRetard = Math.max(0, daysBetween(f.dateEcheance, todayIso));
      if (joursRetard <= 0) continue;
      out.push({
        factureId: f.id,
        clientId: f.clientId,
        clientName: f.clientName,
        numeroFacture: f.numero,
        montantTtc: f.resteTtc,
        dateEcheance: f.dateEcheance,
        joursRetard,
        niveauRelance: this.niveauFromRetard(joursRetard),
        totalRelances: 0,
      });
    }
    return out.sort((a, b) => b.joursRetard - a.joursRetard);
  }

  niveauFromRetard(joursRetard: number): NiveauRelance {
    if (joursRetard < 15) return 1;
    if (joursRetard < 30) return 2;
    if (joursRetard < 45) return 3;
    return 4;
  }
}
