export type ContratSousTraitanceStatus = 'BROUILLON' | 'SIGNE' | 'EN_COURS' | 'TERMINE' | 'RESILIE';

export interface ContratSousTraitance {
  id: string;
  numero: string;
  sousTraitantId: string;
  sousTraitantNom: string;
  ice?: string;
  chantierId: string;
  chantierCode: string;
  chantierNom: string;
  objet: string;
  montantHt: number;
  retenueGarantieTaux: number;
  dateSignature?: string;
  dateDebut: string;
  dateFin: string;
  avancementPercent: number;
  status: ContratSousTraitanceStatus;
  declarationArt187: boolean;
}
