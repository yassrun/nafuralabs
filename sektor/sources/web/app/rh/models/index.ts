export type TypeContrat = 'CDI' | 'CDD' | 'ANAPEC' | 'Saisonnier' | 'Interim';
export type StatutEmploye = 'ACTIF' | 'SUSPENDU' | 'SOLDE';
export type CategorieEmploye = 'Ouvrier' | 'Agent_maitrise' | 'Cadre' | 'Direction';

export interface Employe {
  id: string; matricule: string; nom: string; prenom: string;
  cin: string; cnss?: string; dateNaissance?: string;
  adresse?: string; ville?: string; telephone?: string; email?: string;
  poste: string; departement?: string; categorie: CategorieEmploye;
  typeContrat: TypeContrat; statut: StatutEmploye;
  dateEmbauche: string; dateFinContrat?: string;
  salaireBase: number;
  indemniteRepresentation?: number; indemniteTransport?: number;
  rib?: string; banque?: string; notes?: string;
  /** Tiers / paie — identifiants légaux Maroc (démo) */
  ice?: string;
  /** Identifiant fiscal (IF) */
  ifFiscal?: string;
  rc?: string;
  patente?: string;
}
export interface EmployeListItem extends Employe { anciennete: number; }
export type EmployeCreate = Omit<Employe, 'id' | 'matricule'>;
export type EmployeUpdate = Partial<EmployeCreate>;

export type TypeConge = 'ANNUEL' | 'MALADIE' | 'MATERNITE' | 'SANS_SOLDE' | 'EXCEPTIONNEL';
export type StatutConge = 'DEMANDE' | 'APPROUVE' | 'REFUSE' | 'EN_COURS' | 'SOLDE';

export interface Conge {
  id: string; numero: string;
  employeId: string; employeNom?: string;
  type: TypeConge;
  dateDebut: string; dateFin: string; nombreJours: number;
  status: StatutConge;
  motif?: string; motifRefus?: string; notes?: string;
}
export interface CongeListItem extends Conge {}
export type CongeCreate = Omit<Conge, 'id' | 'numero'>;
export type CongeUpdate = Partial<CongeCreate>;

export type StatutPaie = 'BROUILLON' | 'VALIDEE' | 'PAYEE';

export interface FichePaie {
  id: string; numero: string;
  employeId: string; employeNom?: string;
  mois: string; // YYYY-MM
  salaireBase: number;
  indemniteRepresentation: number; indemniteTransport: number;
  montantHeuresSup: number;
  salaireBrut: number;
  cotisationCNSS: number;  // 4.48% on base (plafond 6000)
  cotisationAMO: number;   // 2.26%
  totalRetenues: number;
  salaireNetImposable: number;
  igr: number;
  salaireNetAPayer: number;
  status: StatutPaie;
  notes?: string;
}
export interface FichePaieListItem extends FichePaie {}
export type FichePaieCreate = Omit<FichePaie, 'id' | 'numero' | 'cotisationCNSS' | 'cotisationAMO' | 'totalRetenues' | 'salaireNetImposable' | 'igr' | 'salaireNetAPayer'>;
export type FichePaieUpdate = Partial<FichePaieCreate>;

export interface RhState {
  employes: Employe[];
  conges: Conge[];
  paie: FichePaie[];
}
