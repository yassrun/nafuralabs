import type { Ppsps, PpspsSection, PpspsStatus } from '../../models';

export interface ApiPpsps {
  id: string;
  numero: string;
  chantierId: string;
  chantierCode: string;
  chantierNom: string;
  coordonnateurSpsNom: string;
  coordonnateurSpsTel?: string;
  date: string;
  mesuresCollectives: string;
  effectifsMaxJour?: number;
  hommesJourEstimes?: number;
  observations?: string;
  status: string;
  version?: number;
}

export interface ApiPpspsSection {
  id: string;
  ppspsId: string;
  code: string;
  titre: string;
  contenu?: string;
  ordre: number;
}

export interface ApiPpspsCreate {
  id?: string;
  chantierId: string;
  chantierCode: string;
  chantierNom: string;
  coordonnateurSpsNom: string;
  coordonnateurSpsTel?: string;
  date: string;
  mesuresCollectives: string;
  effectifsMaxJour?: number;
  hommesJourEstimes?: number;
  observations?: string;
  status?: string;
}

export function ppspsSectionToUi(row: ApiPpspsSection): PpspsSection {
  return {
    numero: row.code,
    titre: row.titre,
    contenu: row.contenu ?? '',
  };
}

export function ppspsToUi(row: ApiPpsps, sections?: PpspsSection[]): Ppsps {
  return {
    id: row.id,
    numero: row.numero,
    chantierId: row.chantierId,
    chantierCode: row.chantierCode,
    chantierName: row.chantierNom,
    coordonnateurSpsNom: row.coordonnateurSpsNom,
    coordonnateurSpsTel: row.coordonnateurSpsTel,
    date: row.date,
    mesuresCollectives: row.mesuresCollectives,
    effectifsMaxJour: row.effectifsMaxJour,
    hommesJourEstimes: row.hommesJourEstimes,
    observations: row.observations,
    status: row.status as PpspsStatus,
    version: row.version ?? 1,
    sections,
  };
}

export function ppspsCreateToApi(
  input: Pick<
    Ppsps,
    | 'chantierId'
    | 'chantierCode'
    | 'chantierName'
    | 'coordonnateurSpsNom'
    | 'coordonnateurSpsTel'
    | 'date'
    | 'mesuresCollectives'
    | 'status'
  >,
): ApiPpspsCreate {
  return {
    chantierId: input.chantierId,
    chantierCode: input.chantierCode,
    chantierNom: input.chantierName,
    coordonnateurSpsNom: input.coordonnateurSpsNom,
    coordonnateurSpsTel: input.coordonnateurSpsTel,
    date: input.date,
    mesuresCollectives: input.mesuresCollectives,
    status: input.status,
  };
}
