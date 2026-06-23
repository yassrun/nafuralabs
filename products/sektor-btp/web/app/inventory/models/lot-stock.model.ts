export interface LotStock {
  id: string;
  articleId: string;
  locationId: string;
  numeroLot: string;
  qteInitiale: number;
  qteRestante: number;
  dateReception: string;
  dateFabrication?: string;
  datePeremption?: string;
  fournisseurId?: string;
}
