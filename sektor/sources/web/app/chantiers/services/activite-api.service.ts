import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { FeatureApiService } from '@platform/lib/anatomy';

export type ActiviteStatus = 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'EN_RETARD';
export type PrecedenceType = 'FD' | 'DD' | 'FF' | 'DF';
export type ActiviteForme = 'PHASE' | 'ACTIVITE' | 'JALON';

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
  code?: string | null;
  forme?: ActiviteForme | null;
  natureCode?: string | null;
  dateDebut: string;
  dateFin: string;
  dureeMinutesOuvrees?: number | null;
  calendrierSpecifique?: CalendrierVersionWrite | null;
  utiliserCalendrierChantier?: boolean;
  recalculerFin?: boolean;
  ordre: number;
  avancementPercent?: number | null;
  status: ActiviteStatus;
  rattachements?: ActiviteRattachement[];
  planningAllocations?: { affectationId: string; minutesParJour: number }[];
}

export interface ActivitePrecedence {
  id: string;
  chantierId: string;
  predActiviteId: string;
  succActiviteId: string;
  typeLien: PrecedenceType;
}

export interface PlanningCapacites {
  lire: boolean;
  editerStructure: boolean;
  proposerStructure: boolean;
  administrerCalendrier: boolean;
  proposerCalendrier: boolean;
  gererVues: boolean;
}

export interface ActivitePlanning {
  activites: ActiviteChantier[];
  precedences: ActivitePrecedence[];
  capacites?: PlanningCapacites;
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
  forme?: ActiviteForme;
  natureCode?: string | null;
  code?: string | null;
  dateDebut?: string;
  dateFin?: string | null;
  dureeMinutesOuvrees?: number | null;
  calendrierSpecifique?: CalendrierVersionWrite | null;
  utiliserCalendrierChantier?: boolean;
  recalculerFin?: boolean;
  parentActiviteId?: string | null;
  zoneId?: string | null;
  ordre?: number;
  status?: ActiviteStatus;
  avancementPercent?: number | null;
}

export interface CalendrierCreneau {
  jourSemaine?: number;
  heureDebut: string;
  heureFin: string;
  lendemain?: boolean;
}

export interface CalendrierException {
  id?: string;
  dateLocale: string;
  type: string;
  creneaux?: CalendrierCreneau[];
}

export interface CalendrierVersion {
  id?: string;
  dateEffet: string;
  fuseauIana: string;
  creneaux: CalendrierCreneau[];
  exceptions?: CalendrierException[];
}

export interface CalendrierChantier {
  id: string;
  chantierId: string;
  kind: string;
  versions: CalendrierVersion[];
}

export interface CalendrierVersionWrite {
  dateEffet?: string;
  fuseauIana: string;
  creneaux: CalendrierCreneau[];
  exceptions?: CalendrierException[];
}

export interface PlanningResourceDay { employeId: string; date: string; reservedMinutes: number; calendarMinutes: number; overload: boolean; activityIds: string[]; }
export interface PlanningNetworkRow {
  id: string; label: string; previousStart: string; previousFinish: string;
  start: string; finish: string; latestStart: string; floatDays: number; critical: boolean; changed: boolean;
}
export interface PlanningSimulation { token: string; rows: PlanningNetworkRow[]; finish: string; precision: string; }

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
      forme: body.forme,
      natureCode: body.natureCode || null,
      code: body.code || null,
      dateDebut: body.dateDebut,
      dateFin: body.dateFin,
      dureeMinutesOuvrees: body.dureeMinutesOuvrees,
      calendrierSpecifique: body.calendrierSpecifique,
      parentActiviteId: body.parentActiviteId || null,
      zoneId: body.zoneId || null,
      ordre: body.ordre,
      status: body.status,
    });
  }

  async updateActivite(chantierId: string, activiteId: string, body: ActiviteWriteBody): Promise<ActiviteChantier> {
    const payload: ActiviteWriteBody = {};
    if (body.recalculerFin !== undefined) payload.recalculerFin = body.recalculerFin;
    if (body.calendrierSpecifique !== undefined) payload.calendrierSpecifique = body.calendrierSpecifique;
    if (body.utiliserCalendrierChantier !== undefined) payload.utiliserCalendrierChantier = body.utiliserCalendrierChantier;
    if (body.libelle !== undefined) payload.libelle = body.libelle;
    if (body.forme !== undefined) payload.forme = body.forme;
    if (body.natureCode !== undefined) payload.natureCode = body.natureCode;
    if (body.code !== undefined) payload.code = body.code;
    if (body.dateDebut !== undefined) payload.dateDebut = body.dateDebut;
    if (body.dateFin !== undefined) payload.dateFin = body.dateFin;
    if (body.dureeMinutesOuvrees !== undefined) payload.dureeMinutesOuvrees = body.dureeMinutesOuvrees;
    if (body.parentActiviteId !== undefined) payload.parentActiviteId = body.parentActiviteId || '';
    if (body.zoneId !== undefined) payload.zoneId = body.zoneId || '';
    if (body.ordre !== undefined) payload.ordre = body.ordre;
    if (body.status !== undefined) payload.status = body.status;
    if (body.avancementPercent !== undefined) payload.avancementPercent = body.avancementPercent;
    return this.put<ActiviteChantier>(`${this.basePath}/${chantierId}/activites/${activiteId}`, payload);
  }

  async getCalendrier(chantierId: string): Promise<CalendrierChantier | null> {
    try {
      return await this.get<CalendrierChantier>(`${this.basePath}/${chantierId}/calendrier`);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async putCalendrier(chantierId: string, body: CalendrierVersionWrite): Promise<CalendrierChantier> {
    return this.put<CalendrierChantier>(`${this.basePath}/${chantierId}/calendrier`, body);
  }

  async resourceWeek(chantierId: string, start: string): Promise<PlanningResourceDay[]> {
    return this.get<PlanningResourceDay[]>(`${this.basePath}/${chantierId}/planning-resources?start=${encodeURIComponent(start)}`);
  }
  async reserveResource(chantierId: string, activityId: string, affectationId: string, minutesParJour: number): Promise<void> {
    await this.put<void>(`${this.basePath}/${chantierId}/planning-resources`, { activityId, affectationId, minutesParJour });
  }
  async simulateNetwork(chantierId: string): Promise<PlanningSimulation> {
    return this.get<PlanningSimulation>(`${this.basePath}/${chantierId}/planning-network`);
  }
  async applyNetwork(chantierId: string, token: string): Promise<PlanningSimulation> {
    return this.post<PlanningSimulation>(`${this.basePath}/${chantierId}/planning-network/apply`, { token });
  }

  async previewFin(chantierId: string, dateDebut: string, dureeMinutesOuvrees: number, calendrierSpecifique?: CalendrierVersionWrite | null): Promise<{ dateFin: string }> {
    return this.post<{ dateFin: string }>(`${this.basePath}/${chantierId}/calendrier/preview`, { dateDebut, dureeMinutesOuvrees, calendrierSpecifique });
  }

  async addPrecedence(chantierId: string, predActiviteId: string, succActiviteId: string, typeLien: PrecedenceType): Promise<ActivitePrecedence> {
    return this.post<ActivitePrecedence>(`${this.basePath}/${chantierId}/activites/precedences`, { predActiviteId, succActiviteId, typeLien });
  }

  async removePrecedence(chantierId: string, precedenceId: string): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${chantierId}/activites/precedences/${precedenceId}`);
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
