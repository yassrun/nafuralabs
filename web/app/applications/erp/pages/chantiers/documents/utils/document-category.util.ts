import type { DocumentChantier, DocumentChantierType } from '../models';

export type DocumentCategory =
  | 'CONTRACTS'
  | 'PLANS_STUDIES'
  | 'EXECUTION'
  | 'PURCHASES_FINANCE'
  | 'HSE_ADMIN'
  | 'OTHER';

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'CONTRACTS',
  'PLANS_STUDIES',
  'EXECUTION',
  'PURCHASES_FINANCE',
  'HSE_ADMIN',
  'OTHER',
];

const CATEGORY_TYPES: Record<DocumentCategory, DocumentChantierType[]> = {
  CONTRACTS: ['MARCHE', 'AVENANT', 'CAUTION_BANCAIRE'],
  PLANS_STUDIES: ['PLAN', 'NOTE_CALCUL'],
  EXECUTION: ['PV_RECEPTION', 'PHOTO'],
  PURCHASES_FINANCE: ['BC', 'FACTURE'],
  HSE_ADMIN: ['PPSPS', 'PLAN_PREVENTION', 'ATTESTATION_ASSURANCE'],
  OTHER: ['AUTRE'],
};

export function categoryForType(type: DocumentChantierType): DocumentCategory {
  return DOCUMENT_CATEGORIES.find((category) => CATEGORY_TYPES[category].includes(type)) ?? 'OTHER';
}

export function typesForCategory(category: DocumentCategory | ''): DocumentChantierType[] {
  return category ? CATEGORY_TYPES[category] : [];
}

export function countByCategory(documents: DocumentChantier[]): Record<DocumentCategory, number> {
  const counts = Object.fromEntries(DOCUMENT_CATEGORIES.map((category) => [category, 0])) as Record<
    DocumentCategory,
    number
  >;
  for (const document of documents) {
    counts[categoryForType(document.type)] += 1;
  }
  return counts;
}
