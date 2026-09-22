import type { ExtractionDefinition } from '../models/smart-import.model';

import { MODELE_J_EXTRACTION_SCHEMA } from '../schemas/modele-j.schema';

const schema = MODELE_J_EXTRACTION_SCHEMA;

export type OrganizationFormeJuridique = 'SARL' | 'SA' | 'SARLAU' | 'SAS';

/** Patch applied onto {@link OrganizationIdentity} after OCR review. */
export interface ModeleJIdentityPatch {
  raisonSociale?: string;
  formeJuridique?: OrganizationFormeJuridique;
  ice?: string;
  identifiantFiscal?: string;
  rc?: string;
  patente?: string;
  cnss?: string;
  tvaIntra?: string;
  adresse?: string;
  ville?: string;
  capital?: string;
  representantLegalNom?: string;
  representantLegalQualite?: string;
}

export const MODELE_J_IMPORT_DEFINITION: ExtractionDefinition = {
  key: 'modele-j',
  name: schema.name,
  description: schema.description,
  dataSchema: schema.dataSchema,
  presentationSchema: schema.presentationSchema,
  instructions: schema.instructions,
  arrayPath: schema.arrayPath,
  validateRow: (row, rowIndex) => {
    const raisonSociale = String(row['raisonSociale'] ?? '').trim();
    return raisonSociale
      ? []
      : [
          {
            path: `${schema.arrayPath}[${rowIndex}].raisonSociale`,
            rowIndex,
            kind: 'MISSING_REQUIRED',
            message: 'Raison sociale requise',
          },
        ];
  },
};

export function mapFormeJuridique(raw: unknown): OrganizationFormeJuridique | undefined {
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

function capital(row: Record<string, unknown>): string | undefined {
  const value = row['capitalSocial'];
  if (value == null || value === '') return undefined;
  const n =
    typeof value === 'number'
      ? value
      : Number(String(value).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? String(n) : text(row, 'capitalSocial');
}

/** Maps a reviewed modèle J row onto platform organization identity fields. */
export function applyModeleJRow(row: Record<string, unknown>): ModeleJIdentityPatch {
  const forme = mapFormeJuridique(row['formeJuridique']);
  return {
    raisonSociale: text(row, 'raisonSociale'),
    ...(forme ? { formeJuridique: forme } : {}),
    ice: digits(row, 'ice'),
    identifiantFiscal: digits(row, 'identifiantFiscal'),
    rc: text(row, 'rc'),
    patente: text(row, 'patente'),
    cnss: digits(row, 'cnss'),
    tvaIntra: text(row, 'tvaIntra'),
    adresse: text(row, 'adresse'),
    ville: text(row, 'ville'),
    capital: capital(row),
    representantLegalNom: text(row, 'representantLegalNom'),
    representantLegalQualite: text(row, 'representantLegalQualite'),
  };
}
