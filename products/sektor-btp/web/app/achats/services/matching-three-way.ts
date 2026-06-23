import type { BonCommande, BCLigne } from '../models';
import type {
  MatchingAggregateStatus,
  MatchingLigne,
  MatchingReception,
  MatchingTolerance,
} from '../models/matching.models';
import type { FactureFournisseur, FactureFournLigne } from '../../finance/models';
import type { InventoryTx } from '../../inventory/models';

export const DEFAULT_MATCHING_TOLERANCE: MatchingTolerance = {
  pricePct: 2,
  qtyPct: 5,
};

function sumQtyForBcLine(
  receptions: InventoryTx[],
  bcLigne: BCLigne,
): number {
  let sum = 0;
  for (const tx of receptions) {
    if (tx.txType !== 'RECEPTION' || tx.status === 'ANNULE') continue;
    for (const ln of tx.lines) {
      if (ln.bcLigneId && ln.bcLigneId === bcLigne.id) {
        sum += ln.quantity;
      } else if (!ln.bcLigneId && ln.articleId === bcLigne.articleId) {
        sum += ln.quantity;
      }
    }
  }
  return sum;
}

function aggregateFactureForBcLine(
  facture: FactureFournisseur | null | undefined,
  bcLigne: BCLigne,
): { qte: number; pxMoyen: number } {
  if (!facture?.lignes?.length) return { qte: 0, pxMoyen: 0 };
  const lignes = facture.lignes.filter((l) => l.bcLigneId === bcLigne.id);
  if (!lignes.length) return { qte: 0, pxMoyen: 0 };
  let qte = 0;
  let ht = 0;
  for (const l of lignes) {
    const q = l.quantite ?? (l.prixUnitaireHt ? l.totalHt / l.prixUnitaireHt : 0);
    qte += q;
    ht += l.totalHt;
  }
  const pxMoyen = qte > 0 ? ht / qte : 0;
  return { qte, pxMoyen };
}

function pctDiff(a: number, b: number): number {
  if (b === 0) return a === 0 ? 0 : 100;
  return (Math.abs(a - b) / b) * 100;
}

/**
 * Calcule le 3-way matching BC ↔ BL (réceptions) ↔ facture fournisseur.
 */
export function computeMatchingThreeWay(
  bc: BonCommande,
  receptions: InventoryTx[],
  facture: FactureFournisseur | null | undefined,
  tolerance: MatchingTolerance = DEFAULT_MATCHING_TOLERANCE,
): MatchingReception {
  const recs = receptions.filter((r) => r.bcId === bc.id || r.bcNumero === bc.numero);
  const primaryRec = recs[0];
  const receptionId = primaryRec?.id ?? '';
  const receptionNumero = recs.map((r) => r.txNumber).filter(Boolean).join(' · ') || '—';

  const lignes: MatchingLigne[] = [];
  let ecartsQ = 0;
  let ecartsP = 0;

  for (const bl of bc.lignes) {
    const qteCommandee = bl.quantite;
    const qteRecue = sumQtyForBcLine(recs, bl);
    const { qte: qteFacturee, pxMoyen: pxFacture } = aggregateFactureForBcLine(facture ?? null, bl);
    const pxUnitaireBC = bl.prixUnitaireHt;
    const ecartQte = pctDiff(qteFacturee || qteRecue, qteCommandee);
    const ecartPx =
      qteFacturee > 0 && pxFacture > 0 && pxUnitaireBC > 0 ? pctDiff(pxFacture, pxUnitaireBC) : 0;

    const qtyTol = qteCommandee > 0
      ? pctDiff(qteRecue, qteCommandee) > tolerance.qtyPct
      : qteRecue > 0;
    const qtyTolFf =
      qteFacturee > 0 && qteRecue > 0 ? pctDiff(qteFacturee, qteRecue) > tolerance.qtyPct : false;

    const pxBloquant =
      qteFacturee > 0 && pxFacture > 0 && pxUnitaireBC > 0 && ecartPx > tolerance.pricePct;

    const bloquant = pxBloquant || qtyTol || qtyTolFf;

    if (qtyTol || qtyTolFf) ecartsQ += 1;
    if (pxBloquant) ecartsP += 1;

    lignes.push({
      articleId: bl.articleId,
      qteCommandee,
      qteRecue,
      qteFacturee,
      pxUnitaireBC,
      pxUnitaireFacture: pxFacture,
      ecartQte,
      ecartPx,
      bloquant,
    });
  }

  const hasBloquant = lignes.some((l) => l.bloquant);
  const allRecu = lignes.every((l) => l.qteRecue >= l.qteCommandee * (1 - tolerance.qtyPct / 100));
  const someRecu = lignes.some((l) => l.qteRecue > 0);
  const hasFacture = !!facture && facture.lignes?.length > 0;

  let status: MatchingAggregateStatus = 'NON_RECU';
  if (hasBloquant) {
    status = 'ECART_BLOQUE';
  } else if (hasFacture) {
    const ffComplete = lignes.every(
      (l) => l.qteFacturee >= l.qteCommandee * (1 - tolerance.qtyPct / 100) - 1e-6,
    );
    status = ffComplete ? 'FACTURE_COMPLET' : 'FACTURE_PARTIEL';
  } else if (allRecu) {
    status = 'RECU_COMPLET';
  } else if (someRecu) {
    status = 'RECU_PARTIEL';
  }

  const matched3Way =
    !hasBloquant
    && hasFacture
    && status === 'FACTURE_COMPLET'
    && lignes.every((l) => l.qteRecue > 0 && l.qteFacturee > 0);

  return {
    id: `match-${bc.id}`,
    bcId: bc.id,
    bcNumero: bc.numero,
    receptionId,
    receptionNumero,
    factureFournisseurId: facture?.id,
    factureNumero: facture?.numeroInterne,
    lignes,
    ecartsQuantite: ecartsQ,
    ecartsPrix: ecartsP,
    status,
    matched3Way,
  };
}
