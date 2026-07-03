import { Injectable } from '@angular/core';

import type {
  ComposantDPU,
  ComposantOuvrage,
  ComposantType,
  PrixDPU,
  UniteMain,
} from '../models';

@Injectable({ providedIn: 'root' })
export class DpuService {
  /**
   * Prix vente HT = déboursé sec × (1 + FG%) × (1 + marge%), arrondi centimes.
   * Réf. spec Round 2 — cohérent avec les seeds `buildOuvrage`.
   */
  computePrixVenteHt(deboursSec: number, fraisGenerauxPercent: number, margePercent: number): number {
    const d = Math.max(0, deboursSec);
    const fg = Math.max(0, fraisGenerauxPercent);
    const mg = Math.max(0, margePercent);
    return Math.round(d * (1 + fg / 100) * (1 + mg / 100) * 100) / 100;
  }

  computeDeboursSec(composants: ComposantDPU[]): number {
    const raw = composants.reduce((s, c) => s + (c.total || 0), 0);
    return Math.round(raw * 100) / 100;
  }

  recomputeTotals(composants: ComposantDPU[]): ComposantDPU[] {
    return composants.map((c) => ({
      ...c,
      total: Math.round((c.quantite || 0) * (c.prixUnitaire || 0) * 100) / 100,
    }));
  }

  buildPrixDPU(input: {
    articleId: string;
    unite: string;
    composants: ComposantDPU[];
    fraisGenerauxPercent: number;
    margeBeneficiairePercent: number;
    tvaTaux?: number;
  }): PrixDPU {
    const comps = this.recomputeTotals(input.composants);
    const deboursSec = this.computeDeboursSec(comps);
    const tvaTaux = input.tvaTaux ?? 20;
    const prixVenteHT = this.computePrixVenteHt(
      deboursSec,
      input.fraisGenerauxPercent,
      input.margeBeneficiairePercent,
    );
    const prixVenteTTC = Math.round(prixVenteHT * (1 + tvaTaux / 100) * 100) / 100;
    return {
      articleId: input.articleId,
      unite: input.unite,
      composants: comps,
      deboursSec,
      fraisGenerauxPercent: input.fraisGenerauxPercent,
      margeBeneficiairePercent: input.margeBeneficiairePercent,
      prixVenteHT,
      prixVenteTTC,
      tvaTaux,
    };
  }

  mapComposantOuvrageTypeToDpu(type: ComposantType): ComposantDPU['type'] {
    switch (type) {
      case 'MATERIAU':
        return 'MATIERE';
      case 'MO':
        return 'MAIN_DOEUVRE';
      case 'LOCATION':
      case 'OUTILLAGE':
        return 'MATERIEL';
      case 'SOUS_TRAITANCE':
        return 'SOUS_TRAITANCE';
      default:
        return 'MATIERE';
    }
  }

  importFromOuvrageDetail(
    ouvrageId: string,
    composants: ComposantOuvrage[],
    uniteMain: UniteMain,
  ): ComposantDPU[] {
    const fromComposants: ComposantDPU[] = composants.map((c) => ({
      id: crypto.randomUUID(),
      type: this.mapComposantOuvrageTypeToDpu(c.type),
      articleOuPosteId: c.articleId ?? c.id,
      quantite: c.rendement ?? 0,
      unite: c.unite,
      prixUnitaire: c.prixUnitaire ?? 0,
      total: c.total ?? 0,
    }));
    const mo: ComposantDPU = {
      id: crypto.randomUUID(),
      type: 'MAIN_DOEUVRE',
      articleOuPosteId: `${ouvrageId}-mo`,
      quantite: uniteMain.heures ?? 0,
      unite: 'h',
      prixUnitaire: uniteMain.tauxHoraire ?? 0,
      total: uniteMain.total ?? 0,
    };
    return this.recomputeTotals([...fromComposants, mo]);
  }
}
