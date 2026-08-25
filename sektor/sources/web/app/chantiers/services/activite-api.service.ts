import { Injectable } from '@angular/core';

import { FeatureApiService } from '@platform/lib/anatomy';

export type ActiviteStatus = 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'EN_RETARD';
export type PrecedenceType = 'FD' | 'DD' | 'FF' | 'DF';

export interface ActiviteRattachement {
  id: string;
  activiteId: string;
  lotId?: string;
  posteId?: string;
  quantitePrevue: number;
}

export interface ActiviteChantier {
  id: string;
  chantierId: string;
  parentActiviteId?: string | null;
  zoneId?: string | null;
  libelle: string;
  dateDebut: string;
  dateFin: string;
  ordre: number;
  avancementPercent?: number | null;
  status: ActiviteStatus;
  rattachements?: ActiviteRattachement[];
}

export interface ActivitePrecedence {
  id: string;
  chantierId: string;
  predActiviteId: string;
  succActiviteId: string;
  typeLien: PrecedenceType;
}

export interface ActivitePlanning {
  activites: ActiviteChantier[];
  precedences: ActivitePrecedence[];
}

export interface ZoneChantier {
  id: string;
  chantierId: string;
  designation: string;
  parentZoneId?: string | null;
  ordre: number;
}

export interface ActiviteAvancementResult {
  id?: string;
  activiteId?: string;
  cumulQuantite?: number;
  avancementPercent?: number;
}

export interface ActiviteWriteBody {
  libelle?: string;
  dateDebut?: string;
  dateFin?: string;
  parentActiviteId?: string | null;
  zoneId?: string | null;
  ordre?: number;
  status?: ActiviteStatus;
  avancementPercent?: number | null;
}

@Injectable({ providedIn: 'root' })
export class ActiviteApiService extends FeatureApiService<
  ActiviteChantier,
  Partial<ActiviteChantier>,
  Partial<ActiviteChantier>
> {
  protected override basePath = '/api/v1/chantiers';

  async planning(chantierId: string): Promise<ActivitePlanning> {
    return this.get<ActivitePlanning>(`${this.basePath}/${chantierId}/activites/planning`);
  }

  async listByChantier(chantierId: string): Promise<ActiviteChantier[]> {
    return this.get<ActiviteChantier[]>(`${this.basePath}/${chantierId}/activites`);
  }

  async createActivite(chantierId: string, body: ActiviteWriteBody): Promise<ActiviteChantier> {
    return this.post<ActiviteChantier>(`${this.basePath}/${chantierId}/activites`, {
      libelle: body.libelle,
      dateDebut: body.dateDebut,
      dateFin: body.dateFin,
      parentActiviteId: body.parentActiviteId || null,
      zoneId: body.zoneId || null,
      ordre: body.ordre,
      status: body.status,
    });
  }

  async updateActivite(chantierId: string, activiteId: string, body: ActiviteWriteBody): Promise<ActiviteChantier> {
    const payload: ActiviteWriteBody = {};
    if (body.libelle !== undefined) payload.libelle = body.libelle;
    if (body.dateDebut !== undefined) payload.dateDebut = body.dateDebut;
    if (body.dateFin !== undefined) payload.dateFin = body.dateFin;
    if (body.parentActiviteId !== undefined) payload.parentActiviteId = body.parentActiviteId || '';
    if (body.zoneId !== undefined) payload.zoneId = body.zoneId || '';
    if (body.ordre !== undefined) payload.ordre = body.ordre;
    if (body.status !== undefined) payload.status = body.status;
    if (body.avancementPercent !== undefined) payload.avancementPercent = body.avancementPercent;
    return this.put<ActiviteChantier>(`${this.basePath}/${chantierId}/activites/${activiteId}`, payload);
  }

  async updateDates(chantierId: string, activiteId: string, dateDebut: string, dateFin: string): Promise<ActiviteChantier> {
    return this.updateActivite(chantierId, activiteId, { dateDebut, dateFin });
  }

  async listZones(chantierId: string): Promise<ZoneChantier[]> {
    const rows = await this.get<ZoneChantier[]>(`${this.basePath}/${chantierId}/zones`);
    return Array.isArray(rows) ? rows : [];
  }

  async rattacher(
    chantierId: string,
    activiteId: string,
    body: { posteId?: string; lotId?: string; quantitePrevue: number },
  ): Promise<ActiviteRattachement> {
    return this.post<ActiviteRattachement>(
      `${this.basePath}/${chantierId}/activites/${activiteId}/rattachements`,
      body,
    );
  }

  async detacher(chantierId: string, activiteId: string, rattachementId: string): Promise<void> {
    await this.deleteRequest(
      `${this.basePath}/${chantierId}/activites/${activiteId}/rattachements/${rattachementId}`,
    );
  }

  async declarerAvancement(
    chantierId: string,
    activiteId: string,
    body: {
      date: string;
      quantiteRealisee?: number;
      avancementPercent?: number;
      rattachementId?: string;
      saisieParId: string;
      saisieParName?: string;
      status?: string;
    },
  ): Promise<ActiviteAvancementResult> {
    return this.post<ActiviteAvancementResult>(
      `${this.basePath}/${chantierId}/activites/${activiteId}/avancements`,
      body,
    );
  }
}
