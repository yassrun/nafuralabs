import type { OrdreService, OrdreServiceStatus, OrdreServiceType } from '../../models';

export interface ApiOrdreServiceMarche {
  id: string;
  numero: string;
  contratMarcheId: string;
  chantierId?: string;
  chantierCode?: string;
  type: string;
  dateEmission?: string;
  emetteur?: string;
  objet?: string;
  description?: string;
  impactDelai?: number;
  impactCout?: number | string;
  status: string;
  dateAccuseReception?: string;
}

const TYPE_TO_UI: Record<string, OrdreServiceType> = {
  COMMENCEMENT: 'COMMENCEMENT',
  ARRET: 'ARRET',
  REPRISE: 'REPRISE',
  MODIFICATION: 'MODIFICATION',
  NOTIFICATION: 'NOTIFICATION',
};

const STATUS_TO_UI: Record<string, OrdreServiceStatus> = {
  BROUILLON: 'EMIS',
  EMIS: 'EMIS',
  RECEPTIONNE: 'RECEPTIONNE',
  ANNULE: 'CLOS',
};

function num(v: number | string | undefined | null): number | undefined {
  if (v == null) return undefined;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function osToUi(row: ApiOrdreServiceMarche): OrdreService {
  const emetteur = (row.emetteur ?? 'MOA').toUpperCase();
  return {
    id: row.id,
    numero: row.numero,
    marcheId: row.contratMarcheId,
    chantierId: row.chantierId ?? '',
    chantierCode: row.chantierCode ?? '',
    type: TYPE_TO_UI[row.type] ?? 'NOTIFICATION',
    dateEmission: row.dateEmission ?? '',
    emetteur: emetteur === 'MOE' || emetteur === 'NAFURA' ? emetteur : 'MOA',
    objet: row.objet ?? '',
    description: row.description ?? '',
    impactDelai: row.impactDelai,
    impactCout: num(row.impactCout),
    dateAccuseReception: row.dateAccuseReception,
    status: STATUS_TO_UI[row.status] ?? 'EMIS',
  };
}

export function osCreateToApi(data: Partial<OrdreService>): Record<string, unknown> {
  return {
    id: data.id,
    numero: data.numero,
    contratMarcheId: data.marcheId,
    chantierId: data.chantierId,
    chantierCode: data.chantierCode,
    type: data.type,
    dateEmission: data.dateEmission,
    emetteur: data.emetteur,
    objet: data.objet,
    description: data.description,
    impactDelai: data.impactDelai,
    impactCout: data.impactCout,
  };
}
