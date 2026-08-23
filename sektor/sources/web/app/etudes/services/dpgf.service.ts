import { Injectable } from '@angular/core';

import type { DevisLigne, DPGF, NoeudDPGF } from '../models';

@Injectable({ providedIn: 'root' })
export class DpgfService {
  sumTotalHT(hierarchie: NoeudDPGF[]): number {
    return this.sumArticles(hierarchie);
  }

  /** Un chapitre racine + lignes OUVRAGE rattachées (éditeur DPGF devis). */
  toDevisLignes(dpgf: DPGF, devisId: string): DevisLigne[] {
    const lines: DevisLigne[] = [];
    let ordre = 0;
    const rootId = crypto.randomUUID();
    ordre += 1;
    lines.push({
      id: rootId,
      devisId,
      ordre,
      type: 'CHAPITRE',
      code: dpgf.numero,
      designation: `DPGF ${dpgf.numero}${dpgf.projetNom ? ` — ${dpgf.projetNom}` : ''}`,
    });

    const walk = (nodes: NoeudDPGF[], path: string[]) => {
      for (const n of nodes) {
        if (n.type === 'ARTICLE') {
          ordre += 1;
          const qty = n.quantite ?? 0;
          const pu = n.prixUnitaire ?? 0;
          const totalHt = Math.round(qty * pu * 100) / 100;
          const designation = [...path, n.libelle].filter(Boolean).join(' — ');
          lines.push({
            id: crypto.randomUUID(),
            devisId,
            parentLigneId: rootId,
            ordre,
            type: 'OUVRAGE',
            code: n.code,
            designation,
            ouvrageId: n.articleId,
            unite: n.unite,
            quantite: qty,
            prixUnitaireHt: pu,
            totalHt,
          });
        } else if (n.enfants?.length) {
          walk(n.enfants, [...path, n.libelle]);
        }
      }
    };

    walk(dpgf.hierarchie, []);
    return lines;
  }

  private sumArticles(nodes: NoeudDPGF[]): number {
    let s = 0;
    for (const n of nodes) {
      if (n.type === 'ARTICLE' && n.total != null) s += n.total;
      if (n.enfants?.length) s += this.sumArticles(n.enfants);
    }
    return Math.round(s * 100) / 100;
  }
}
