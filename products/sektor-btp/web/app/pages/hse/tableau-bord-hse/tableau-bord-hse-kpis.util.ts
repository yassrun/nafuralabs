import type { Formation, Incident, Inspection, NonConformite } from '@applications/erp/hse/models';

import type { HseKpiResponse } from './services/hse-kpi-api.service';

export interface HseDashboardKpis {
  at: number;
  tf: number;
  tg: number;
  ncOuvertes: number;
  ncCritiques: number;
  inspectionsMois: number;
  inspectionsPlannifieReste: number;
  formationsEnCours: number;
  epiExpires: number;
  joursSansAT: number;
}

const REFERENCE_TODAY = new Date('2026-05-09');
const START_YEAR = new Date('2026-01-01');

export function emptyHseDashboardKpis(): HseDashboardKpis {
  return {
    at: 0,
    tf: 0,
    tg: 0,
    ncOuvertes: 0,
    ncCritiques: 0,
    inspectionsMois: 0,
    inspectionsPlannifieReste: 0,
    formationsEnCours: 0,
    epiExpires: 0,
    joursSansAT: 0,
  };
}

export function buildHseDashboardKpis(input: {
  api?: HseKpiResponse | null;
  incidents: Incident[];
  ncs: NonConformite[];
  inspections: Inspection[];
  formations: Formation[];
}): HseDashboardKpis {
  const { api, incidents, ncs, inspections, formations } = input;

  const atYtd = incidents.filter(
    (i) =>
      new Date(i.date) >= START_YEAR &&
      (i.typeIncident === 'AT_TRAVAIL' || i.typeIncident === 'AT_TRAJET' || i.typeIncident === 'MP'),
  ).length;

  const ncOuvertes = ncs.filter((nc) => nc.status === 'OUVERTE' || nc.status === 'EN_COURS').length;
  const ncCritiques = ncs.filter(
    (nc) =>
      (nc.type === 'SECURITE' || nc.type === 'REGLEMENTAIRE') &&
      (nc.status === 'OUVERTE' || nc.status === 'EN_COURS'),
  ).length;

  const inspectionsMois = inspections.filter((i) => i.dateInspection.startsWith('2026-05')).length;
  const inspectionsPlannifieReste = inspections.filter((i) => i.status === 'PLANIFIEE').length;

  const formationsEnCours = formations.filter(
    (f) => f.status === 'EN_COURS' || f.status === 'PLANIFIEE',
  ).length;

  const joursOuvres = 85;
  const heuresTravaillees = api?.heuresTravaillees ?? 50 * 8 * joursOuvres;
  const tf =
    api?.tf2 ??
    (heuresTravaillees > 0 ? Math.round(atYtd * 1_000_000 / heuresTravaillees * 10) / 10 : 0);
  const joursArret = api?.pyramideBird?.atAvecArret ?? atYtd * 12;
  const tg =
    api?.tg ??
    (heuresTravaillees > 0 ? Math.round(joursArret * 1_000 / heuresTravaillees * 100) / 100 : 0);

  const lastAt = incidents
    .filter(
      (i) =>
        i.typeIncident === 'AT_TRAVAIL' || i.typeIncident === 'AT_TRAJET' || i.typeIncident === 'MP',
    )
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const joursSansAT =
    api?.joursSansAccident ??
    (lastAt
      ? Math.floor((REFERENCE_TODAY.getTime() - new Date(lastAt.date).getTime()) / 86400000)
      : joursOuvres);

  return {
    at: api?.pyramideBird?.at ?? atYtd,
    tf,
    tg,
    ncOuvertes,
    ncCritiques,
    inspectionsMois,
    inspectionsPlannifieReste,
    formationsEnCours,
    epiExpires: 0,
    joursSansAT,
  };
}
