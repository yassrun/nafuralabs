import { Injectable } from '@angular/core';

import type { DevisLigne, DPGF, Metre, MetreLigne, NoeudDPGF, Ouvrage } from '../models';

@Injectable({ providedIn: 'root' })
export class DpgfService {
  generateFromMetre(
    metre: Metre,
    ouvragesById: ReadonlyMap<string, Ouvrage>,
    tvaTaux = 20,
  ): Omit<DPGF, 'numero'> {
    const groups = new Map<string, Map<string, MetreLigne[]>>();
    for (const ligne of metre.lignes ?? []) {
      const lot = ligne.lotCode ?? '01';
      const sous = ligne.sousLotCode ?? '01.01';
      if (!groups.has(lot)) groups.set(lot, new Map());
      const gm = groups.get(lot)!;
      if (!gm.has(sous)) gm.set(sous, []);
      gm.get(sous)!.push(ligne);
    }

    const lotKeys = [...groups.keys()].sort();
    const enfantsLots: NoeudDPGF[] = [];
    let lotOrdinal = 0;
    for (const lotKey of lotKeys) {
      lotOrdinal++;
      const sousMap = groups.get(lotKey)!;
      const sousKeys = [...sousMap.keys()].sort();
      const childrenSous: NoeudDPGF[] = [];
      let sousOrdinal = 0;
      for (const sousKey of sousKeys) {
        sousOrdinal++;
        const lignes = sousMap.get(sousKey)!;
        const articles: NoeudDPGF[] = [];
        let artOrdinal = 0;
        for (const ligne of lignes) {
          artOrdinal++;
          const ouv = ligne.ouvrageId ? ouvragesById.get(ligne.ouvrageId) : undefined;
          const pu = ouv?.prixUnitaireHt ?? 0;
          const qte = ligne.quantiteCalculee ?? 0;
          const total = Math.round(qte * pu * 100) / 100;
          const code = `${String(lotOrdinal).padStart(2, '0')}.${String(sousOrdinal).padStart(2, '0')}.${String(artOrdinal).padStart(3, '0')}`;
          articles.push({
            id: crypto.randomUUID(),
            type: 'ARTICLE',
            code,
            libelle: ligne.designationLibre ?? ouv?.designation ?? '—',
            articleId: ligne.ouvrageId,
            metreLigneId: ligne.id,
            quantite: qte,
            unite: ligne.unite ?? ouv?.unite ?? 'U',
            prixUnitaire: pu,
            total,
          });
        }
        const first = lignes[0];
        childrenSous.push({
          id: crypto.randomUUID(),
          type: 'SOUS_LOT',
          code: sousKey,
          libelle: first?.sousLotLibelle ?? `Sous-lot ${sousKey}`,
          enfants: articles,
        });
      }
      const firstLigne = sousMap.get(sousKeys[0])?.[0];
      enfantsLots.push({
        id: crypto.randomUUID(),
        type: 'LOT',
        code: lotKey,
        libelle: firstLigne?.lotLibelle ?? `Lot ${lotKey}`,
        enfants: childrenSous,
      });
    }

    const totalHT = this.sumArticles(enfantsLots);
    const totalTva = Math.round(((totalHT * tvaTaux) / 100) * 100) / 100;
    const totalTTC = Math.round((totalHT + totalTva) * 100) / 100;

    return {
      id: crypto.randomUUID(),
      metreId: metre.id,
      projetNom: metre.projetNom,
      hierarchie: enfantsLots,
      totalHT,
      tvaTaux,
      totalTva,
      totalTTC,
    };
  }

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
