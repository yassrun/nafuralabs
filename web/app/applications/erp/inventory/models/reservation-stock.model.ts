export type ReservationStockStatus = 'ACTIVE' | 'CONSOMMEE' | 'EXPIREE' | 'ANNULEE';

export interface ReservationStock {
  id: string;
  articleId: string;
  qte: number;
  uom: string;
  chantierId: string;
  dateBesoin: string;
  dateExpiration: string;
  dateCreation: string;
  creePar: string;
  status: ReservationStockStatus;
  motif?: string;
}
