import { Injectable } from '@angular/core';

import { FeatureApiService } from '@platform/lib/anatomy';

import type { Attachement, AttachementLigne, AttachementStatus, MeteoCode, ZoneChantier } from './attachement.models';

interface ApiAttachementLigne {
  id: string;
  noeudId: string;
  code: string;
  designation: string;
  unite: string;
  quantitePeriode: number;
  prixUnitaireVendu?: number;
  montantHt?: number;
  zoneId?: string;
  zoneLibelle?: string;
}

interface ApiAttachement {
  id: string;
  numero: string;
  chantierId: string;
  chantierCode?: string;
  dateDebut: string;
  dateFin: string;
  meteoCode?: MeteoCode;
  temperatureC?: number;
  effectifPresent: number;
  lignes: ApiAttachementLigne[];
  status: AttachementStatus;
  signatureMoeDataUrl?: string;
}

interface ApiZoneChantier {
  id: string;
  chantierId: string;
  designation: string;
  parentZoneId?: string;
  ordre: number;
}

/** AC-19 — le jeton n'est rendu qu'une fois, à la génération du lien. */
export interface LienSignature {
  token: string;
  url: string;
  expiresAt: string;
}

/** AC-10, AC-11 — une période, jamais une grille de lignes : le montage est fait côté serveur. */
export interface AttachementCreateInput {
  dateDebut: string;
  dateFin: string;
  meteoCode?: MeteoCode;
  temperatureC?: number;
  effectifPresent: number;
}

function apiLigneToUi(row: ApiAttachementLigne): AttachementLigne {
  return {
    id: row.id,
    noeudId: row.noeudId,
    code: row.code,
    designation: row.designation,
    unite: row.unite,
    quantitePeriode: Number(row.quantitePeriode ?? 0),
    prixUnitaireVendu: row.prixUnitaireVendu != null ? Number(row.prixUnitaireVendu) : undefined,
    montantHt: row.montantHt != null ? Number(row.montantHt) : undefined,
    zoneId: row.zoneId,
    zoneLibelle: row.zoneLibelle,
  };
}

function apiToUi(row: ApiAttachement): Attachement {
  return {
    id: row.id,
    numero: row.numero,
    chantierId: row.chantierId,
    chantierCode: row.chantierCode ?? row.chantierId,
    dateDebut: row.dateDebut,
    dateFin: row.dateFin,
    meteoCode: row.meteoCode,
    temperatureC: row.temperatureC,
    effectifPresent: Number(row.effectifPresent ?? 0),
    lignes: (row.lignes ?? []).map(apiLigneToUi),
    status: row.status,
    signatureMoeDataUrl: row.signatureMoeDataUrl,
  };
}

function apiZoneToUi(row: ApiZoneChantier): ZoneChantier {
  return {
    id: row.id,
    chantierId: row.chantierId,
    designation: row.designation,
    parentZoneId: row.parentZoneId,
    ordre: row.ordre,
  };
}

@Injectable({ providedIn: 'root' })
export class AttachementApiService extends FeatureApiService<Attachement, AttachementCreateInput, never> {
  protected override basePath = '/api/v1/chantiers';

  async listAll(): Promise<Attachement[]> {
    const rows = await this.get<ApiAttachement[]>(`${this.basePath}/attachements`);
    return (rows ?? []).map(apiToUi);
  }

  async listByChantier(chantierId: string): Promise<Attachement[]> {
    const rows = await this.get<ApiAttachement[]>(`${this.basePath}/${chantierId}/attachements`);
    return (rows ?? []).map(apiToUi);
  }

  /** AC-11 — le montage se fait côté serveur depuis les déclarations de la période. */
  async createForChantier(chantierId: string, body: AttachementCreateInput): Promise<Attachement> {
    const row = await this.post<ApiAttachement>(`${this.basePath}/${chantierId}/attachements`, body);
    return apiToUi(row);
  }

  async soumettreSignature(id: string): Promise<Attachement> {
    const row = await this.post<ApiAttachement>(`/api/v1/attachements/${id}/soumettre-signature`, {});
    return apiToUi(row);
  }

  /** AC-17 — retour en brouillon + remontage depuis les déclarations. */
  async contester(id: string): Promise<Attachement> {
    const row = await this.post<ApiAttachement>(`/api/v1/attachements/${id}/contester`, {});
    return apiToUi(row);
  }

  /** AC-14 — la zone facultative d'une ligne, choisie dans le référentiel du chantier. */
  async assignerZone(attachementId: string, ligneId: string, zoneId: string | null): Promise<Attachement> {
    const row = await this.put<ApiAttachement>(`/api/v1/attachements/${attachementId}/lignes/${ligneId}/zone`, {
      zoneId,
    });
    return apiToUi(row);
  }

  async listZones(chantierId: string): Promise<ZoneChantier[]> {
    const rows = await this.get<ApiZoneChantier[]>(`${this.basePath}/${chantierId}/zones`);
    return (rows ?? []).map(apiZoneToUi);
  }

  /** AC-19 — jeton aléatoire, distinct de l'id de l'attachement, rendu une seule fois. */
  async genererLienSignature(attachementId: string): Promise<LienSignature> {
    return this.post<LienSignature>(`/api/v1/attachements/${attachementId}/lien-signature`, {});
  }
}
