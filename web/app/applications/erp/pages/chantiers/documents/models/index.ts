export type DocumentChantierType =
  | 'MARCHE'
  | 'AVENANT'
  | 'PV_RECEPTION'
  | 'PLAN'
  | 'PHOTO'
  | 'BC'
  | 'FACTURE'
  | 'ATTESTATION_ASSURANCE'
  | 'CAUTION_BANCAIRE'
  | 'PPSPS'
  | 'PLAN_PREVENTION'
  | 'NOTE_CALCUL'
  | 'AUTRE';

export interface DocumentChantier {
  id: string;
  chantierId: string;
  chantierCode: string;
  type: DocumentChantierType;
  titre: string;
  fichier: string;
  storageKey?: string;
  taille: number;
  uploadedAt: string;
  uploadedPar: string;
  tags?: string[];
}
