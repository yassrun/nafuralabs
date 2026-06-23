import { Injectable, signal, computed, inject } from '@angular/core';

import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';

/**
 * Service d'import / suivi des indices BTP01..xx publiés mensuellement
 * par ANP (Agence Nationale des Ports) et HCP (Haut Commissariat au Plan).
 * (M-INT-06 — coord §07 M-MAR-09 révision K)
 *
 * Format CSV public : code;periode;valeur;libelle
 * Ex. BTP01;2026-04;128.34;Tous travaux du bâtiment
 *
 * Round 1 : `FormuleRevisionKService` consomme `Map<string, number>` →
 * ce service alimente cette map à partir d'un CSV téléchargé manuellement
 * ou d'un job planifié (à brancher).
 */

export interface IndiceBtpRow {
  code: string; // ex. BTP01, BTP02, MO01
  periode: string; // YYYY-MM
  valeur: number;
  libelle?: string;
  source?: 'ANP' | 'HCP' | 'IMPORT_MANUEL';
}

const STORAGE_KEY = 'nafura-indices-btp';

/** Seed minimal : 3 indices x 3 mois pour la démo. */
function buildSeedIndices(): IndiceBtpRow[] {
  return [
    { code: 'BTP01', periode: '2026-03', valeur: 127.18, libelle: 'Tous travaux du bâtiment', source: 'HCP' },
    { code: 'BTP01', periode: '2026-04', valeur: 128.34, libelle: 'Tous travaux du bâtiment', source: 'HCP' },
    { code: 'BTP01', periode: '2026-05', valeur: 128.91, libelle: 'Tous travaux du bâtiment', source: 'HCP' },
    { code: 'BTP18', periode: '2026-03', valeur: 142.05, libelle: 'Aciers à béton', source: 'HCP' },
    { code: 'BTP18', periode: '2026-04', valeur: 143.20, libelle: 'Aciers à béton', source: 'HCP' },
    { code: 'BTP18', periode: '2026-05', valeur: 144.10, libelle: 'Aciers à béton', source: 'HCP' },
    { code: 'MO01', periode: '2026-03', valeur: 118.40, libelle: 'Main d œuvre BTP', source: 'HCP' },
    { code: 'MO01', periode: '2026-04', valeur: 119.05, libelle: 'Main d œuvre BTP', source: 'HCP' },
    { code: 'MO01', periode: '2026-05', valeur: 119.60, libelle: 'Main d œuvre BTP', source: 'HCP' },
  ];
}

function loadFromStorage(): IndiceBtpRow[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as IndiceBtpRow[]) : buildSeedIndices();
  } catch {
    return buildSeedIndices();
  }
}

@Injectable({ providedIn: 'root' })
export class IndicesBtpImportService {
  private readonly audit = inject(ErpAuditService);

  private readonly _indices = signal<IndiceBtpRow[]>(loadFromStorage());
  readonly indices = this._indices.asReadonly();

  /** Liste triée par période desc puis code asc. */
  readonly indicesTries = computed(() =>
    [...this._indices()].sort((a, b) => {
      if (a.periode !== b.periode) return b.periode.localeCompare(a.periode);
      return a.code.localeCompare(b.code);
    }),
  );

  /** Map `code -> valeur` pour une période donnée (utilisé par FormuleRevisionKService). */
  indicesPourPeriode(periode: string): Map<string, number> {
    const map = new Map<string, number>();
    for (const row of this._indices()) {
      if (row.periode === periode) map.set(row.code, row.valeur);
    }
    return map;
  }

  /** Parse CSV ANP/HCP au format `code;periode;valeur;libelle?`. */
  parseCsv(csv: string, source: 'ANP' | 'HCP' | 'IMPORT_MANUEL' = 'IMPORT_MANUEL'): IndiceBtpRow[] {
    const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const out: IndiceBtpRow[] = [];
    for (const [i, line] of lines.entries()) {
      if (i === 0 && /code/i.test(line) && /periode|période/i.test(line)) continue;
      const cols = line.split(/[;,\t]/).map((c) => c.trim());
      if (cols.length < 3) continue;
      const [code, periode, valeurStr, libelle] = cols;
      const valeur = parseFloat(valeurStr.replace(',', '.'));
      if (!code || !/^\d{4}-\d{2}$/.test(periode) || !Number.isFinite(valeur)) continue;
      out.push({ code: code.toUpperCase(), periode, valeur, libelle, source });
    }
    return out;
  }

  /**
   * Importe un CSV ANP/HCP.
   * Merge sur (code, periode) : nouvelle valeur remplace ancienne.
   */
  importCsv(csv: string, source: 'ANP' | 'HCP' | 'IMPORT_MANUEL' = 'IMPORT_MANUEL'): {
    ajoutes: number;
    misAJour: number;
    ignores: number;
  } {
    const rows = this.parseCsv(csv, source);
    let ajoutes = 0;
    let misAJour = 0;
    let ignores = 0;
    this._indices.update((current) => {
      const next = [...current];
      for (const row of rows) {
        const existing = next.findIndex((r) => r.code === row.code && r.periode === row.periode);
        if (existing >= 0) {
          if (next[existing].valeur === row.valeur) {
            ignores++;
            continue;
          }
          next[existing] = row;
          misAJour++;
        } else {
          next.push(row);
          ajoutes++;
        }
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignorer (mode SSR ou quota dépassé).
      }
      return next;
    });
    this.audit.log(
      'CREATE',
      'INDICES_BTP',
      source,
      `Import indices BTP — ${source}`,
      `+${ajoutes} ajouté(s), ${misAJour} mis à jour, ${ignores} ignoré(s).`,
    );
    return { ajoutes, misAJour, ignores };
  }

  /** Réinitialise au seed démo (utile pour tests). */
  reset(): void {
    this._indices.set(buildSeedIndices());
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
