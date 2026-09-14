const MESSAGES: Record<string, string> = {
  'etudes.planning.activite_introuvable': 'Cette activité n’existe plus.',
  'etudes.planning.ressource_introuvable': 'Cette ressource n’existe plus.',
  'etudes.planning.dates_requises': 'Indiquez une date de début et une date de fin.',
  'etudes.planning.dates_invalides': 'La date de fin doit être après la date de début.',
  'etudes.planning.lot_introuvable': 'Ce lot n’existe plus dans le bordereau.',
  'etudes.planning.lot_pas_lot': 'Sélectionnez un lot ou un sous-lot.',
  'etudes.planning.lot_hors_dossier': 'Ce lot n’appartient pas à ce dossier.',
  'etudes.planning.quantite_invalide': 'La quantité doit être supérieure à 0.',
  'etudes.planning.type_invalide': 'Type de ressource inconnu.',
  'etudes.dossier.introuvable': 'Dossier introuvable.',
  'etudes.dossier.verrouille': 'Le dossier est verrouillé — saisie impossible.',
  'etudes.dossier.saisie_reservee_charge':
    'Seul le chargé d’étude (ou le responsable) peut saisir le planning.',
};

export function messagePlanningErreur(e: unknown): string {
  const err = e as { error?: { code?: string; message?: string }; message?: string };
  const code = err?.error?.code ?? '';
  if (code && MESSAGES[code]) return MESSAGES[code];
  const raw = err?.error?.message ?? err?.message ?? '';
  if (raw && MESSAGES[raw]) return MESSAGES[raw];
  return raw || 'Enregistrement impossible.';
}
