// ─── ENUMS ────────────────────────────────────────────────────────────────────

export type FactureStatus =
  | 'BROUILLON'
  | 'EMISE'
  | 'PARTIELLEMENT_PAYEE'
  | 'PAYEE'
  | 'EN_LITIGE'
  | 'AVOIRISEE'
  | 'ANNULEE';

export type FactureType =
  | 'SITUATION'
  | 'AVANCE'
  | 'ACOMPTE'
  | 'DECOMPTE_DEFINITIF'
  | 'DIVERSE';

export type ModePaiement = 'VIREMENT' | 'CHEQUE' | 'EFFET' | 'ESPECES';
export type ModeEncaissement = ModePaiement | 'COMPENSATION';

export type AvoirStatus = 'BROUILLON' | 'EMIS' | 'IMPUTE' | 'REMBOURSE' | 'ANNULE';

export type RetenueGarantieStatus =
  | 'EN_COURS'
  | 'LIBERATION_DEMANDEE'
  | 'LIBEREE'
  | 'CONTESTEE';

// ─── FACTURE ──────────────────────────────────────────────────────────────────

export interface FactureLigne {
  id: string;
  factureId: string;
  ordre: number;
  designation: string;
  unite?: string;
  quantite?: number;
  prixUnitaireHt?: number;
  totalHt: number;
}

export interface Encaissement {
  id: string;
  factureId: string;
  dateEncaissement: string;
  modePaiement: ModeEncaissement;
  reference?: string;
  banque?: string;
  montantTtc: number;
  notes?: string;
}

export interface FactureDocument {
  name: string;
  url: string;
}

export interface FactureClient {
  id: string;
  numero: string;
  type: FactureType;
  clientId: string;
  clientName?: string;
  bcClientId?: string;
  chantierId?: string;
  chantierCode?: string;
  situationId?: string;
  dateEmission: string;
  dateEcheance: string;
  modePaiement?: ModePaiement;

  // Montants
  totalHt: number;
  retenueGarantieTaux?: number;
  retenueGarantieMontant: number;
  resorptionAvanceMontant?: number;
  netAPayerHt: number;
  tvaTaux: number;
  totalTva: number;
  netAPayerTtc: number;

  // Encaissements
  cumulEncaisseTtc: number;
  resteTtc: number;

  status: FactureStatus;
  motifLitige?: string;
  documents?: FactureDocument[];
  notes?: string;
  lignes: FactureLigne[];
  encaissements: Encaissement[];
  /** e-facture DGI (démo Task 08). */
  hashEfacture?: string;
  qrCodeData?: string;
  signatureCertId?: string;
  signatureDate?: string;
  archiveElectroniqueUrl?: string;
  efactureTransmiseDgi?: boolean;
  efactureNumeroDgi?: string;
  /** Marché public — retenue à la source 5 % sur HT (démo). */
  marchePublic?: boolean;
  retenueSourceTaux?: number;
  retenueSourceMontantMad?: number;
}

export interface FactureClientListItem
  extends Omit<FactureClient, 'lignes' | 'encaissements' | 'documents'> {
  delaiRetard: number;
  nbLignes: number;
  nbEncaissements: number;
}

export type FactureCreate = Omit<
  FactureClient,
  | 'id'
  | 'numero'
  | 'retenueGarantieMontant'
  | 'totalTva'
  | 'netAPayerTtc'
  | 'netAPayerHt'
  | 'cumulEncaisseTtc'
  | 'resteTtc'
  | 'encaissements'
  | 'retenueSourceMontantMad'
>;
export type FactureUpdate = Partial<FactureCreate>;

// ─── AVOIR ────────────────────────────────────────────────────────────────────

export interface AvoirLigne {
  id: string;
  avoirId: string;
  designation: string;
  totalHt: number;
}

export interface Avoir {
  id: string;
  numero: string;
  factureOriginaleId: string;
  factureOriginaleNumero?: string;
  clientId: string;
  clientName?: string;
  dateEmission: string;
  motif: string;
  totalHt: number;
  tvaTaux: number;
  totalTva: number;
  totalTtc: number;
  status: AvoirStatus;
  notes?: string;
  lignes: AvoirLigne[];
}

export interface AvoirListItem extends Omit<Avoir, 'lignes'> {
  nbLignes: number;
}

export type AvoirCreate = Omit<
  Avoir,
  'id' | 'numero' | 'totalHt' | 'totalTva' | 'totalTtc'
>;
export type AvoirUpdate = Partial<AvoirCreate>;

// ─── RETENUE GARANTIE ─────────────────────────────────────────────────────────

