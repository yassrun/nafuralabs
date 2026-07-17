import { Injectable, inject } from '@angular/core';

import type { ClientVenteCreate } from '@applications/erp/ventes/models';
import { ClientApiService } from '@applications/erp/pages/ventes/clients/services/client-api.service';
import type { ExtractionDefinition } from '@platform/features/documents/smart-import';
import { normalizeText } from '../../utils/extraction-json.utils';

import { CLIENT_EXTRACTION_SCHEMA } from '../../extraction-schemas';
import {
  extractionRows,
  persistUniqueRows,
  type ApplicationImportResult,
} from '../services/application-import.util';

const schema = CLIENT_EXTRACTION_SCHEMA;
const dedupeKey = (row: Record<string, unknown>): string | null => {
  const ice = row['ice'];
  if (ice && String(ice).trim()) return String(ice).trim();
  const name = row['raisonSociale'];
  return name ? String(name).trim() : null;
};

export const CLIENT_IMPORT_DEFINITION: ExtractionDefinition = {
  key: 'client',
  name: schema.name,
  description: schema.description,
  dataSchema: schema.dataSchema,
  presentationSchema: schema.presentationSchema,
  instructions: schema.instructions,
  arrayPath: schema.arrayPath!,
  dedupeKey,
};

@Injectable({ providedIn: 'root' })
export class ClientImportService {
  private readonly api = inject(ClientApiService);

  async import(data: Record<string, unknown>): Promise<ApplicationImportResult> {
    const existing = await this.api.getAll();
    const keys = new Set<string>();
    for (const client of existing.items) {
      if (client.ice?.trim()) keys.add(normalizeText(client.ice));
      keys.add(normalizeText(client.nom));
    }
    return persistUniqueRows(
      extractionRows(data, schema.arrayPath!),
      keys,
      dedupeKey,
      (row): ClientVenteCreate => ({
        nom: String(row['raisonSociale'] ?? '').trim(),
        type: 'SARL',
        ice: row['ice'] ? String(row['ice']).trim() : undefined,
        email: row['email'] ? String(row['email']).trim() : undefined,
        telephone: row['telephone'] ? String(row['telephone']).trim() : undefined,
        ville: row['ville'] ? String(row['ville']).trim() : '',
        actif: true,
      }),
      (payload) => this.api.create(payload),
    );
  }
}
