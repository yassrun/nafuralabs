/** Fournisseur enrichi pour la comptabilité achats (auxiliaire 4411). */
export interface ComptaFournisseur {
  id: string;
  code: string;
  name: string;
  ice?: string;
  ville?: string;
  nonResidentMaroc?: boolean;
  desactiveAutoliquidation?: boolean;
  regimeAutoEntrepreneur?: boolean;
  retenueRasAutoEntrepreneurPercent?: number;
  conditionPaiementId: string;
  compteCgncCode: string;
  compteCharge: string;
  rubrique: string;
  isActive: boolean;
}
