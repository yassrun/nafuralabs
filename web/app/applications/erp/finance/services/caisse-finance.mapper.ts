import type {
  CaisseChantier,
  CompteFinancier,
  MouvementCaisseChantier,
} from '../models';

export interface ApiCaisse {
  id: string;
  caisseType: string;
  code?: string;
  name: string;
  chantierId?: string;
  chantierLabel?: string;
  chefChantierId?: string;
  chefChantierName?: string;
  currencyCode: string;
  glAccountCode?: string;
  soldeInitial: number;
  soldeActuel: number;
  status: string;
  dateOuverture?: string;
  dateCloture?: string;
  notes?: string;
}

export interface ApiCaisseMouvement {
  id: string;
  caisseId: string;
  date: string;
  type: string;
  montant: number;
  categorie?: string;
  description: string;
  photoTicketUrl?: string;
  geoloc?: { lat: number; lng: number };
  validePar?: string;
  status: string;
}

export function caisseChantierToUi(row: ApiCaisse): CaisseChantier {
  return {
    id: row.id,
    chantierId: row.chantierId ?? '',
    chantierLabel: row.chantierLabel,
    chefChantierId: row.chefChantierId ?? '',
    chefChantierName: row.chefChantierName,
    soldeInitial: Number(row.soldeInitial),
    soldeActuel: Number(row.soldeActuel),
    status: row.status as CaisseChantier['status'],
    dateOuverture: row.dateOuverture ?? '',
    dateCloture: row.dateCloture,
  };
}

export function caisseCentraleToCompte(row: ApiCaisse): CompteFinancier {
  return {
    id: row.id,
    code: row.code ?? row.id.slice(0, 8),
    libelle: row.name,
    type: 'CAISSE',
    devise: row.currencyCode,
    compteCgncCode: row.glAccountCode ?? '5161',
    soldeInitial: Number(row.soldeInitial),
    soldeActuel: Number(row.soldeActuel),
    isActive: row.status === 'OUVERTE',
    notes: row.notes,
  };
}

export function mouvementCaisseToUi(row: ApiCaisseMouvement): MouvementCaisseChantier {
  return {
    id: row.id,
    caisseId: row.caisseId,
    date: row.date,
    type: row.type as MouvementCaisseChantier['type'],
    montant: Number(row.montant),
    categorie: row.categorie,
    description: row.description,
    photoTicketUrl: row.photoTicketUrl,
    geoloc: row.geoloc,
    validePar: row.validePar,
    status: row.status as MouvementCaisseChantier['status'],
  };
}
