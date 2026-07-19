import { Injectable, inject } from '@angular/core';

import type { CategoryOuvrage, OuvrageCreate } from '@app/etudes/models';
import { OuvrageApiService } from '@app/pages/etudes/bibliotheque-prix/services/ouvrage-api.service';
import type { ExtractionDefinition } from '@platform/features/documents/smart-import';
import { normalizeText } from '../../utils/extraction-json.utils';

import { OUVRAGE_EXTRACTION_SCHEMA } from '../../extraction-schemas';
import {
  extractionRows,
  persistUniqueRows,
  type ApplicationImportResult,
} from '../services/application-import.util';

const CATEGORIES: CategoryOuvrage[] = [
  'TERRASSEMENT', 'GO', 'CHARPENTE', 'ETANCHEITE', 'CLOISON', 'REVETEMENT',
  'MENUISERIE', 'ELECTRICITE', 'PLOMBERIE', 'CLIM', 'PEINTURE', 'VRD', 'AUTRE',
];

const schema = OUVRAGE_EXTRACTION_SCHEMA;
const dedupeKey = (row: Record<string, unknown>): string | null => {
  const code = row['code'];
  return code && String(code).trim() ? String(code).trim() : null;
};

export const OUVRAGE_IMPORT_DEFINITION: ExtractionDefinition = {
  key: 'ouvrage',
  name: schema.name,
  description: schema.description,
  dataSchema: schema.dataSchema,
  presentationSchema: schema.presentationSchema,
  instructions: schema.instructions,
  arrayPath: schema.arrayPath!,
  dedupeKey,
};

@Injectable({ providedIn: 'root' })
export class OuvrageImportService {
  private readonly api = inject(OuvrageApiService);

  async import(data: Record<string, unknown>): Promise<ApplicationImportResult> {
    const existing = await this.api.getAll({ page: 0, pageSize: 500 });
    const keys = new Set(
      existing.items
        .map((ouvrage) => ouvrage.code?.trim())
        .filter((code): code is string => !!code)
        .map(normalizeText),
    );
    return persistUniqueRows(
      extractionRows(data, schema.arrayPath!),
      keys,
      dedupeKey,
      (row): OuvrageCreate => ({
        code: String(row['code'] ?? '').trim(),
        designation: String(row['designation'] ?? '').trim(),
        category: this.parseCategory(row['category']),
        unite: row['unite'] ? String(row['unite']).trim() : 'U',
        prixUnitaireHt: 0,
        uniteMain: { heures: 0, tauxHoraire: 0, total: 0 },
        composants: [],
        fraisGenerauxPercent: 0,
        beneficePercent: 0,
        isActive: true,
      }),
      (payload) => this.api.create(payload),
    );
  }

  private parseCategory(value: unknown): CategoryOuvrage {
    const raw = String(value ?? '').trim().toUpperCase().replace(/\s+/g, '_');
    return CATEGORIES.find((c) => c === raw) ?? 'AUTRE';
  }
}
