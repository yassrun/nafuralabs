import { Injectable, inject } from '@angular/core';

import type { FournisseurCreate } from '@app/features/achats/models';
import { FournisseurApiService } from '@app/features/achats/pages/fournisseurs/services/fournisseur-api.service';
import type { ExtractionDefinition } from '@platform/features/documents/smart-import';
import { normalizeText } from '../../utils/extraction-json.utils';

import { FOURNISSEUR_EXTRACTION_SCHEMA } from '../../extraction-schemas';
import {
  extractionRows,
  persistUniqueRows,
  type ApplicationImportResult,
} from '../services/application-import.util';

const schema = FOURNISSEUR_EXTRACTION_SCHEMA;
const dedupeKey = (row: Record<string, unknown>): string | null => {
  const ice = row['ice'];
  if (ice && String(ice).trim()) return String(ice).trim();
  const name = row['raisonSociale'];
  return name ? String(name).trim() : null;
};

export const FOURNISSEUR_IMPORT_DEFINITION: ExtractionDefinition = {
  key: 'fournisseur',
  name: schema.name,
  description: schema.description,
  dataSchema: schema.dataSchema,
  presentationSchema: schema.presentationSchema,
  instructions: schema.instructions,
  arrayPath: schema.arrayPath!,
  dedupeKey,
  validateRow: (row, rowIndex) => {
    const raisonSociale = String(row['raisonSociale'] ?? '').trim();
    return raisonSociale
      ? []
      : [{
          path: `${schema.arrayPath}[${rowIndex}].raisonSociale`,
          rowIndex,
          kind: 'MISSING_REQUIRED',
          message: 'Raison sociale requise',
        }];
  },
};

@Injectable({ providedIn: 'root' })
export class FournisseurImportService {
  private readonly api = inject(FournisseurApiService);

  async import(data: Record<string, unknown>): Promise<ApplicationImportResult> {
    const existing = await this.api.getAll();
    const keys = new Set<string>();
    for (const fournisseur of existing.items) {
      if (fournisseur.ice?.trim()) keys.add(normalizeText(fournisseur.ice));
      keys.add(normalizeText(fournisseur.raisonSociale));
    }
    return persistUniqueRows(
      extractionRows(data, schema.arrayPath!),
      keys,
      dedupeKey,
      (row): FournisseurCreate => ({
        raisonSociale: String(row['raisonSociale'] ?? '').trim(),
        ice: row['ice'] ? String(row['ice']).trim() : undefined,
        ville: row['ville'] ? String(row['ville']).trim() : undefined,
        contactPrincipalEmail: row['email'] ? String(row['email']).trim() : undefined,
        contactPrincipalTel: row['telephone'] ? String(row['telephone']).trim() : undefined,
        pays: 'MA',
        conditionsPaiementParDefaut: '30 jours',
        categories: [],
        isActive: true,
      }),
      (payload) => this.api.create(payload),
    );
  }
}
