export type MatchingAggregateStatus =
  | 'NON_RECU'
  | 'RECU_PARTIEL'
  | 'RECU_COMPLET'
  | 'FACTURE_PARTIEL'
  | 'FACTURE_COMPLET'
  | 'ECART_BLOQUE';

export interface MatchingLigne {
  articleId: string;
  qteCommandee: number;
  qteRecue: number;
  qteFacturee: number;
  pxUnitaireBC: number;
  pxUnitaireFacture: number;
  ecartQte: number;
  ecartPx: number;
  bloquant: boolean;
}

export interface MatchingReception {
  id: string;
  bcId: string;
  bcNumero: string;
  receptionId: string;
  receptionNumero: string;
  factureFournisseurId?: string;
  factureNumero?: string;
  lignes: MatchingLigne[];
  ecartsQuantite: number;
  ecartsPrix: number;
  status: MatchingAggregateStatus;
  matched3Way: boolean;
}

export interface MatchingTolerance {
  /** Tolérance prix facture vs BC (ex. 2 = ±2 %). */
  pricePct: number;
  /** Tolérance quantités (ex. 5 = ±5 %). */
  qtyPct: number;
}
