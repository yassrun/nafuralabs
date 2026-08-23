import { Injectable, inject } from '@angular/core';

import type { ExtractionDefinition } from '@platform/app/document-extraction/smart-import';
import { toNumber } from '../../utils/extraction-json.utils';
import { DEVIS_CONSULTATION_EXTRACTION_SCHEMA } from '../../extraction-schemas';
import { extractionRows } from '../services/application-import.util';
import {
  ConsultationAchatApiService,
  type ConsultationAchat,
  type ConsultationDevisLigneInput,
} from '@app/achats/consultations/services/consultation-achat-api.service';

const schema = DEVIS_CONSULTATION_EXTRACTION_SCHEMA;

function asTrimmed(value: unknown): string | undefined {
  if (value == null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

export function mapDevisConsultationLignes(
  data: Record<string, unknown>,
): ConsultationDevisLigneInput[] {
  const lignes: ConsultationDevisLigneInput[] = [];
  for (const row of extractionRows(data, schema.arrayPath!)) {
    const identite = asTrimmed(row['identite'] ?? row['code'] ?? row['cleStable']);
    const libelle = asTrimmed(row['libelle'] ?? row['designation'] ?? row['name']);
    if (!identite && !libelle) {
      continue;
    }
    const quantiteRaw = row['quantite'] ?? row['qty'];
    const prixRaw = row['prixUnitaire'] ?? row['pu'] ?? row['unitPrice'];
    lignes.push({
      identite,
      libelle: libelle ?? identite,
      quantite: quantiteRaw != null && String(quantiteRaw).trim() !== '' ? toNumber(quantiteRaw) : undefined,
      unite: asTrimmed(row['unite'] ?? row['uom'] ?? row['uomCode']),
      prixUnitaire: prixRaw != null && String(prixRaw).trim() !== '' ? toNumber(prixRaw) : undefined,
    });
  }
  return lignes;
}

export const DEVIS_CONSULTATION_IMPORT_DEFINITION: ExtractionDefinition = {
  key: 'devis-consultation',
  name: schema.name,
  description: schema.description,
  dataSchema: schema.dataSchema,
  presentationSchema: schema.presentationSchema,
  instructions: schema.instructions,
  arrayPath: schema.arrayPath!,
  validateRow: (row, rowIndex) => {
    const identite = String(row['identite'] ?? '').trim();
    const libelle = String(row['libelle'] ?? '').trim();
    return identite || libelle
      ? []
      : [{
          path: `${schema.arrayPath}[${rowIndex}].libelle`,
          rowIndex,
          kind: 'MISSING_REQUIRED',
          message: 'Identité ou libellé requis',
        }];
  },
};

@Injectable({ providedIn: 'root' })
export class DevisConsultationImportService {
  private readonly api = inject(ConsultationAchatApiService);

  async persist(
    consultationId: string,
    data: Record<string, unknown>,
    fichierNom?: string,
  ): Promise<ConsultationAchat | null> {
    const lignes = mapDevisConsultationLignes(data);
    if (!lignes.length) {
      return null;
    }
    return this.api.importDevis(consultationId, { fichierNom, lignes });
  }
}
