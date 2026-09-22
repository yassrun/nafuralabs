/**
 * @deprecated Import from `@platform/app/document-extraction/smart-import` instead.
 * Thin adapter kept so Sektor société page still receives a Societe-shaped patch.
 */
import type { Societe, SocieteFormeJuridique } from '@app/socle/administration/societe/models';

import {
  MODELE_J_IMPORT_DEFINITION as PLATFORM_MODELE_J_IMPORT_DEFINITION,
  applyModeleJRow as applyPlatformModeleJRow,
  mapFormeJuridique as mapPlatformFormeJuridique,
} from '@platform/app/document-extraction/smart-import';

export const MODELE_J_IMPORT_DEFINITION = PLATFORM_MODELE_J_IMPORT_DEFINITION;

export interface ModeleJIdentityPatch {
  societe: Partial<Societe>;
  extras: {
    capitalSocial?: number;
    villeSiegeAffichee?: string;
    representantLegalNom?: string;
    representantLegalQualite?: string;
  };
}

export function mapFormeJuridique(raw: unknown): SocieteFormeJuridique | undefined {
  return mapPlatformFormeJuridique(raw) as SocieteFormeJuridique | undefined;
}

/** Maps a reviewed modèle J row onto société identity + extras. */
export function applyModeleJRow(row: Record<string, unknown>): ModeleJIdentityPatch {
  const patch = applyPlatformModeleJRow(row);
  const capital =
    patch.capital != null && patch.capital !== ''
      ? Number(String(patch.capital).replace(/\s/g, '').replace(',', '.'))
      : undefined;
  return {
    societe: {
      raisonSociale: patch.raisonSociale,
      ...(patch.formeJuridique ? { formeJuridique: patch.formeJuridique } : {}),
      ice: patch.ice,
      if: patch.identifiantFiscal,
      rc: patch.rc,
      patente: patch.patente,
      cnss: patch.cnss,
      tvaIntra: patch.tvaIntra,
      siegeAdresse: patch.adresse,
    },
    extras: {
      capitalSocial: Number.isFinite(capital) ? capital : undefined,
      villeSiegeAffichee: patch.ville,
      representantLegalNom: patch.representantLegalNom,
      representantLegalQualite: patch.representantLegalQualite,
    },
  };
}
