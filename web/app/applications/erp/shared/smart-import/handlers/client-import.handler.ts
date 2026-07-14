import { Injectable, inject } from '@angular/core';

import type { ClientVenteCreate } from '@applications/erp/ventes/models';
import { ClientApiService } from '@applications/erp/pages/ventes/clients/services/client-api.service';
import { normalizeText } from '../../utils/extraction-json.utils';

import { CLIENT_EXTRACTION_SCHEMA } from '../../extraction-schemas';
import { ImportHandlerRegistry } from '../services/import-handler.registry';

@Injectable({ providedIn: 'root' })
export class ClientImportHandlerRegistrar {
  private readonly registry = inject(ImportHandlerRegistry);
  private readonly api = inject(ClientApiService);

  constructor() {
    this.register();
  }

  private register(): void {
    const schema = CLIENT_EXTRACTION_SCHEMA;
    this.registry.register<ClientVenteCreate>({
      entityKey: 'client',
      dataSchema: schema.dataSchema,
      presentationSchema: schema.presentationSchema,
      instructions: schema.instructions,
      schemaName: schema.name,
      schemaDescription: schema.description,
      arrayPath: schema.arrayPath!,
      mapRowToPayload: (row: Record<string, unknown>) => ({
        nom: String(row['raisonSociale'] ?? '').trim(),
        type: 'SARL',
        ice: row['ice'] ? String(row['ice']).trim() : undefined,
        email: row['email'] ? String(row['email']).trim() : undefined,
        telephone: row['telephone'] ? String(row['telephone']).trim() : undefined,
        ville: row['ville'] ? String(row['ville']).trim() : '',
        actif: true,
      }),
      create: (payload: ClientVenteCreate) => this.api.create(payload),
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
        for (const c of res.items) {
          if (c.ice?.trim()) {
            keys.add(normalizeText(c.ice));
          }
          keys.add(normalizeText(c.nom));
        }
        return keys;
      },
    });
  }
}
