import { Injectable, inject } from '@angular/core';

import type { EmployeCreate, TypeContrat } from '@applications/erp/rh/models';
import { EmployeApiService } from '@applications/erp/pages/rh/employes/services/employe-api.service';
import { normalizeText } from '../../utils/extraction-json.utils';

import { EMPLOYE_EXTRACTION_SCHEMA } from '../../extraction-schemas';
import { ImportHandlerRegistry } from '../services/import-handler.registry';

const VALID_CONTRATS: TypeContrat[] = ['CDI', 'CDD', 'ANAPEC', 'Saisonnier', 'Interim'];

function parseSalaire(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (value == null || value === '') {
    return 0;
  }
  const n = Number(String(value).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function parseContrat(value: unknown): TypeContrat {
  const raw = String(value ?? '').trim().toUpperCase();
  const match = VALID_CONTRATS.find((c) => c.toUpperCase() === raw);
  return match ?? 'CDI';
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

@Injectable({ providedIn: 'root' })
export class EmployeImportHandlerRegistrar {
  private readonly registry = inject(ImportHandlerRegistry);
  private readonly api = inject(EmployeApiService);

  constructor() {
    this.register();
  }

  private register(): void {
    const schema = EMPLOYE_EXTRACTION_SCHEMA;
    this.registry.register<EmployeCreate>({
      entityKey: 'employe',
      dataSchema: schema.dataSchema,
      presentationSchema: schema.presentationSchema,
      instructions: schema.instructions,
      schemaName: schema.name,
      schemaDescription: schema.description,
      arrayPath: schema.arrayPath!,
      mapRowToPayload: (row: Record<string, unknown>) => ({
        nom: String(row['nom'] ?? '').trim(),
        prenom: String(row['prenom'] ?? '').trim(),
        cin: String(row['cin'] ?? '').trim(),
        cnss: row['cnss'] ? String(row['cnss']).trim() : undefined,
        poste: row['poste'] ? String(row['poste']).trim() : 'Non précisé',
        departement: row['departement'] ? String(row['departement']).trim() : undefined,
        categorie: 'Ouvrier',
        typeContrat: parseContrat(row['typeContrat']),
        statut: 'ACTIF',
        dateEmbauche: row['dateEmbauche']
          ? String(row['dateEmbauche']).trim().slice(0, 10)
          : todayIso(),
        salaireBase: parseSalaire(row['salaireBase']),
      }),
      create: (payload: EmployeCreate) => this.api.create(payload),
      dedupeKey: (row: Record<string, unknown>) => {
        const cin = row['cin'];
        return cin && String(cin).trim() ? String(cin).trim() : null;
      },
      loadExistingKeys: async () => {
        const res = await this.api.getAll();
        const keys = new Set<string>();
        for (const e of res.items) {
          if (e.cin?.trim()) {
            keys.add(normalizeText(e.cin));
          }
        }
        return keys;
      },
    });
  }
}