export interface RetenueGarantie {
  id: string;
  chantierId: string;
  chantierCode?: string;
  clientId?: string;
  clientName?: string;
  bcClientId: string;
  cumulRetenueHt: number;
  cumulLibereHt: number;
  resteARelibererHt: number;
  cautionBanqueId?: string;
  cautionBanque?: string;
  cautionMontant?: number;
  cautionNumero?: string;
  dateReceptionProvisoire?: string;
  dateReceptionDefinitive?: string;
  dateLiberationPrevue?: string;
  dateLiberation?: string;
  status: RetenueGarantieStatus;
  notes?: string;
}

export interface RetenueGarantieListItem extends RetenueGarantie {
  delaiRestant: number | null;
}

export type RetenueGarantieUpdate = Partial<
  Omit<RetenueGarantie, 'id' | 'chantierId'>
>;

// ─── CLIENT VENTE ─────────────────────────────────────────────────────────────

export type ClientVenteType = 'SA' | 'SARL' | 'SAS' | 'Particulier' | 'Administration' | 'Cooperative';

export interface ClientVente {
  id: string;
  code: string;
  nom: string;
  type: ClientVenteType;
  ice?: string;
  /** Identifiant fiscal (IF) */
  ifFiscal?: string;
  rc?: string;
  patente?: string;
  adresse?: string;
  ville: string;
  codePostal?: string;
  telephone?: string;
  email?: string;
  contactNom?: string;
  contactPoste?: string;
  conditionPaiementLabel?: string;
  plafondCredit?: number;
  actif: boolean;
  notes?: string;
}

export interface ClientVenteListItem extends ClientVente {
  nbFactures?: number;
  caHt?: number;
}

export type ClientVenteCreate = Omit<ClientVente, 'id' | 'code'>;
export type ClientVenteUpdate = Partial<ClientVenteCreate>;

// ─── OFFRE COMMERCIALE ────────────────────────────────────────────────────────

export type OffreStatus =
  | 'BROUILLON'
  | 'ENVOYEE'
  | 'ACCEPTEE'
  | 'REFUSEE'
  | 'EXPIREE'
  | 'ANNULEE'
  | 'CONVERTIE';

export interface OffreLigne {
  id: string;
  offreId: string;
  ordre: number;
  designation: string;
  unite?: string;
  quantite?: number;
  prixUnitaireHt?: number;
  totalHt: number;
}

export interface OffreCommerciale {
  id: string;
  numero: string;
  clientId: string;
  clientName?: string;
  chantierId?: string;
  chantierCode?: string;
  dateEmission: string;
  dateValidite: string;
  objet: string;
  totalHt: number;
  tvaTaux: number;
  totalTva: number;
  totalTtc: number;
  status: OffreStatus;
  motifRefus?: string;
  notes?: string;
  bccId?: string;
  bccNumero?: string;
  lignes: OffreLigne[];
}

export interface OffreCommercialeListItem extends Omit<OffreCommerciale, 'lignes'> {
  nbLignes: number;
  joursValidite: number;
}

export type OffreCreate = Omit<OffreCommerciale, 'id' | 'numero' | 'totalTva' | 'totalTtc'>;
export type OffreUpdate = Partial<OffreCreate>;

// ─── BON DE COMMANDE CLIENT ───────────────────────────────────────────────────

export type BCClientStatus = 'RECU' | 'EN_COURS' | 'PARTIELLEMENT_FACTURE' | 'FACTURE' | 'CLOTURE' | 'ANNULE';

export interface BCClientLigne {
  id: string;
  bccId: string;
  ordre: number;
  designation: string;
  unite?: string;
  quantite?: number;
  prixUnitaireHt?: number;
  totalHt: number;
}

export interface BonCommandeClient {
  id: string;
  numero: string;
  numeroClient: string;
  clientId: string;
  clientName?: string;
  chantierId?: string;
  chantierCode?: string;
  dateReception: string;
  dateFinPrevue?: string;
  montantHt: number;
  tvaTaux: number;
  montantTtc: number;
  montantFactureHt: number;
  status: BCClientStatus;
  notes?: string;
  lignes: BCClientLigne[];
}

export interface BonCommandeClientListItem extends Omit<BonCommandeClient, 'lignes'> {
  nbLignes: number;
  tauxFacturation: number;
  resteAFacturerHt: number;
}

export type BCClientCreate = Omit<BonCommandeClient, 'id' | 'numero' | 'montantTtc' | 'montantFactureHt'>;
export type BCClientUpdate = Partial<BCClientCreate>;
