import { Injectable, inject, signal } from '@angular/core';

import type { PhaseChantier } from '@applications/erp/chantiers/models';

import type { VisiteMedicale } from '../models';
import { VisiteMedicaleApiService } from '../visites-medicales/services/visite-medicale-api.service';

/**
 * Règle métier : ne pas valider un décalage de phase chantier si le responsable de phase
 * a une **dernière** visite médicale avec aptitude **INAPTE** (déclaration CNSS / médecine du travail).
 */
@Injectable({ providedIn: 'root' })
export class HseVisiteMedicalePlanningService {
  private readonly api = inject(VisiteMedicaleApiService);
  private readonly visitesCache = signal<VisiteMedicale[]>([]);

  constructor() {
    void this.refreshCache();
  }

  async refreshCache(): Promise<void> {
    const { items } = await this.api.getAll();
    this.visitesCache.set(items);
  }

  /**
   * @returns `ok: false` pour bloquer la planification ; message destiné à l’utilisateur.
   */
  evaluatePhaseReschedule(phase: PhaseChantier): { ok: boolean; message?: string } {
    const employeId = phase.responsableId;
    if (!employeId) {
      return { ok: true };
    }

    const sorted = [...this.visitesCache()]
      .filter((v) => v.employeId === employeId)
      .sort((a, b) => b.date.localeCompare(a.date));

    const latest = sorted[0];
    if (!latest || latest.aptitude !== 'INAPTE') {
      return { ok: true };
    }

    return {
      ok: false,
      message:
        `Planification bloquée : visite médicale INAPTE (${latest.date}) pour ${latest.employeNom} — ` +
        `réaffecter le responsable de phase ou lever l’inaptitude avant replanification (règle HSE démo).`,
    };
  }
}
