import type { ExtractionDefinition } from '@platform/app/document-extraction/smart-import';

import type { Societe, SocieteFormeJuridique } from '@app/socle/administration/societe/models';

import { MODELE_J_EXTRACTION_SCHEMA } from '../../extraction-schemas/modele-j.schema';

const schema = MODELE_J_EXTRACTION_SCHEMA;

export interface ModeleJIdentityPatch {
  societe: Partial<Societe>;
  extras: {
    capitalSocial?: number;
    villeSiegeAffichee?: string;
    representantLegalNom?: string;
    representantLegalQualite?: string;
  };
}

export const MODELE_J_IMPORT_DEFINITION: ExtractionDefinition = {
  key: 'modele-j',
  name: schema.name,
  description: schema.description,
  dataSchema: schema.dataSchema,
  presentationSchema: schema.presentationSchema,
  instructions: schema.instructions,
  arrayPath: schema.arrayPath!,
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

export function mapFormeJuridique(raw: unknown): SocieteFormeJuridique | undefined {
  if (raw == null) return undefined;
  const u = String(raw).toUpperCase().replace(/[\s.\-]/g, '');
  if (!u) return undefined;
  if (u.includes('SARLAU') || u.includes('UNIQUE')) return 'SARLAU';
  if (u.includes('SAS')) return 'SAS';
  if (u === 'SA' || u.startsWith('SOCIETEANONYME')) return 'SA';
  if (u.includes('SARL')) return 'SARL';
  return undefined;
}

function text(row: Record<string, unknown>, key: string): string | undefined {
  const value = row[key];
  if (value == null) return undefined;
  const trimmed = String(value).trim();
  return trimmed || undefined;
}

function digits(row: Record<string, unknown>, key: string): string | undefined {
  const value = text(row, key);
  return value ? value.replace(/\D+/g, '') || undefined : undefined;
}

function capital(row: Record<string, unknown>): number | undefined {
  const value = row['capitalSocial'];
  if (value == null || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(String(value).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

/** Maps a reviewed modèle J row onto société identity + extras. */
export function applyModeleJRow(row: Record<string, unknown>): ModeleJIdentityPatch {
  const forme = mapFormeJuridique(row['formeJuridique']);
  return {
    societe: {
      raisonSociale: text(row, 'raisonSociale'),
      ...(forme ? { formeJuridique: forme } : {}),
      ice: digits(row, 'ice'),
      if: digits(row, 'identifiantFiscal'),
      rc: text(row, 'rc'),
      patente: text(row, 'patente'),
      cnss: digits(row, 'cnss'),
      tvaIntra: text(row, 'tvaIntra'),
      siegeAdresse: text(row, 'adresse'),
    },
    extras: {
      capitalSocial: capital(row),
      villeSiegeAffichee: text(row, 'ville'),
      representantLegalNom: text(row, 'representantLegalNom'),
      representantLegalQualite: text(row, 'representantLegalQualite'),
    },
  };
}
