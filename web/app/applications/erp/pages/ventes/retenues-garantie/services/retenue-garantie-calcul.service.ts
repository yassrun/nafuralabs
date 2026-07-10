import { Injectable } from '@angular/core';

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Calculs légers sur retenues de garantie (délais, listing).
 */
@Injectable({ providedIn: 'root' })
export class RetenueGarantieCalculService {
  /** Jours restants jusqu'à la date prévue (peut être négatif si dépassée). */
  delaiRestantJours(dateLiberationPrevue: string | undefined, referenceDate: Date): number | null {
    if (!dateLiberationPrevue) return null;
    const target = new Date(dateLiberationPrevue);
    if (Number.isNaN(target.getTime())) return null;
    return Math.round((target.getTime() - referenceDate.getTime()) / ONE_DAY_MS);
  }
}
