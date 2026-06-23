import { Injectable } from '@angular/core';

import type { RapprochementLigneReleve } from '../models';

/**
 * Parse OFX 1.x (SGML) — extrait les STMTTRN (transactions).
 */
@Injectable({ providedIn: 'root' })
export class RapprochementOfxService {
  parseOfx(text: string): Omit<RapprochementLigneReleve, 'id' | 'rapprochementId'>[] {
    const blocks = text.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) ?? [];
    const rows: Omit<RapprochementLigneReleve, 'id' | 'rapprochementId'>[] = [];
    for (const b of blocks) {
      const dt = this.pickTag(b, 'DTPOSTED') ?? this.pickTag(b, 'DTUSER');
      const name = this.pickTag(b, 'NAME') ?? '';
      const memo = this.pickTag(b, 'MEMO') ?? '';
      const trnType = (this.pickTag(b, 'TRNTYPE') ?? 'OTHER').toUpperCase();
      const amtStr = this.pickTag(b, 'TRNAMT') ?? '0';
      const amt = Number(amtStr);
      if (!dt || !Number.isFinite(amt)) continue;
      const date = this.ofxDateToIso(dt);
      const libelle = [name, memo].filter(Boolean).join(' — ') || 'Opération';
      let recette = 0;
      let depense = 0;
      if (amt >= 0) {
        if (trnType === 'DEBIT' || trnType === 'WITHDRAWAL' || trnType === 'POS') {
          depense = amt;
        } else {
          recette = amt;
        }
      } else {
        depense = -amt;
      }
      if (recette === 0 && depense === 0) continue;
      rows.push({
        date,
        libelle,
        reference: this.pickTag(b, 'FITID') ?? undefined,
        recette,
        depense,
      });
    }
    return rows;
  }

  private pickTag(block: string, tag: string): string | undefined {
    const re = new RegExp(`<${tag}>([^<\\n]+)<\\/${tag}>`, 'i');
    const m = re.exec(block);
    return m?.[1]?.trim();
  }

  /** OFX date YYYYMMDD ou YYYYMMDDHHMMSS */
  private ofxDateToIso(ofxDt: string): string {
    const d = ofxDt.replace(/\[.*$/, '').trim();
    if (d.length >= 8) {
      const y = d.slice(0, 4);
      const mo = d.slice(4, 6);
      const day = d.slice(6, 8);
      return `${y}-${mo}-${day}`;
    }
    return new Date().toISOString().slice(0, 10);
  }
}
