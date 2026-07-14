import { Injectable, inject } from '@angular/core';

import type { CategoryOuvrage, OuvrageCreate } from '@applications/erp/etudes/models';
import { OuvrageApiService } from '@applications/erp/pages/etudes/bibliotheque-prix/services/ouvrage-api.service';
import { normalizeText } from '../../utils/extraction-json.utils';

import { OUVRAGE_EXTRACTION_SCHEMA } from '../../extraction-schemas';
import { ImportHandlerRegistry } from '../services/import-handler.registry';

const CATEGORIES: CategoryOuvrage[] = [
  'TERRASSEMENT', 'GO', 'CHARPENTE', 'ETANCHEITE', 'CLOISON', 'REVETEMENT',
  'MENUISERIE', 'ELECTRICITE', 'PLOMBERIE', 'CLIM', 'PEINTURE', 'VRD', 'AUTRE',
];

@Injectable({ providedIn: 'root' })
export class OuvrageImportHandlerRegistrar {
  private readonly registry = inject(ImportHandlerRegistry);
  private readonly api = inject(OuvrageApiService);

  constructor() {
    this.register();
  }

  private register(): void {
    const schema = OUVRAGE_EXTRACTION_SCHEMA;
    this.registry.register<OuvrageCreate>({
      entityKey: 'ouvrage',
      dataSchema: schema.dataSchema,
      presentationSchema: schema.presentationSchema,
      instructions: schema.instructions,
      schemaName: schema.name,
      schemaDescription: schema.description,
      arrayPath: schema.arrayPath!,
      mapRowToPayload: (row: Record<string, unknown>) => ({
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
      create: (payload: OuvrageCreate) => this.api.create(payload),
      dedupeKey: (row: Record<string, unknown>) => {
        const code = row['code'];
        return code && String(code).trim() ? String(code).trim() : null;
      },
      loadExistingKeys: async () => {
        const res = await this.api.getAll({ page: 0, pageSize: 500 });
        const keys = new Set<string>();
        for (const o of res.items) {
          if (o.code?.trim()) {
            keys.add(normalizeText(o.code));
          }
        }
        return keys;
      },
    });
  }

  private parseCategory(value: unknown): CategoryOuvrage {
    const raw = String(value ?? '').trim().toUpperCase().replace(/\s+/g, '_');
    return CATEGORIES.find((c) => c === raw) ?? 'AUTRE';
  }
}
