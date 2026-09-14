import type { DossierEtude } from '@app/etudes/models';

export function idsActeurEgaux(a?: string | null, b?: string | null): boolean {
  const x = (a ?? '').trim().toLowerCase();
  const y = (b ?? '').trim().toLowerCase();
  return !!x && !!y && x === y;
}

/** Lot explicitement délégué à quelqu’un d’autre que l’acteur courant. */
export function lotAssigneAUnAutre(
  chargeLotUserId?: string | null,
  userId?: string | null,
  email?: string | null,
): boolean {
  const id = (chargeLotUserId ?? '').trim();
  if (!id) return false;
  return !idsActeurEgaux(id, userId) && !idsActeurEgaux(id, email);
}

/** Même personne (ou exécution absente = héritage) → pas d’avis d’exécution. */
export function memeResponsables(dossier: Pick<
  DossierEtude,
  'chargeEtudeUserId' | 'responsableExecutionUserId'
> | null | undefined): boolean {
  const etude = (dossier?.chargeEtudeUserId ?? '').trim();
  const exec = (dossier?.responsableExecutionUserId ?? '').trim();
  if (!etude) return true;
  if (!exec) return true;
  return idsActeurEgaux(etude, exec);
}

/** Chargé d’étude ou ingénieur à qui un lot est délégué. */
export function estMesEtudes(
  dossier: Pick<DossierEtude, 'chargeEtudeUserId' | 'lotChargeUserIds'> | null | undefined,
  userId?: string | null,
  email?: string | null,
): boolean {
  if (!dossier) return false;
  if (idsActeurEgaux(dossier.chargeEtudeUserId, userId) || idsActeurEgaux(dossier.chargeEtudeUserId, email)) {
    return true;
  }
  return (dossier.lotChargeUserIds ?? []).some(
    (id) => idsActeurEgaux(id, userId) || idsActeurEgaux(id, email),
  );
}

export function exigeAvisExecution(
  dossier: Pick<DossierEtude, 'chargeEtudeUserId' | 'responsableExecutionUserId'> | null | undefined,
): boolean {
  return !memeResponsables(dossier);
}
