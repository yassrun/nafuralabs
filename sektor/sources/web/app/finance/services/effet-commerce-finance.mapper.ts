import type { EffetCommerce, EffetCommerceType } from '../models';

export interface ApiTradeEffect {
  id: string;
  numero: string;
  type: string;
  factureId: string;
  clientId: string;
  clientName?: string;
  banqueDomicile: string;
  banqueTireeId?: string;
  montant: number;
  dateEcheance: string;
  dateRemise?: string;
  dateEscompte?: string;
  status: string;
  fraisEscompte?: number;
}

export function effetToUi(row: ApiTradeEffect): EffetCommerce {
  return {
    id: row.id,
    numero: row.numero,
    type: row.type as EffetCommerceType,
    factureId: row.factureId,
    clientId: row.clientId,
    clientName: row.clientName,
    banqueDomicile: row.banqueDomicile,
    banqueTireeId: row.banqueTireeId,
    montant: Number(row.montant),
    dateEcheance: row.dateEcheance,
    dateRemise: row.dateRemise,
    dateEscompte: row.dateEscompte,
    status: row.status as EffetCommerce['status'],
    fraisEscompte: row.fraisEscompte != null ? Number(row.fraisEscompte) : undefined,
  };
}
