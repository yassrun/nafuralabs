import { Injectable } from '@angular/core';

import type { LettrageCandidateLigne, LettrageLigneKey } from '../models';

export interface LettrageTotals {
  totalDebit: number;
  totalCredit: number;
  difference: number;
}

@Injectable({ providedIn: 'root' })
export class LettrageService {
  computeTotals(
    lignes: Pick<LettrageCandidateLigne, 'debit' | 'credit'>[],
  ): LettrageTotals {
    const totalDebit = this.round2(
      lignes.reduce((s, l) => s + l.debit, 0),
    );
    const totalCredit = this.round2(
      lignes.reduce((s, l) => s + l.credit, 0),
    );
    return {
      totalDebit,
      totalCredit,
      difference: this.round2(totalDebit - totalCredit),
    };
  }

  canLettrer(
    difference: number,
    tolerance: number,
    allowPartiel: boolean,
  ): boolean {
    const ad = Math.abs(difference);
    if (ad <= tolerance) return true;
    return allowPartiel && ad > tolerance;
  }

  /**
   * Si une seule paire évidente : même montant TTC sur compte tiers,
   * une ligne au débit et une au crédit, même pièce (référence écriture).
   */
  suggestAutoPairKeys(
    rows: LettrageCandidateLigne[],
  ): LettrageLigneKey[] | null {
    if (rows.length < 2) return null;
    const byPiece = new Map<string, LettrageCandidateLigne[]>();
    for (const r of rows) {
      const k = r.piece || '';
      const arr = byPiece.get(k) ?? [];
      arr.push(r);
      byPiece.set(k, arr);
    }
    for (const [, group] of byPiece) {
      if (group.length < 2) continue;
      const debitLines = group.filter((g) => g.debit > 0 && g.credit === 0);
      const creditLines = group.filter((g) => g.credit > 0 && g.debit === 0);
      for (const d of debitLines) {
        const match = creditLines.find((c) => c.credit === d.debit);
        if (match) return [d.ligneKey, match.ligneKey];
      }
    }
    return null;
  }

  exportLettragesCsv(rows: { codeLettrage: string; comptePcg: string; status: string; totalDebit: number; totalCredit: number; difference: number; createdAt: string }[]): string {
    const header = 'codeLettrage;comptePcg;status;totalDebit;totalCredit;difference;createdAt\n';
    const body = rows
      .map(
        (r) =>
          `${r.codeLettrage};${r.comptePcg};${r.status};${r.totalDebit};${r.totalCredit};${r.difference};${r.createdAt}`,
      )
      .join('\n');
    return header + body;
  }

  private round2(n: number): number {
    return Math.round(n * 100) / 100;
  }
}
