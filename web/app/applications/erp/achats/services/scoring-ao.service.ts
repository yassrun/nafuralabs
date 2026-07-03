import { Injectable } from '@angular/core';

import type { AOReponse, AppelOffre, Fournisseur, ScoringAO } from '../models';

const DELAI_REF_JOURS = 21;

@Injectable({ providedIn: 'root' })
export class ScoringAOService {
  /**
   * Matrice scores / recommandations pour chaque réponse fournisseur.
   * Pondération : prix /50, délai /15, qualité /15, historique /10, art187 /10.
   */
  computeScores(ao: AppelOffre, fournisseurs: Fournisseur[]): ScoringAO[] {
    if (!ao.reponses?.length) return [];
    const totals = ao.reponses.map((r) => r.totalHt);
    const minTotal = Math.min(...totals);
    const maxTotal = Math.max(...totals);
    const delais = ao.reponses.map((r) => r.delaiLivraisonJours);
    const minDelai = Math.min(...delais);
    const scores: ScoringAO[] = ao.reponses.map((rep) => {
      const four = fournisseurs.find((f) => f.id === rep.fournisseurId);
      const prix =
        maxTotal === minTotal
          ? 50
          : round2(50 * (1 - (rep.totalHt - minTotal) / (maxTotal - minTotal || 1)));

      const maxD = Math.max(...delais);
      const delai =
        maxD === minDelai
          ? 15
          : round2(15 * (1 - (rep.delaiLivraisonJours - minDelai) / (maxD - minDelai || 1)));

      const notation = four?.notation ?? 3;
      const qualite = round2((notation / 5) * 15);

      const historique = Math.min(10, round2(3 + (rep.totalHt / 500_000) * 7));

      const art187 = ao.chantierId && rep.retenue ? 10 : ao.chantierId ? 4 : 8;

      const scoreFinal = round2(
        Math.min(50, prix)
        + Math.min(15, delai)
        + Math.min(15, qualite)
        + Math.min(10, historique)
        + Math.min(10, art187),
      );

      const { recommandation, raison } = this.recommend(scoreFinal, rep, ao);

      return {
        aoId: ao.id,
        fournisseurId: rep.fournisseurId,
        fournisseurName: rep.fournisseurName ?? four?.raisonSociale,
        reponseId: rep.id,
        offre: rep.lignes,
        scoreFinal,
        scoreDetail: {
          prix: Math.min(50, prix),
          delai: Math.min(15, delai),
          qualite: Math.min(15, qualite),
          historique: Math.min(10, historique),
          art187: Math.min(10, art187),
        },
        recommandation,
        raisonRecommandation: raison,
      };
    });

    const eligible = scores.filter((s) => s.recommandation !== 'A_EXCLURE');
    const bestScore = eligible.length ? Math.max(...eligible.map((s) => s.scoreFinal)) : 0;
    for (const s of scores) {
      if (s.recommandation !== 'A_EXCLURE' && s.scoreFinal === bestScore && bestScore > 0) {
        s.recommandation = 'TOP';
        s.raisonRecommandation = 'Meilleur score global sur critères prix / délai / qualité.';
      }
    }

    return scores.sort((a, b) => b.scoreFinal - a.scoreFinal);
  }

  private recommend(
    scoreFinal: number,
    rep: AOReponse,
    ao: AppelOffre,
  ): { recommandation: ScoringAO['recommandation']; raison: string } {
    if (rep.delaiLivraisonJours > DELAI_REF_JOURS * 2) {
      return {
        recommandation: 'A_EXCLURE',
        raison: 'Délai de livraison jugé excessif vs besoin chantier.',
      };
    }
    if (scoreFinal >= 82) return { recommandation: 'OK', raison: 'Offre compétitive sur l’ensemble des critères.' };
    if (scoreFinal >= 65) return { recommandation: 'OK', raison: 'Offre acceptable — vérifier conditions particulières.' };
    if (rep.delaiLivraisonJours > DELAI_REF_JOURS) {
      return { recommandation: 'A_VERIFIER', raison: 'Délai au-delà de la référence — arbitrage direction achats.' };
    }
    return { recommandation: 'A_VERIFIER', raison: 'Score modéré — comparer avec alternatives.' };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
