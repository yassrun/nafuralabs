import type { DeclencheurMaintenance } from '../models';

/** Prochain seuil compteur (h, km) ou identique pour calendrier (jours depuis dernier relevé). */
export function computeProchainSeuil(
  declencheur: DeclencheurMaintenance,
  dernierReleve: number,
  seuil: number,
): number {
  void declencheur;
  return dernierReleve + seuil;
}

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfWeekSunday(d: Date): Date {
  const s = startOfWeekMonday(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}

/** Compte les plans dont la prochaine échéance ISO tombe dans la semaine calendaire de `now` (lun–dim). */
export function countMaintenancesDueThisWeek(
  plans: ReadonlyArray<{ prochaineEcheanceIso?: string }>,
  now: Date,
): number {
  if (!plans.length) return 0;
  const ws = startOfWeekMonday(now);
  const we = endOfWeekSunday(now);
  return plans.filter((p) => {
    if (!p.prochaineEcheanceIso) return false;
    const t = new Date(`${p.prochaineEcheanceIso}T12:00:00`);
    return !Number.isNaN(t.getTime()) && t >= ws && t <= we;
  }).length;
}
