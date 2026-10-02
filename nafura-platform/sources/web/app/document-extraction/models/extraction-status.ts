import type { ExtractionStatus } from './extraction.model';

/** Single source for extraction status labels and badge variants. */
export const EXTRACTION_STATUS: Record<ExtractionStatus, { label: string; variant: string }> = {
  draft: { label: 'Brouillon', variant: 'warning' },
  validated: { label: 'Validé', variant: 'success' },
  invalid: { label: 'Invalide', variant: 'error' },
  corrected: { label: 'Corrigé', variant: 'info' },
  exported: { label: 'Exporté', variant: 'success' },
  error: { label: 'Échec', variant: 'error' },
};

export const EXTRACTION_FAILED = { label: 'Échec de l’extraction', variant: 'error' };

export function extractionStatusInfo(status: ExtractionStatus): { label: string; variant: string } {
  return EXTRACTION_STATUS[status] ?? { label: status, variant: 'default' };
}

export const EXTRACTION_STATUS_OPTIONS: Array<{ value: ExtractionStatus | ''; label: string }> = [
  { value: '', label: 'Tous les statuts' },
  ...(Object.entries(EXTRACTION_STATUS) as Array<[ExtractionStatus, { label: string }]>).map(([value, info]) => ({
    value,
    label: info.label,
  })),
];

export const NO_DATE_FILTER = 'Aucun filtre de date';
