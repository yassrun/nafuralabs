export type DocumentChantierType =
  | 'OS'
  | 'PLAN'
  | 'PV'
  | 'BL'
  | 'AUTRE'
  | 'MARCHE'
  | 'AVENANT'
  | 'PV_RECEPTION'
  | 'PHOTO'
  | 'BC'
  | 'FACTURE'
  | 'ATTESTATION_ASSURANCE'
  | 'CAUTION_BANCAIRE'
  | 'PPSPS'
  | 'PLAN_PREVENTION'
  | 'NOTE_CALCUL';

/** Types utiles palier 1 (AC-10). Les autres restent listables. */
export const DOCUMENT_CHANTIER_PALIER_TYPES: DocumentChantierType[] = [
  'OS',
  'PLAN',
  'PV',
  'BL',
  'AUTRE',
];

export interface DocumentChantier {
  id: string;
  chantierId: string;
  chantierCode: string;
  noeudId?: string;
  type: DocumentChantierType;
  titre: string;
  fichier: string;
  storageKey?: string;
  taille: number;
  uploadedAt: string;
  uploadedPar: string;
  tags?: string[];
}
