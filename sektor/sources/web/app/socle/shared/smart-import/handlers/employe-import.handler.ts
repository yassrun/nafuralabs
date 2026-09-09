import { Injectable, inject } from '@angular/core';

import type { EmployeCreate, TypeContrat } from '@app/rh/models';
import { EmployeApiService } from '@app/rh/employes/services/employe-api.service';
import type { ExtractionDefinition } from '@platform/app/document-extraction/smart-import';
import { normalizeText } from '../../utils/extraction-json.utils';

import { EMPLOYE_EXTRACTION_SCHEMA } from '../../extraction-schemas';
import {
  extractionRows,
  persistUniqueRows,
  type ApplicationImportResult,
} from '../services/application-import.util';

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

const schema = EMPLOYE_EXTRACTION_SCHEMA;
const dedupeKey = (row: Record<string, unknown>): string | null => {
  const cin = row['cin'];
  return cin && String(cin).trim() ? String(cin).trim() : null;
};

export const EMPLOYE_IMPORT_DEFINITION: ExtractionDefinition = {
  key: 'employe',
  name: schema.name,
  description: schema.description,
  dataSchema: schema.dataSchema,
  presentationSchema: schema.presentationSchema,
  instructions: schema.instructions,
  arrayPath: schema.arrayPath!,
  dedupeKey,
};

@Injectable({ providedIn: 'root' })
export class EmployeImportService {
  private readonly api = inject(EmployeApiService);

  async import(data: Record<string, unknown>): Promise<ApplicationImportResult> {
    const existing = await this.api.getAll();
    const keys = new Set(
      existing.items
        .map((employee) => employee.cin?.trim())
        .filter((cin): cin is string => !!cin)
        .map(normalizeText),
    );
    return persistUniqueRows(
      extractionRows(data, schema.arrayPath!),
      keys,
      dedupeKey,
      (row): EmployeCreate => ({
        nom: String(row['nom'] ?? '').trim(),
        prenom: String(row['prenom'] ?? '').trim(),
        cin: String(row['cin'] ?? '').trim(),
        cnss: row['cnss'] ? String(row['cnss']).trim() : undefined,
        posteId: '',
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
      (payload) => this.api.create(payload),
    );
  }
}
