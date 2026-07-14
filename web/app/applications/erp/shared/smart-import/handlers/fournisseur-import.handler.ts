import { Injectable, inject } from '@angular/core';

import type { FournisseurCreate } from '@applications/erp/achats/models';
import { FournisseurApiService } from '@applications/erp/pages/achats/fournisseurs/services/fournisseur-api.service';
import { normalizeText } from '../../utils/extraction-json.utils';

import { FOURNISSEUR_EXTRACTION_SCHEMA } from '../../extraction-schemas';
import { ImportHandlerRegistry } from '../services/import-handler.registry';

@Injectable({ providedIn: 'root' })
export class FournisseurImportHandlerRegistrar {
  private readonly registry = inject(ImportHandlerRegistry);
  private readonly api = inject(FournisseurApiService);

  constructor() {
    this.register();
  }

  private register(): void {
    const schema = FOURNISSEUR_EXTRACTION_SCHEMA;
    this.registry.register<FournisseurCreate>({
      entityKey: 'fournisseur',
      dataSchema: schema.dataSchema,
      presentationSchema: schema.presentationSchema,
      instructions: schema.instructions,
      schemaName: schema.name,
      schemaDescription: schema.description,
      arrayPath: schema.arrayPath!,
      mapRowToPayload: (row: Record<string, unknown>) => ({
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
      create: (payload: FournisseurCreate) => this.api.create(payload),
      dedupeKey: (row: Record<string, unknown>) => {
        const ice = row['ice'];
        if (ice && String(ice).trim()) {
          return String(ice).trim();
        }
        const name = row['raisonSociale'];
        return name ? String(name).trim() : null;
      },
      loadExistingKeys: async () => {
        const res = await this.api.getAll();
        const keys = new Set<string>();
        for (const f of res.items) {
          if (f.ice?.trim()) {
            keys.add(normalizeText(f.ice));
          }
          keys.add(normalizeText(f.raisonSociale));
        }
        return keys;
      },
    });
  }
}
