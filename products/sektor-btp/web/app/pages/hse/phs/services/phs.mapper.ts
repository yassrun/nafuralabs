import type { PhsDocument, PpspsSection, PpspsStatus } from '../../models';
import { PPSPS_SECTION_TEMPLATE_FR } from '../../models';

export interface ApiPhs {
  id: string;
  numero: string;
  titre: string;
  version: number;
  dateRevision: string;
  auteurNom: string;
  contenu?: string;
  status: string;
}

export interface ApiPhsCreate {
  id?: string;
  numero: string;
  titre: string;
  version?: number;
  dateRevision: string;
  auteurNom: string;
  contenu?: string;
  status?: string;
}

interface ApiPhsSectionJson {
  code?: string;
  numero?: string;
  titre: string;
  contenu?: string;
}

export function parsePhsSections(contenu?: string): PpspsSection[] {
  if (!contenu || contenu.trim() === '' || contenu.trim() === '[]') {
    return PPSPS_SECTION_TEMPLATE_FR.map((s) => ({ ...s }));
  }
  try {
    const parsed = JSON.parse(contenu) as ApiPhsSectionJson[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return PPSPS_SECTION_TEMPLATE_FR.map((s) => ({ ...s }));
    }
    return parsed.map((s) => ({
      numero: s.numero ?? s.code ?? '',
      titre: s.titre,
      contenu: s.contenu ?? '',
    }));
  } catch {
    return PPSPS_SECTION_TEMPLATE_FR.map((s) => ({ ...s }));
  }
}

export function phsToUi(row: ApiPhs): PhsDocument {
  return {
    id: row.id,
    numero: row.numero,
    version: row.version,
    dateRedaction: row.dateRevision,
    redacteurNom: row.auteurNom,
    status: row.status as PpspsStatus,
    sections: parsePhsSections(row.contenu),
  };
}
