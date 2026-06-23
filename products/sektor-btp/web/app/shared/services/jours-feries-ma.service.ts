import { Injectable } from '@angular/core';

import {
  buildJoursFeriesMa,
  JOURS_FERIES_MA,
  type JourFerieMa,
} from '../data/jours-feries-ma';

/**
 * Service de référence pour les **jours fériés marocains** (M-MA-09).
 *
 * Utilisé par :
 *  - Planning Gantt chantier (exclusion jours non-travaillés)
 *  - Calcul des jours ouvrés (congés, retards, échéances de paiement)
 *  - Date pickers / sélecteurs (highlight calendrier)
 *
 * Le référentiel inclut les fêtes civiles fixes et les fêtes religieuses
 * islamiques (dates grégoriennes pré-calculées, à vérifier annuellement).
 */
@Injectable({ providedIn: 'root' })
export class JoursFeriesMaService {
  private readonly cache: Map<string, JourFerieMa> = new Map();
  private readonly all: JourFerieMa[] = [...JOURS_FERIES_MA];

  constructor() {
    for (const f of this.all) {
      this.cache.set(f.date, f);
    }
  }

  /** Liste complète des jours fériés (année courante − 1 → + 4). */
  list(): readonly JourFerieMa[] {
    return this.all;
  }

  /** Jours fériés d'une année donnée. */
  listForYear(year: number): JourFerieMa[] {
    return this.all.filter((f) => f.date.startsWith(`${year}-`));
  }

  /** Vérifie si une date (Date ou ISO YYYY-MM-DD) est un jour férié MA. */
  isFerie(date: Date | string): boolean {
    return this.cache.has(this.toIso(date));
  }

  /** Récupère la fiche du jour férié si la date en est un, sinon `undefined`. */
  getFerie(date: Date | string): JourFerieMa | undefined {
    return this.cache.get(this.toIso(date));
  }

  /** Vrai si la date tombe un week-end (samedi/dimanche). */
  isWeekend(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    const day = d.getDay();
    return day === 0 || day === 6;
  }

  /** Vrai si la date est ouvrée (ni week-end ni férié). */
  isOuvre(date: Date | string): boolean {
    return !this.isWeekend(date) && !this.isFerie(date);
  }

  /**
   * Calcule le nombre de **jours ouvrés** entre deux dates (incluses).
   * Exclut samedi / dimanche / fériés MA.
   * Si `fin < debut`, renvoie 0.
   */
  joursOuvres(debut: Date | string, fin: Date | string): number {
    const start = typeof debut === 'string' ? new Date(debut + 'T00:00:00') : new Date(debut);
    const end = typeof fin === 'string' ? new Date(fin + 'T00:00:00') : new Date(fin);
    if (end.getTime() < start.getTime()) return 0;
    let count = 0;
    const cursor = new Date(start);
    while (cursor.getTime() <= end.getTime()) {
      if (this.isOuvre(cursor)) count++;
      cursor.setDate(cursor.getDate() + 1);
    }
    return count;
  }

  /**
   * Ajoute `n` jours ouvrés à une date (saut samedi/dimanche/fériés).
   * Utilisé pour le calcul d'échéance « facture + 30 jours ouvrés ».
   */
  addJoursOuvres(debut: Date | string, n: number): Date {
    const cursor = typeof debut === 'string' ? new Date(debut + 'T00:00:00') : new Date(debut);
    let restant = n;
    while (restant > 0) {
      cursor.setDate(cursor.getDate() + 1);
      if (this.isOuvre(cursor)) restant--;
    }
    return cursor;
  }

  /** Force la régénération du référentiel pour une plage personnalisée (tests). */
  rebuild(fromYear: number, toYear: number): void {
    this.all.length = 0;
    this.cache.clear();
    const rebuilt = buildJoursFeriesMa(fromYear, toYear);
    this.all.push(...rebuilt);
    for (const f of this.all) {
      this.cache.set(f.date, f);
    }
  }

  private toIso(d: Date | string): string {
    if (typeof d === 'string') return d.slice(0, 10);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
