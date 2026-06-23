import type {
  IntegrationCallResult,
  IntegrationMode,
} from '../integration.types';

/**
 * Interface unique des banques marocaines (M-INT-04).
 *
 * Implémentations : AWB, BMCE, CIH, BP, BMCI, SGM, CAM, CFG.
 * Modes : MOCK (démo) + PROD (à brancher quand OAuth/SFTP disponibles).
 */

export interface VirementBancaire {
  id: string;
  beneficiaire: string;
  rib: string;
  montant: number;
  motif: string;
  /** Référence pièce d'origine (facture, échéance, paie). */
  referencePiece?: string;
  /** Date d'exécution souhaitée (YYYY-MM-DD). */
  dateExecution?: string;
}

export interface EcritureBancaire {
  date: string; // YYYY-MM-DD
  libelle: string;
  reference?: string;
  debit?: number;
  credit?: number;
  solde?: number;
  /** Identifiant unique fourni par la banque (pour rapprochement). */
  bankRef?: string;
}

export interface SoldeCompte {
  compte: string;
  solde: number;
  devise: 'MAD' | 'EUR' | 'USD';
  dateValeur: string;
}

export interface VirementBatchResult {
  /** Numéro accusé renvoyé par la banque. */
  accuse: string;
  /** XML/TXT généré pour traçabilité. */
  xml: string;
  /** Nombre de virements transmis. */
  nbVirements: number;
  /** Montant total transmis. */
  montantTotal: number;
}

/** Contrat normalisé que toutes les banques doivent implémenter. */
export interface BanqueAdapter {
  /** Code banque (AWB, BMCE, ...). */
  readonly code: string;
  /** Nom commercial. */
  readonly nom: string;
  /** Mode courant (mutable). */
  readonly mode: () => IntegrationMode;
  setMode(mode: IntegrationMode): void;

  /** Envoie un batch de virements. */
  envoyerVirementBatch(
    virements: VirementBancaire[],
    dateExecution: string,
  ): Promise<IntegrationCallResult<VirementBatchResult>>;

  /** Récupère un relevé bancaire (intervalle de dates). */
  recupererReleveBancaire(
    compte: string,
    dateDebut: string,
    dateFin: string,
  ): Promise<IntegrationCallResult<EcritureBancaire[]>>;

  /** Récupère les soldes d'un ou plusieurs comptes. */
  recupererSoldes(comptes: string[]): Promise<IntegrationCallResult<SoldeCompte[]>>;
}
